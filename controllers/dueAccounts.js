import { getConnection, query } from "../configs/dbConn.js";
import { sendError, sendSuccess } from "../utils/apiResponse.js";
import { logUserWork } from "../utils/workTracking.js";

const getDueAccounts = async (req, res) => {
    const mode = String(req.query.mode || 'b2b').toLowerCase();
    const accountId = req.query.accountId;
    const invoiceId = String(req.query.invoiceId || '').trim();

    try {
        if (mode === 'b2b') {
            const accounts = await query(
                `SELECT
                    ca.id,
                    ca.account_name,
                    ca.address,
                    COUNT(oe.id) AS due_order_count,
                    COALESCE(SUM(oe.dueAmount), 0) AS total_due
                 FROM customer_account ca
                 LEFT JOIN order_entry oe
                    ON oe.customerAccountId = ca.id
                    AND LOWER(oe.orderType) = 'b2b'
                    AND COALESCE(oe.dueAmount, 0) > 0
                    AND COALESCE(oe.paymentStatus, '') = 'Due'
                 WHERE ca.is_active = 1
                 GROUP BY ca.id, ca.account_name, ca.address
                 HAVING COUNT(oe.id) > 0
                 ORDER BY total_due DESC, ca.account_name ASC`
            );

            const orderConditions = [
                `LOWER(orderType) = 'b2b'`,
                `COALESCE(dueAmount, 0) > 0`,
                `COALESCE(paymentStatus, '') = 'Due'`
            ];
            const orderParams = [];

            if (accountId) {
                orderConditions.push(`customerAccountId = ?`);
                orderParams.push(accountId);
            }
            if (invoiceId) {
                orderConditions.push(`id = ?`);
                orderParams.push(invoiceId);
            }

            const orders = (accountId || invoiceId)
                ? await query(
                    `SELECT
                        id, bookNumber, slipNumber, date, name, site, item, quantity, amount, totalAmount,
                        paymentStatus, dueAmount, customerAccountId, customerAccountName
                     FROM order_entry
                     WHERE ${orderConditions.join(' AND ')}
                     ORDER BY date DESC, id DESC`,
                    orderParams
                )
                : [];

            sendSuccess(res, "B2B due accounts fetched successfully.", { accounts, orders, mode: 'b2b' });
            return;
        }

        const rawAccounts = await query(
            `SELECT
                name AS account_name,
                site,
                COUNT(id) AS due_order_count,
                COALESCE(SUM(dueAmount), 0) AS total_due
             FROM order_entry
             WHERE LOWER(orderType) = 'standard'
               AND COALESCE(dueAmount, 0) > 0
               AND COALESCE(paymentStatus, '') = 'Due'
             GROUP BY name, site
             ORDER BY total_due DESC, name ASC`
        );

        const accounts = rawAccounts.map((account) => ({
            ...account,
            id: `${account.account_name}|||${account.site || ''}`
        }));

        const orderConditions = [
            `LOWER(orderType) = 'standard'`,
            `COALESCE(dueAmount, 0) > 0`,
            `COALESCE(paymentStatus, '') = 'Due'`
        ];
        const orderParams = [];

        if (accountId) {
            orderConditions.push(`name = ?`);
            orderConditions.push(`site = ?`);
            orderParams.push(...String(accountId).split('|||'));
        }
        if (invoiceId) {
            orderConditions.push(`id = ?`);
            orderParams.push(invoiceId);
        }

        const orders = (accountId || invoiceId)
            ? await query(
                `SELECT
                    id, bookNumber, slipNumber, date, name, site, item, quantity, amount, totalAmount,
                    paymentStatus, dueAmount
                 FROM order_entry
                 WHERE ${orderConditions.join(' AND ')}
                 ORDER BY date DESC, id DESC`,
                orderParams
            )
            : [];

        sendSuccess(res, "General due accounts fetched successfully.", { accounts, orders, mode: 'normal' });
    } catch (error) {
        console.error('Get due accounts failed', error);
        sendError(res, "Unable to fetch due accounts.", 500);
    }
};

const markDueOrderPaid = async (req, res) => {
    const { id, mode, updatedBy, updatedByUserId } = req.body || {};
    const actor = updatedBy || 'System';
    const normalizedMode = String(mode || 'normal').toLowerCase() === 'b2b' ? 'b2b' : 'standard';

    if (!id) {
        sendError(res, "Order id is required.");
        return;
    }

    const client = await getConnection();

    try {
        await client.beginTransaction();
        const [rows] = await client.execute(
            `SELECT paymentStatus, dueAmount, due_paid, cashCredit, bankCredit, totalAmount
             FROM order_entry
             WHERE id = ? AND LOWER(orderType) = ?`,
            [id, normalizedMode]
        );

        if (!rows.length) {
            await client.rollback();
            sendError(res, "Due order not found.", 404);
            return;
        }

        const previous = rows[0];
        const dueAmount = Number(previous.dueAmount || 0);
        const totalAmount = Number(previous.totalAmount || 0);
        const nextDuePaid = Number(previous.due_paid || 0) + dueAmount;

        await client.execute(
            `UPDATE order_entry
             SET paymentStatus = 'Paid',
                 dueAmount = 0,
                 due_paid = ?,
                 bankCredit = CASE WHEN COALESCE(bankCredit, 0) = 0 AND COALESCE(cashCredit, 0) = 0 THEN ? ELSE bankCredit END,
                 lastUpdatedBy = ?
             WHERE id = ? AND LOWER(orderType) = ?`,
            [nextDuePaid, totalAmount, actor, id, normalizedMode]
        );

        await client.execute(
            `INSERT INTO history(entryid, field, oldvalue, newvalue, createdby)
             VALUES (?, 'paymentstatus', ?, 'Paid', ?)`,
            [id, String(previous.paymentStatus || ''), actor]
        );
        await client.execute(
            `INSERT INTO history(entryid, field, oldvalue, newvalue, createdby)
             VALUES (?, 'dueamount', ?, '0', ?)`,
            [id, String(previous.dueAmount || 0), actor]
        );

        await client.commit();

        await logUserWork({
            userId: updatedByUserId || null,
            userName: actor,
            userEmail: actor.includes('@') ? actor : null,
            actionType: 'mark_due_paid',
            entityType: 'order',
            entityId: id,
            details: { mode: normalizedMode === 'b2b' ? 'b2b' : 'normal' }
        });

        sendSuccess(res, "Due order marked as paid.", { id });
    } catch (error) {
        await client.rollback();
        console.error('Mark due paid failed', error);
        sendError(res, "Unable to update due order.", 500);
    } finally {
        client.release();
    }
};

export { getDueAccounts, markDueOrderPaid };
