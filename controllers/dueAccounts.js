import { getConnection, query } from "../configs/dbConn.js";
import { sendError, sendSuccess } from "../utils/apiResponse.js";
import { logUserWork } from "../utils/workTracking.js";

const getDueAccounts = async (req, res) => {
    const mode = String(req.query.mode || 'b2b').toLowerCase();
    const accountId = req.query.accountId;

    try {
        if (mode === 'b2b') {
            const accounts = await query(
                `SELECT
                    ca.id,
                    ca.account_name,
                    ca.site,
                    COUNT(bo.id) AS due_order_count,
                    COALESCE(SUM(bo.dueAmount), 0) AS total_due
                 FROM customer_account ca
                 LEFT JOIN b2b_order_entry bo
                    ON bo.customerAccountId = ca.id
                    AND COALESCE(bo.dueAmount, 0) > 0
                    AND COALESCE(bo.paymentStatus, '') = 'Due'
                 WHERE ca.is_active = 1
                 GROUP BY ca.id, ca.account_name, ca.site
                 HAVING COUNT(bo.id) > 0
                 ORDER BY total_due DESC, ca.account_name ASC`
            );

            const orders = accountId
                ? await query(
                    `SELECT
                        id, bookNumber, slipNumber, date, name, site, item, quantity, amount, totalAmount,
                        paymentStatus, dueAmount, customerAccountId, customerAccountName
                     FROM b2b_order_entry
                     WHERE customerAccountId = ?
                       AND COALESCE(dueAmount, 0) > 0
                       AND COALESCE(paymentStatus, '') = 'Due'
                     ORDER BY date DESC, id DESC`,
                    [accountId]
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
             FROM normal_order_entry
             WHERE COALESCE(dueAmount, 0) > 0
               AND COALESCE(paymentStatus, '') = 'Due'
             GROUP BY name, site
             ORDER BY total_due DESC, name ASC`
        );

        const accounts = rawAccounts.map((account) => ({
            ...account,
            id: `${account.account_name}|||${account.site || ''}`
        }));

        const orders = accountId
            ? await query(
                `SELECT
                    id, bookNumber, slipNumber, date, name, site, item, quantity, amount, totalAmount,
                    paymentStatus, dueAmount
                 FROM normal_order_entry
                 WHERE name = ?
                   AND site = ?
                   AND COALESCE(dueAmount, 0) > 0
                   AND COALESCE(paymentStatus, '') = 'Due'
                 ORDER BY date DESC, id DESC`,
                String(accountId).split('|||')
            )
            : [];

        sendSuccess(res, "General due accounts fetched successfully.", { accounts, orders, mode: 'normal' });
    } catch (error) {
        console.error('Get due accounts failed', error);
        sendError(res, "Unable to fetch due accounts.", 500);
    }
};

const markDueOrderPaid = async (req, res) => {
    const { id, mode, updatedBy } = req.body || {};
    const tableName = String(mode || 'normal').toLowerCase() === 'b2b' ? 'b2b_order_entry' : 'normal_order_entry';
    const actor = updatedBy || 'System';

    if (!id) {
        sendError(res, "Order id is required.");
        return;
    }

    const client = await getConnection();

    try {
        await client.beginTransaction();
        const [rows] = await client.execute(
            `SELECT paymentStatus, dueAmount, due_paid, cashCredit, bankCredit, totalAmount
             FROM ${tableName}
             WHERE id = ?`,
            [id]
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
            `UPDATE ${tableName}
             SET paymentStatus = 'Paid',
                 dueAmount = 0,
                 due_paid = ?,
                 bankCredit = CASE WHEN COALESCE(bankCredit, 0) = 0 AND COALESCE(cashCredit, 0) = 0 THEN ? ELSE bankCredit END,
                 lastUpdatedBy = ?
             WHERE id = ?`,
            [nextDuePaid, totalAmount, actor, id]
        );

        await client.execute(
            `UPDATE entry
             SET paymentStatus = 'Paid',
                 dueAmount = 0,
                 due_paid = ?,
                 bankCredit = CASE WHEN COALESCE(bankCredit, 0) = 0 AND COALESCE(cashCredit, 0) = 0 THEN ? ELSE bankCredit END,
                 lastUpdatedBy = ?
             WHERE id = ?`,
            [nextDuePaid, totalAmount, actor, id]
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
            userName: actor,
            userEmail: actor.includes('@') ? actor : null,
            actionType: 'mark_due_paid',
            entityType: 'order',
            entityId: id,
            details: { mode: tableName === 'b2b_order_entry' ? 'b2b' : 'normal' }
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
