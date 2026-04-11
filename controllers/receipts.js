import { getConnection, query } from "../configs/dbConn.js";
import { sendError, sendSuccess } from "../utils/apiResponse.js";
import { logUserWork } from "../utils/workTracking.js";

const RECEIPT_DESK_EMAIL = 'receiptdesk@pke.local';

const resolvePrintedByUserId = async (printedBy, printedByUserId) => {
    if (printedByUserId) {
        return printedByUserId;
    }

    if (printedBy !== 'Receipt Desk') {
        return null;
    }

    const rows = await query(
        `SELECT id
         FROM app_user
         WHERE email = ?
         LIMIT 1`,
        [RECEIPT_DESK_EMAIL]
    );

    return rows[0]?.id || null;
}

const listReceipts = async (req, res) => {
    try {
        const pendingOnly = req.query.status === 'pending';
        const bookNumber = String(req.query.bookNumber || '').trim();
        const slipNumber = String(req.query.slipNumber || '').trim();
        const year = String(req.query.year || '').trim();
        const partyName = String(req.query.partyName || '').trim();
        const accountName = String(req.query.accountName || '').trim();
        const item = String(req.query.item || '').trim();
        const conditions = [];
        const values = [];

        if (pendingOnly) {
            conditions.push('is_printed = 0');
        }
        if (bookNumber) {
            conditions.push('bookNumber = ?');
            values.push(bookNumber);
        }
        if (slipNumber) {
            conditions.push('slipNumber = ?');
            values.push(slipNumber);
        }
        if (year) {
            conditions.push('id LIKE ?');
            values.push(`${year}/%`);
        }
        if (partyName) {
            conditions.push(`LOWER(name) LIKE LOWER(?)`);
            values.push(`%${partyName}%`);
        }
        if (accountName) {
            conditions.push(`customerAccountName = ?`);
            values.push(accountName);
        }
        if (item) {
            conditions.push(`item = ?`);
            values.push(item);
        }

        const rows = await query(
            `SELECT id, orderType, customerAccountName, customerGstin, bookNumber, slipNumber, source, date, name, site, item,
                    measurementUnit, quantity, gross, tare, net, rate, amount, freight, totalAmount, paymentStatus, dueAmount,
                    lorryNumber, remarks, is_printed, printed_by, createdDate, orderStatus
             FROM order_entry
             ${conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''}
             ORDER BY createdDate DESC, id DESC
             LIMIT 200`,
            values
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
    const printedByUserId = await resolvePrintedByUserId(printedBy, reqBody.printedByUserId || null);
    const shouldMarkPrinted = printedBy === 'Receipt Desk';

    if (!id) {
        sendError(res, "Order id is required.");
        return;
    }

    const client = await getConnection();

    try {
        await client.beginTransaction();
        const [entryRows] = await client.execute(
            `SELECT id, orderType, is_printed, printed_by
             FROM order_entry
             WHERE id = ?`,
            [id]
        );

        if (!entryRows.length) {
            await client.rollback();
            sendError(res, "Receipt not found.", 404);
            return;
        }

        const order = entryRows[0];
        if (shouldMarkPrinted) {
            await client.execute(
                `UPDATE order_entry
                 SET is_printed = 1, printed_by = ?, lastUpdatedBy = ?
                 WHERE id = ?`,
                [printedBy, printedBy, id]
            );

            if (!Number(order.is_printed)) {
                await client.execute(
                    `INSERT INTO history(entryid, field, oldvalue, newvalue, createdby)
                     VALUES (?, ?, ?, ?, ?)`,
                    [id, 'is_printed', 'No', 'Yes', printedBy]
                );
            }

            if (String(order.printed_by ?? '') !== String(printedBy ?? '')) {
                await client.execute(
                    `INSERT INTO history(entryid, field, oldvalue, newvalue, createdby)
                     VALUES (?, ?, ?, ?, ?)`,
                    [id, 'printed_by', String(order.printed_by ?? ''), String(printedBy ?? ''), printedBy]
                );
            }
        }

        await client.commit();

        await logUserWork({
            userId: printedByUserId,
            userName: printedBy,
            userEmail: printedBy === 'Receipt Desk' ? RECEIPT_DESK_EMAIL : (printedBy.includes('@') ? printedBy : null),
            actionType: 'print_order',
            entityType: 'order',
            entityId: id,
            details: {
                fromPrintedState: Number(order.is_printed),
                toPrintedState: shouldMarkPrinted ? 1 : Number(order.is_printed),
                printedBy,
                markedPrinted: shouldMarkPrinted
            }
        });

        if (!shouldMarkPrinted) {
            sendSuccess(res, "Receipt printed without updating the print status.");
            return;
        }

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
