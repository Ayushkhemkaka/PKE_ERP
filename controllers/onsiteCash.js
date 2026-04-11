import { getConnection, query } from "../configs/dbConn.js";
import { sendError, sendSuccess } from "../utils/apiResponse.js";
import { logUserWork } from "../utils/workTracking.js";
import { buildCollectedOnsiteState } from "../utils/paymentStatus.js";

const listPendingOnsiteCash = async (req, res) => {
    try {
        const rows = await query(
            `SELECT id, orderType, bookNumber, slipNumber, date, name, site, item, quantity, amount, totalAmount, dueAmount, cashCredit,
                    need_to_collect_cash, is_collected_cash_from_onsite
             FROM order_entry
             WHERE paymentStatus = 'CashOnsite'
               AND need_to_collect_cash = 1
               AND is_collected_cash_from_onsite = 0
             ORDER BY date DESC, id DESC`
        );

        sendSuccess(res, "Pending onsite cash orders fetched successfully.", rows);
    } catch (error) {
        console.error('List pending onsite cash failed', error);
        sendError(res, "Unable to fetch pending onsite cash orders.", 500);
    }
};

const markCollectedOnsiteCash = async (req, res) => {
    const actor = req.body?.updatedBy || 'System';
    const updatedByUserId = req.body?.updatedByUserId || null;
    const ids = Array.isArray(req.body?.ids) ? req.body.ids.filter(Boolean) : [];
    const client = await getConnection();

    try {
        if (!ids.length) {
            sendError(res, "Select at least one order to mark as collected.");
            return;
        }

        const placeholders = ids.map(() => '?').join(',');
        await client.beginTransaction();
        const [orders] = await client.execute(
            `SELECT id, orderType, totalAmount, dueAmount, due_on_create, cashCredit, bankCredit, need_to_collect_cash, is_collected_cash_from_onsite
             FROM order_entry
             WHERE paymentStatus = 'CashOnsite'
               AND need_to_collect_cash = 1
               AND is_collected_cash_from_onsite = 0
               AND id IN (${placeholders})
             ORDER BY date DESC, id DESC`,
            ids
        );

        if (!orders.length) {
            await client.rollback();
            sendSuccess(res, "No pending onsite cash orders were found.", { updatedCount: 0 });
            return;
        }

        for (const order of orders) {
            const next = buildCollectedOnsiteState(order);
            await client.execute(
                `UPDATE order_entry
                 SET need_to_collect_cash = ?, is_collected_cash_from_onsite = ?, lastUpdatedBy = ?
                 WHERE id = ?`,
                [
                    next.needToCollectCash ? 1 : 0,
                    next.isCollectedCashFromOnsite ? 1 : 0,
                    actor,
                    order.id
                ]
            );

            const historyEntries = [
                ['need_to_collect_cash', String(order.need_to_collect_cash || 0), String(next.needToCollectCash ? 1 : 0)],
                ['is_collected_cash_from_onsite', String(order.is_collected_cash_from_onsite || 0), String(next.isCollectedCashFromOnsite ? 1 : 0)]
            ].filter((entry) => entry[1] !== entry[2]);

            for (const [field, oldValue, newValue] of historyEntries) {
                await client.execute(
                    `INSERT INTO history(entryid, field, oldvalue, newvalue, createdby)
                     VALUES (?, ?, ?, ?, ?)`,
                    [order.id, field, oldValue, newValue, actor]
                );
            }
        }

        await client.commit();

        await logUserWork({
            userId: updatedByUserId,
            userName: actor,
            userEmail: actor.includes('@') ? actor : null,
            actionType: 'collect_onsite_cash',
            entityType: 'order',
            entityId: 'onsite-cash-selected',
            details: { updatedCount: orders.length, orderIds: orders.map((order) => order.id) }
        });

        sendSuccess(res, "Onsite cash marked as collected.", { updatedCount: orders.length });
    } catch (error) {
        await client.rollback();
        console.error('Mark onsite cash collected failed', error);
        sendError(res, "Unable to mark onsite cash as collected.", 500);
    } finally {
        client.release();
    }
};

export { listPendingOnsiteCash, markCollectedOnsiteCash };
