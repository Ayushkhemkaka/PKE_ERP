import { getConnection, query } from "../configs/dbConn.js";
import { sendError, sendSuccess } from "../utils/apiResponse.js";
import { logUserWork } from "../utils/workTracking.js";
import { getOrderTableName } from "../utils/orderTables.js";

const listReceipts = async (req, res) => {
    try {
        const pendingOnly = req.query.status === 'pending';
        const rows = await query(
            `SELECT id, orderType, customerAccountName, bookNumber, slipNumber, source, date, name, site, item,
                    measurementUnit, quantity, rate, amount, freight, totalAmount, paymentStatus, dueAmount, is_printed, printed_by, createdDate, orderStatus
             FROM entry
             ${pendingOnly ? 'WHERE is_printed = 0' : ''}
             ORDER BY createdDate DESC, id DESC
             LIMIT 50`
        );

        sendSuccess(res, "Receipts fetched successfully.", rows);
    } catch (error) {
        console.error('List receipts failed', error);
        sendError(res, "Unable to fetch receipts.", 500);
    }
}

const markReceiptPrinted = async (req, res) => {
    const reqBody = req.body || {};
    const id = reqBody.id;
    const printedBy = reqBody.printedBy || 'System';

    if (!id) {
        sendError(res, "Order id is required.");
        return;
    }

    const client = await getConnection();

    try {
        await client.beginTransaction();
        const [entryRows] = await client.execute(
            `SELECT id, orderType, is_printed, printed_by
             FROM entry
             WHERE id = ?`,
            [id]
        );

        if (!entryRows.length) {
            await client.rollback();
            sendError(res, "Receipt not found.", 404);
            return;
        }

        const order = entryRows[0];
        const targetTable = getOrderTableName(order.ordertype || order.orderType);

        await client.execute(
            `UPDATE entry
             SET is_printed = 1, printed_by = ?, lastUpdatedBy = ?
             WHERE id = ?`,
            [printedBy, printedBy, id]
        );

        await client.execute(
            `UPDATE ${targetTable}
             SET is_printed = 1, printed_by = ?, lastUpdatedBy = ?
             WHERE id = ?`,
            [printedBy, printedBy, id]
        );

        if (!Number(order.is_printed)) {
            await client.execute(
                `INSERT INTO history(entryid, field, oldvalue, newvalue, createdby)
                 VALUES (?, ?, ?, ?, ?)`,
                [id, 'is_printed', '0', '1', printedBy]
            );
        }

        if (String(order.printed_by ?? '') !== String(printedBy ?? '')) {
            await client.execute(
                `INSERT INTO history(entryid, field, oldvalue, newvalue, createdby)
                 VALUES (?, ?, ?, ?, ?)`,
                [id, 'printed_by', String(order.printed_by ?? ''), String(printedBy ?? ''), printedBy]
            );
        }

        await client.commit();

        await logUserWork({
            userName: printedBy,
            userEmail: printedBy.includes('@') ? printedBy : null,
            actionType: 'print_order',
            entityType: 'order',
            entityId: id,
            details: {
                fromPrintedState: Number(order.is_printed),
                toPrintedState: 1,
                printedBy
            }
        });

        sendSuccess(res, Number(order.is_printed) ? "Receipt was already marked as printed." : "Receipt marked as printed.");
    } catch (error) {
        await client.rollback();
        console.error('Mark receipt printed failed', error);
        sendError(res, "Unable to update receipt print status.", 500);
    } finally {
        client.release();
    }
}

export { listReceipts, markReceiptPrinted };
