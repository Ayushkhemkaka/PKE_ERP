import { getConnection } from "../configs/dbConn.js"
import { sendError, sendSuccess } from "../utils/apiResponse.js";
import { logUserWork } from "../utils/workTracking.js";
import { normalizeOrderMode } from "../utils/orderTables.js";

const update = async (req,res) =>{
    const reqBody = req.body?.body || req.body || {};
    const updatedBy = reqBody.updatedBy || 'System';
    const updatedByUserId = reqBody.updatedByUserId || null;
    const orderMode = normalizeOrderMode(reqBody.mode);
    const targetTable = 'order_entry';

    if (!reqBody.id) {
        sendError(res, "Order id is required.");
        return;
    }

    const client = await getConnection();

    try {
        await client.beginTransaction();
        const [currentResult] = await client.execute(
            `SELECT id, quantity, gross, tare, net, rate, amount, discount, freight, taxpercent, taxamount, totalamount,
                    paymentstatus, orderstatus, cancelledat, cancelledby, dueamount, due_on_create, due_paid, cashcredit, bankcredit
             FROM ${targetTable}
             WHERE id = ?`,
            [reqBody.id]
        );

        if (currentResult.length === 0) {
            await client.rollback();
            sendError(res, "Order not found.", 404);
            return;
        }

        const previous = currentResult[0];
        const isCancellation = reqBody.action === 'cancel';
        const dueOnCreate = Number(previous.due_on_create || reqBody.due_on_create || reqBody.dueamount || 0);
        const nextDueAmount = Number(reqBody.dueamount || 0);
        const nextOrderStatus = isCancellation ? 'Cancelled' : (previous.orderstatus || 'Active');
        const nextCancelledAt = isCancellation ? new Date() : previous.cancelledat;
        const nextCancelledBy = isCancellation ? updatedBy : previous.cancelledby;
        const next = {
            quantity: reqBody.quantity || 0,
            gross: reqBody.gross || 0,
            tare: reqBody.tare || 0,
            net: reqBody.net || 0,
            rate: reqBody.rate || 0,
            amount: reqBody.amount || 0,
            discount: reqBody.discount || 0,
            freight: reqBody.freight || 0,
            taxpercent: reqBody.taxpercent || 0,
            taxamount: reqBody.taxamount || 0,
            totalamount: reqBody.totalamount || 0,
            paymentstatus: reqBody.paymentstatus,
            orderstatus: nextOrderStatus,
            cancelledat: nextCancelledAt,
            cancelledby: nextCancelledBy,
            dueamount: reqBody.dueamount || 0,
            due_on_create: dueOnCreate,
            due_paid: Math.max(dueOnCreate - nextDueAmount, 0),
            cashcredit: reqBody.cashcredit || 0,
            bankcredit: reqBody.bankcredit || 0
        };

        await client.execute(
            `UPDATE ${targetTable}
             SET quantity = ?, gross = ?, tare = ?, net = ?, rate = ?, amount = ?, discount = ?, freight = ?, taxpercent = ?, taxamount = ?,
                 totalamount = ?, paymentstatus = ?, orderstatus = ?, cancelledat = ?, cancelledby = ?, dueamount = ?, due_on_create = ?, due_paid = ?, cashcredit = ?,
                 bankcredit = ?, lastupdatedby = ?
             WHERE id = ?`,
            [
                next.quantity,
                next.gross,
                next.tare,
                next.net,
                next.rate,
                next.amount,
                next.discount,
                next.freight,
                next.taxpercent,
                next.taxamount,
                next.totalamount,
                next.paymentstatus,
                next.orderstatus,
                next.cancelledat,
                next.cancelledby,
                next.dueamount,
                next.due_on_create,
                next.due_paid,
                next.cashcredit,
                next.bankcredit,
                updatedBy,
                reqBody.id
            ]
        );

        const historyEntries = Object.keys(next)
            .filter((key) => String(previous[key] ?? '') !== String(next[key] ?? ''))
            .map((key) => ({
                field: key,
                oldValue: previous[key],
                newValue: next[key]
            }));

        for (const entry of historyEntries) {
            await client.execute(
                `INSERT INTO history(entryid, field, oldvalue, newvalue, createdby)
                 VALUES (?, ?, ?, ?, ?)`,
                [reqBody.id, entry.field, String(entry.oldValue ?? ''), String(entry.newValue ?? ''), updatedBy]
            );
        }

        await client.commit();
        await logUserWork({
            userId: updatedByUserId,
            userName: updatedBy,
            userEmail: updatedBy.includes('@') ? updatedBy : null,
            actionType: isCancellation ? 'cancel_order' : 'update_order',
            entityType: 'order',
            entityId: reqBody.id,
            details: {
                mode: orderMode,
                action: isCancellation ? 'cancel' : 'update',
                historyCount: historyEntries.length,
                changedFields: historyEntries.map((entry) => entry.field)
            }
        });
        sendSuccess(res, isCancellation ? "Order cancelled successfully." : "Data updated successfully.", { id: reqBody.id, historyCount: historyEntries.length });
    } catch (error) {
        await client.rollback();
        console.error('Update failed', error);
        sendError(res, "Unable to update order data.", 500);
    } finally {
        client.release();
    }
}

export {update}
