import { query as executeQuery } from "../configs/dbConn.js"
import { sendError, sendSuccess } from "../utils/apiResponse.js";
import { getOrderTableName, normalizeOrderMode, ORDER_MODES } from "../utils/orderTables.js";

const baseColumns = ['id', 'date', 'name', 'lorrynumber', 'item', 'quantity'];
const allowedColumns = new Set([
    'booknumber', 'slipnumber', 'source', 'site', 'measurementunit', 'rate',
    'amount', 'discount', 'freight', 'taxpercent', 'taxamount',
    'totalamount', 'paymentstatus', 'dueamount', 'cashcredit', 'bankcredit',
    'ordertype', 'customeraccountname', 'customergstin', 'due_on_create', 'due_paid', 'orderstatus', 'is_printed', 'printed_by',
    'gross', 'tare', 'net', 'remarks'
]);

const normalizeRows = (rows) => rows.map((row) => ({
    ...row,
    date: row.date ? new Date(row.date).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }) : row.date,
    key: row.id,
    selected: false
}));

const getSelectedColumns = (columns) => {
    const rawColumns = Array.isArray(columns) ? columns : [columns].filter(Boolean);
    const normalized = rawColumns
        .flatMap((value) => typeof value === 'string' ? value.split(',') : [])
        .map((value) => value.trim().toLowerCase())
        .filter((value) => allowedColumns.has(value));

    return [...baseColumns, ...new Set(normalized)];
}

const find = async (req,res) =>{
    const mode = normalizeOrderMode(req.query.mode);
    const selectedColumns = getSelectedColumns(req.query.columns);
    const conditions = [];
    const values = [];
    const tableName = mode === ORDER_MODES.all ? 'entry' : getOrderTableName(mode);

    if(req.query.bookNumber){
        conditions.push(`booknumber = ?`);
        values.push(req.query.bookNumber);
    }
    if(req.query.dateStart){
        conditions.push(`date >= ?`);
        values.push(req.query.dateStart);
    }
    if(req.query.dateEnd){
        conditions.push(`date <= ?`);
        values.push(req.query.dateEnd);
    }
    if(req.query.name){
        conditions.push(`LOWER(name) LIKE LOWER(?)`);
        values.push(`%${req.query.name}%`);
    }
    if(req.query.lorryNumber){
        conditions.push(`LOWER(lorrynumber) LIKE LOWER(?)`);
        values.push(`%${req.query.lorryNumber}%`);
    }
    if(req.query.paymentStatus){
        conditions.push(`paymentstatus = ?`);
        values.push(req.query.paymentStatus);
    }
    if(req.query.item){
        conditions.push(`LOWER(item) LIKE LOWER(?)`);
        values.push(`%${req.query.item}%`);
    }
    if(req.query.source){
        conditions.push(`LOWER(source) LIKE LOWER(?)`);
        values.push(`%${req.query.source}%`);
    }
    if(req.query.customerAccountName){
        conditions.push(`LOWER(customeraccountname) LIKE LOWER(?)`);
        values.push(`%${req.query.customerAccountName}%`);
    }

    const sql = `
        SELECT ${selectedColumns.join(', ')}
        FROM ${tableName}
        ${conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''}
        ORDER BY date DESC, id DESC
    `;

    try {
        const result = await executeQuery(sql, values);
        sendSuccess(res, "Orders fetched successfully.", normalizeRows(result).map((row) => ({ ...row, ordermode: mode })));
    } catch (error) {
        console.error('Find failed', error);
        sendError(res, "Unable to fetch order data.", 500);
    }
}

const findById = async (req,res) =>{
    const id = req.query.Id;
    const mode = normalizeOrderMode(req.query.mode);
    if (!id) {
        sendError(res, "Order id is required.");
        return;
    }

    try {
        const tableName = mode === ORDER_MODES.all ? 'entry' : getOrderTableName(mode);
        const result = await executeQuery(`SELECT * FROM ${tableName} WHERE id = ?`, [id]);
        if (result.length === 0) {
            sendError(res, "Order not found.", 404);
            return;
        }
        sendSuccess(res, "Order fetched successfully.", normalizeRows(result).map((row) => ({ ...row, ordermode: mode })));
    } catch (error) {
        console.error('Find by id failed', error);
        sendError(res, "Unable to fetch order details.", 500);
    }
}
export {find, findById}
