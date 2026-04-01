import { getConnection } from "../configs/dbConn.js";
import { sendError, sendSuccess } from "../utils/apiResponse.js";
import { buildEntryId, getNextBookSlip } from "./insert.js";
import { logUserWork } from "../utils/workTracking.js";
import { fetchCatalogRows } from "./items.js";

const parseNumber = (value) => {
    const numericValue = Number(value ?? 0);
    return Number.isNaN(numericValue) ? 0 : numericValue;
};

const normalizeImportRow = (row) => {
    const item = row.item || row.Item || row.ITEM || '';
    const measurementUnit = row.measurementUnit || row['Measurement Unit'] || row.measurement_unit || '';
    return {
        date: row.date || row.Date,
        name: row.name || row.Name,
        site: row.site || row.Site || '',
        lorryNumber: row.lorryNumber || row['Lorry Number'] || '',
        item,
        measurementUnit,
        quantity: parseNumber(row.quantity || row.Quantity),
        rate: parseNumber(row.rate || row.Rate),
        amount: parseNumber(row.amount || row.Amount),
        discount: parseNumber(row.discount || row.Discount),
        freight: parseNumber(row.freight || row.Freight),
        taxPercent: parseNumber(row.taxPercent || row['Tax Percent']),
        taxAmount: parseNumber(row.taxAmount || row['Tax Amount']),
        totalAmount: parseNumber(row.totalAmount || row.Total || row['Total Amount']),
        paymentStatus: row.paymentStatus || row['Payment Status'] || 'Cash',
        dueAmount: parseNumber(row.dueAmount || row['Due Amount']),
        cashCredit: parseNumber(row.cashCredit || row['Cash Credit']),
        bankCredit: parseNumber(row.bankCredit || row['Bank Credit']),
        source: row.source || row.Source || 'Plant'
    };
};

const importOrders = async (req, res) => {
    const rows = Array.isArray(req.body?.rows) ? req.body.rows : [];
    const createdBy = req.body?.createdBy || 'System';
    const createdByUserId = req.body?.createdByUserId || null;

    if (!rows.length) {
        sendError(res, "No rows were provided for import.");
        return;
    }

    const client = await getConnection();

    try {
        await client.beginTransaction();
        const insertedIds = [];
        const itemCatalog = await fetchCatalogRows({ includeInactive: true });

        for (const rawRow of rows) {
            const row = normalizeImportRow(rawRow);
            if (!row.date || !row.name || !row.item || !row.measurementUnit || !row.quantity) {
                continue;
            }

            const selectedItem = itemCatalog.find((catalogItem) => catalogItem.itemName === row.item);
            const selectedRate = selectedItem?.measurementUnits?.find((unit) => unit.measurementUnitName === row.measurementUnit) || null;
            const nextSequence = await getNextBookSlip(client, row.date);
            const id = buildEntryId(nextSequence.bookNumber, nextSequence.slipNumber, row.date);

            await client.execute(
                `INSERT INTO order_entry(
                    id, bookNumber, orderType, customerAccountId, customerAccountName, itemId, measurementUnitId, itemRateId, customerGstin,
                    date, name, site, lorryNumber, item, measurementUnit,
                    quantity, gross, tare, net, rate, amount, discount, freight, taxPercent, taxAmount, totalAmount,
                    paymentStatus, dueAmount, due_on_create, due_paid, cashCredit, bankCredit, source, remarks, slipNumber, lastUpdatedBy, createdBy
                ) VALUES (
                    ?, ?, ?, ?, ?, ?, ?, ?, ?,
                    ?, ?, ?, ?, ?, ?,
                    ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                    ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
                )`,
                [
                    id,
                    nextSequence.bookNumber,
                    'Standard',
                    null,
                    null,
                    selectedItem?.id || null,
                    selectedRate?.measurementUnitId || selectedItem?.defaultMeasurementUnitId || null,
                    selectedRate?.itemRateId || null,
                    null,
                    row.date,
                    row.name,
                    row.site,
                    row.lorryNumber,
                    row.item,
                    row.measurementUnit,
                    row.quantity,
                    0,
                    0,
                    row.quantity,
                    row.rate,
                    row.amount,
                    row.discount,
                    row.freight,
                    row.taxPercent,
                    row.taxAmount,
                    row.totalAmount,
                    row.paymentStatus,
                    row.dueAmount,
                    row.dueAmount,
                    0,
                    row.cashCredit,
                    row.bankCredit,
                    row.source,
                    '',
                    nextSequence.slipNumber,
                    createdBy,
                    createdBy
                ]
            );

            insertedIds.push(id);
        }

        await client.commit();
        await logUserWork({
            userId: createdByUserId,
            userName: createdBy,
            userEmail: createdBy.includes('@') ? createdBy : null,
            actionType: 'import_orders',
            entityType: 'order',
            details: { count: insertedIds.length, ids: insertedIds.slice(0, 20) }
        });
        sendSuccess(res, "Orders imported successfully.", { count: insertedIds.length, ids: insertedIds });
    } catch (error) {
        await client.rollback();
        console.error('Import orders failed', error);
        sendError(res, "Unable to import orders.", 500);
    } finally {
        client.release();
    }
};

export { importOrders };
