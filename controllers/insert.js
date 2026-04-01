import { query } from "../configs/dbConn.js"
import { sendError, sendSuccess } from "../utils/apiResponse.js";
import { logUserWork } from "../utils/workTracking.js";

const requiredFields = ['date', 'name', 'site', 'lorryNumber', 'item', 'measurementUnit', 'source'];
const toNumber = (value, fallback = 0) => {
    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) ? parsedValue : fallback;
}
const calculateDuePaid = (dueOnCreate, dueAmount) => Math.max(toNumber(dueOnCreate) - toNumber(dueAmount), 0);
const formatDateKey = (value) => new Date(value).toISOString().slice(0, 10);
const getFinancialYearStart = (dateValue) => {
    const date = new Date(dateValue);
    const year = date.getMonth() >= 3 ? date.getFullYear() : date.getFullYear() - 1;
    return `${year}-04-01`;
}
const getFinancialYearEnd = (dateValue) => {
    const date = new Date(dateValue);
    const year = date.getMonth() >= 3 ? date.getFullYear() + 1 : date.getFullYear();
    return `${year}-03-31`;
}

const buildEntryId = (bookNumber, slipNumber, dateValue) => {
    const date = new Date(dateValue);
    let yearPart = date.getFullYear();
    const monthPart = date.getMonth() + 1;
    if (monthPart <= 3) {
        yearPart -= 1;
    }
    const financialYear = `${yearPart}/${String(yearPart + 1).slice(-2)}`;
    return `${financialYear}_${bookNumber}_${slipNumber}`;
}

const getNextBookSlip = async (db = null, dateValue = new Date()) => {
    const executor = db ? ((sql, params) => db.execute(sql, params).then(([rows]) => rows)) : query;
    const startDate = getFinancialYearStart(dateValue);
    const endDate = getFinancialYearEnd(dateValue);
    const rows = await executor(
        `SELECT booknumber, slipnumber
         FROM order_entry
         WHERE date BETWEEN ? AND ?
         ORDER BY booknumber DESC, slipnumber DESC
         LIMIT 1`,
        [startDate, endDate]
    );

    if (!rows.length) {
        return { bookNumber: 1, slipNumber: 1 };
    }

    const latest = rows[0];
    if (Number(latest.slipnumber) >= 50) {
        return { bookNumber: Number(latest.booknumber) + 1, slipNumber: 1 };
    }

    return { bookNumber: Number(latest.booknumber), slipNumber: Number(latest.slipnumber) + 1 };
}

const insert = async (req,res) =>{
    const reqBody = req.body?.body || req.body || {};

    for (const field of requiredFields) {
        if (reqBody[field] === undefined || reqBody[field] === null || reqBody[field] === '') {
            sendError(res, `${field} is required.`);
            return;
        }
    }

    const orderType = reqBody.orderType === 'B2B' ? 'B2B' : 'Standard';
    if (orderType === 'Standard' && toNumber(reqBody.totalAmount) <= 0) {
        sendError(res, "totalAmount must be greater than 0 for cash orders.");
        return;
    }

    if (orderType === 'Standard' && !reqBody.paymentStatus) {
        sendError(res, "paymentStatus is required for cash orders.");
        return;
    }

    const createdBy = reqBody.createdBy || 'System';
    const createdByUserId = reqBody.createdByUserId || null;
    const nextSequence = await getNextBookSlip(null, reqBody.date);
    reqBody.bookNumber = nextSequence.bookNumber;
    reqBody.slipNumber = nextSequence.slipNumber;
    const dueOnCreate = toNumber(reqBody.dueOnCreate ?? reqBody.dueAmount);
    const duePaid = calculateDuePaid(dueOnCreate, reqBody.dueAmount);
    const id = buildEntryId(reqBody.bookNumber, reqBody.slipNumber, reqBody.date);
    const values = [
        id,
        reqBody.bookNumber,
        orderType,
        reqBody.customerAccountId || null,
        reqBody.customerAccountName || null,
        reqBody.itemId || null,
        reqBody.measurementUnitId || null,
        reqBody.itemRateId || null,
        reqBody.customerGstin || null,
        reqBody.date,
        reqBody.name,
        reqBody.site,
        reqBody.lorryNumber,
        reqBody.item,
        reqBody.measurementUnit,
        toNumber(reqBody.quantity),
        toNumber(reqBody.gross),
        toNumber(reqBody.tare),
        toNumber(reqBody.net),
        toNumber(reqBody.rate),
        toNumber(reqBody.amount),
        toNumber(reqBody.discount),
        toNumber(reqBody.freight),
        toNumber(reqBody.taxPercent),
        toNumber(reqBody.taxAmount),
        toNumber(reqBody.totalAmount),
        reqBody.paymentStatus,
        toNumber(reqBody.dueAmount),
        dueOnCreate,
        duePaid,
        toNumber(reqBody.cashCredit),
        toNumber(reqBody.bankCredit),
        reqBody.source,
        reqBody.remarks || '',
        reqBody.slipNumber,
        createdBy,
        createdBy
    ];

    try {
        await query(
            `INSERT INTO order_entry(
                id, bookNumber, orderType, customerAccountId, customerAccountName, itemId, measurementUnitId, itemRateId, customerGstin, date, name, site, lorryNumber, item, measurementUnit,
                quantity, gross, tare, net, rate, amount, discount, freight, taxPercent, taxAmount, totalAmount,
                paymentStatus, dueAmount, due_on_create, due_paid, cashCredit, bankCredit, source, remarks, slipNumber, lastUpdatedBy, createdBy
            ) VALUES (
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
            )`,
            values
        );

        await logUserWork({
            userId: createdByUserId,
            userName: createdBy,
            userEmail: createdBy.includes('@') ? createdBy : null,
            actionType: 'create_order',
            entityType: 'order',
            entityId: id,
            details: {
                bookNumber: reqBody.bookNumber,
                slipNumber: reqBody.slipNumber,
                orderType,
                itemId: reqBody.itemId || null,
                measurementUnitId: reqBody.measurementUnitId || null,
                itemRateId: reqBody.itemRateId || null,
                item: reqBody.item,
                measurementUnit: reqBody.measurementUnit,
                gross: toNumber(reqBody.gross),
                tare: toNumber(reqBody.tare),
                net: toNumber(reqBody.net),
                customerAccountName: reqBody.customerAccountName || null
            }
        });

        sendSuccess(res, "Data inserted successfully.", { id });
    } catch (error) {
        console.error('Insert failed', error);
        if (error.code === 'ER_DUP_ENTRY' || error.code === '23505') {
            sendError(res, "This invoice already exists.", 409);
            return;
        }
        sendError(res, "Unable to insert order data.", 500);
    }
}

const nextSequence = async (req, res) => {
    try {
        const sequence = await getNextBookSlip(null, req.query.date || new Date());
        sendSuccess(res, "Next book and slip numbers fetched successfully.", sequence);
    } catch (error) {
        console.error('Next sequence failed', error);
        sendError(res, "Unable to calculate the next book and slip number.", 500);
    }
}

export {insert, buildEntryId, getNextBookSlip, nextSequence, formatDateKey}
