import { getConnection, query } from "../configs/dbConn.js";
import { sendError, sendSuccess } from "../utils/apiResponse.js";
import { logUserWork } from "../utils/workTracking.js";

const toNumber = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeBooleanFlag = (value) => {
    if (value === true || value === 1 || value === '1' || value === 'true') {
        return 1;
    }
    return 0;
};

const fetchCatalogRows = async ({ includeInactive = false } = {}) => {
    const rows = await query(
        `SELECT
            i.id AS item_id,
            i.item_name,
            i.is_active AS item_is_active,
            i.default_measurement_unit_id,
            mu_default.unit_name AS default_measurement_unit_name,
            ir.id AS item_rate_id,
            ir.rate,
            ir.is_active AS rate_is_active,
            mu.id AS measurement_unit_id,
            mu.unit_name AS measurement_unit_name,
            mu.is_active AS measurement_unit_is_active,
            ir.updated_by
         FROM item i
         LEFT JOIN measurement_unit mu_default ON mu_default.id = i.default_measurement_unit_id
         LEFT JOIN item_rate ir ON ir.item_id = i.id
         LEFT JOIN measurement_unit mu ON mu.id = ir.measurement_unit_id
         ${includeInactive ? '' : 'WHERE i.is_active = 1'}
         ORDER BY i.item_name ASC, mu.unit_name ASC`
    );

    const grouped = new Map();

    for (const row of rows) {
        if (!grouped.has(row.item_id)) {
            grouped.set(row.item_id, {
                id: row.item_id,
                itemName: row.item_name,
                isActive: Boolean(row.item_is_active),
                defaultMeasurementUnitId: row.default_measurement_unit_id,
                defaultMeasurementUnitName: row.default_measurement_unit_name || '',
                defaultRate: 0,
                measurementUnits: []
            });
        }

        if (row.measurement_unit_id) {
            const current = grouped.get(row.item_id);
            const unit = {
                itemRateId: row.item_rate_id,
                measurementUnitId: row.measurement_unit_id,
                measurementUnitName: row.measurement_unit_name,
                isActive: Boolean(row.measurement_unit_is_active) && Boolean(row.rate_is_active),
                rate: toNumber(row.rate),
                updatedBy: row.updated_by || 'System'
            };
            current.measurementUnits.push(unit);

            if (row.measurement_unit_id === row.default_measurement_unit_id) {
                current.defaultRate = toNumber(row.rate);
            }
        }
    }

    return Array.from(grouped.values()).map((item) => {
        const activeUnits = item.measurementUnits.filter((unit) => unit.isActive);
        const defaultUnit = activeUnits.find((unit) => unit.measurementUnitId === item.defaultMeasurementUnitId) || activeUnits[0] || item.measurementUnits[0] || null;
        return {
            ...item,
            defaultMeasurementUnitId: defaultUnit?.measurementUnitId || item.defaultMeasurementUnitId || null,
            defaultMeasurementUnitName: defaultUnit?.measurementUnitName || item.defaultMeasurementUnitName || '',
            defaultRate: defaultUnit ? toNumber(defaultUnit.rate) : toNumber(item.defaultRate),
            measurementUnits: includeInactive ? item.measurementUnits : activeUnits
        };
    });
};

const listItemCatalog = async (req, res) => {
    try {
        const items = await fetchCatalogRows({ includeInactive: req.query.includeInactive === 'true' });
        sendSuccess(res, "Item catalog fetched successfully.", items);
    } catch (error) {
        console.error('List item catalog failed', error);
        sendError(res, "Unable to fetch item catalog.", 500);
    }
};

const listMeasurementUnits = async (req, res) => {
    try {
        const includeInactive = req.query.includeInactive === 'true';
        const units = await query(
            `SELECT id, unit_name, is_active, created_by, updated_by, created_at, updated_at
             FROM measurement_unit
             ${includeInactive ? '' : 'WHERE is_active = 1'}
             ORDER BY unit_name ASC`
        );
        sendSuccess(res, "Measurement units fetched successfully.", units);
    } catch (error) {
        console.error('List measurement units failed', error);
        sendError(res, "Unable to fetch measurement units.", 500);
    }
};

const createMeasurementUnit = async (req, res) => {
    const body = req.body || {};
    const unitName = String(body.unitName || '').trim();
    const updatedBy = body.updatedBy || 'System';
    const updatedByUserId = body.updatedByUserId || null;

    if (!unitName) {
        sendError(res, "Measurement unit name is required.");
        return;
    }

    try {
        await query(
            `INSERT INTO measurement_unit(unit_name, created_by, updated_by)
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE is_active = 1, updated_by = VALUES(updated_by), updated_at = CURRENT_TIMESTAMP`,
            [unitName, updatedBy, updatedBy]
        );

        await logUserWork({
            userId: updatedByUserId,
            userName: updatedBy,
            userEmail: updatedBy.includes('@') ? updatedBy : null,
            actionType: 'create_measurement_unit',
            entityType: 'measurement_unit',
            entityId: unitName,
            details: { unitName }
        });

        sendSuccess(res, "Measurement unit saved successfully.");
    } catch (error) {
        console.error('Create measurement unit failed', error);
        sendError(res, "Unable to save measurement unit.", 500);
    }
};

const createItem = async (req, res) => {
    const body = req.body || {};
    const itemName = String(body.itemName || '').trim();
    const measurementUnitId = Number(body.measurementUnitId);
    const rate = toNumber(body.rate);
    const updatedBy = body.updatedBy || 'System';
    const updatedByUserId = body.updatedByUserId || null;

    if (!itemName || !measurementUnitId) {
        sendError(res, "Item name and default measurement unit are required.");
        return;
    }

    const client = await getConnection();

    try {
        await client.beginTransaction();

        await client.execute(
            `INSERT INTO item(item_name, default_measurement_unit_id, created_by, updated_by)
             VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
                default_measurement_unit_id = VALUES(default_measurement_unit_id),
                is_active = 1,
                updated_by = VALUES(updated_by),
                updated_at = CURRENT_TIMESTAMP`,
            [itemName, measurementUnitId, updatedBy, updatedBy]
        );

        const [itemRows] = await client.execute(
            `SELECT id, item_name, default_measurement_unit_id FROM item WHERE item_name = ?`,
            [itemName]
        );

        const itemId = itemRows[0]?.id;
        const [measurementRows] = await client.execute(
            `SELECT unit_name FROM measurement_unit WHERE id = ?`,
            [measurementUnitId]
        );

        if (!itemId || !measurementRows.length) {
            await client.rollback();
            sendError(res, "Unable to create item with the selected measurement unit.", 500);
            return;
        }

        await client.execute(
            `INSERT INTO item_rate(item_id, measurement_unit_id, item_name, measurement_unit, rate, is_active, created_by, updated_by)
             VALUES (?, ?, ?, ?, ?, 1, ?, ?)
             ON DUPLICATE KEY UPDATE
                item_name = VALUES(item_name),
                measurement_unit = VALUES(measurement_unit),
                rate = VALUES(rate),
                is_active = 1,
                updated_by = VALUES(updated_by),
                updated_at = CURRENT_TIMESTAMP`,
            [itemId, measurementUnitId, itemName, measurementRows[0].unit_name, rate, updatedBy, updatedBy]
        );

        const [rateRows] = await client.execute(
            `SELECT id, rate FROM item_rate WHERE item_id = ? AND measurement_unit_id = ?`,
            [itemId, measurementUnitId]
        );

        if (rateRows.length) {
            await client.execute(
                `INSERT INTO items_history(item_rate_id, item_id, measurement_unit_id, old_rate, new_rate, changed_by)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [rateRows[0].id, itemId, measurementUnitId, 0, rateRows[0].rate, updatedBy]
            );
        }

        await client.commit();

        await logUserWork({
            userId: updatedByUserId,
            userName: updatedBy,
            userEmail: updatedBy.includes('@') ? updatedBy : null,
            actionType: 'create_item',
            entityType: 'item',
            entityId: itemId,
            details: { itemName, measurementUnitId, rate }
        });

        sendSuccess(res, "Item saved successfully.", { id: itemId });
    } catch (error) {
        await client.rollback();
        console.error('Create item failed', error);
        sendError(res, "Unable to save item.", 500);
    } finally {
        client.release();
    }
};

const updateItemRate = async (req, res) => {
    const body = req.body || {};
    const itemId = Number(body.itemId);
    const measurementUnitId = Number(body.measurementUnitId);
    const rate = toNumber(body.rate);
    const updatedBy = body.updatedBy || 'System';
    const updatedByUserId = body.updatedByUserId || null;
    const setAsDefault = normalizeBooleanFlag(body.setAsDefault);

    if (!itemId || !measurementUnitId) {
        sendError(res, "Item and measurement unit are required.");
        return;
    }

    const client = await getConnection();

    try {
        await client.beginTransaction();

        const [itemRows] = await client.execute(
            `SELECT item_name FROM item WHERE id = ?`,
            [itemId]
        );
        const [unitRows] = await client.execute(
            `SELECT unit_name FROM measurement_unit WHERE id = ?`,
            [measurementUnitId]
        );

        if (!itemRows.length || !unitRows.length) {
            await client.rollback();
            sendError(res, "Item or measurement unit not found.", 404);
            return;
        }

        const [existingRows] = await client.execute(
            `SELECT id, rate FROM item_rate WHERE item_id = ? AND measurement_unit_id = ?`,
            [itemId, measurementUnitId]
        );

        const oldRate = existingRows[0] ? toNumber(existingRows[0].rate) : 0;

        await client.execute(
            `INSERT INTO item_rate(item_id, measurement_unit_id, item_name, measurement_unit, rate, is_active, created_by, updated_by)
             VALUES (?, ?, ?, ?, ?, 1, ?, ?)
             ON DUPLICATE KEY UPDATE
                item_name = VALUES(item_name),
                measurement_unit = VALUES(measurement_unit),
                rate = VALUES(rate),
                is_active = 1,
                updated_by = VALUES(updated_by),
                updated_at = CURRENT_TIMESTAMP`,
            [itemId, measurementUnitId, itemRows[0].item_name, unitRows[0].unit_name, rate, updatedBy, updatedBy]
        );

        const [updatedRows] = await client.execute(
            `SELECT id FROM item_rate WHERE item_id = ? AND measurement_unit_id = ?`,
            [itemId, measurementUnitId]
        );

        if (setAsDefault) {
            await client.execute(
                `UPDATE item SET default_measurement_unit_id = ?, updated_by = ? WHERE id = ?`,
                [measurementUnitId, updatedBy, itemId]
            );
        }

        if (!existingRows.length || oldRate !== rate) {
            await client.execute(
                `INSERT INTO items_history(item_rate_id, item_id, measurement_unit_id, old_rate, new_rate, changed_by)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [updatedRows[0].id, itemId, measurementUnitId, oldRate, rate, updatedBy]
            );
        }

        await client.commit();

        await logUserWork({
            userId: updatedByUserId,
            userName: updatedBy,
            userEmail: updatedBy.includes('@') ? updatedBy : null,
            actionType: 'update_item_rate',
            entityType: 'item_rate',
            entityId: `${itemId}:${measurementUnitId}`,
            details: { itemId, measurementUnitId, oldRate, newRate: rate, setAsDefault: Boolean(setAsDefault) }
        });

        sendSuccess(res, "Item rate updated successfully.");
    } catch (error) {
        await client.rollback();
        console.error('Update item rate failed', error);
        sendError(res, "Unable to update item rate.", 500);
    } finally {
        client.release();
    }
};

const updateItemStatus = async (req, res) => {
    const body = req.body || {};
    const itemId = Number(body.itemId);
    const isActive = normalizeBooleanFlag(body.isActive);
    const updatedBy = body.updatedBy || 'System';
    const updatedByUserId = body.updatedByUserId || null;

    if (!itemId) {
        sendError(res, "Item id is required.");
        return;
    }

    try {
        await query(
            `UPDATE item SET is_active = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            [isActive, updatedBy, itemId]
        );

        await logUserWork({
            userId: updatedByUserId,
            userName: updatedBy,
            userEmail: updatedBy.includes('@') ? updatedBy : null,
            actionType: isActive ? 'activate_item' : 'deactivate_item',
            entityType: 'item',
            entityId: itemId,
            details: { isActive: Boolean(isActive) }
        });

        sendSuccess(res, `Item ${isActive ? 'activated' : 'deactivated'} successfully.`);
    } catch (error) {
        console.error('Update item status failed', error);
        sendError(res, "Unable to update item status.", 500);
    }
};

const listRateHistory = async (req, res) => {
    const itemId = Number(req.query.itemId || 0);
    const days = Number(req.query.days || 365);
    const validDays = Number.isFinite(days) && days > 0 ? days : 365;

    try {
        const history = await query(
            `SELECT
                ih.id,
                ih.item_rate_id,
                ih.item_id,
                i.item_name,
                ih.measurement_unit_id,
                mu.unit_name,
                ih.old_rate,
                ih.new_rate,
                ih.changed_by,
                ih.created_at
             FROM items_history ih
             INNER JOIN item i ON i.id = ih.item_id
             INNER JOIN measurement_unit mu ON mu.id = ih.measurement_unit_id
             WHERE ih.created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
             ${itemId ? 'AND ih.item_id = ?' : ''}
             ORDER BY ih.created_at ASC, ih.id ASC`,
            itemId ? [validDays, itemId] : [validDays]
        );
        sendSuccess(res, "Item rate history fetched successfully.", history);
    } catch (error) {
        console.error('List rate history failed', error);
        sendError(res, "Unable to fetch item rate history.", 500);
    }
};

export {
    createItem,
    createMeasurementUnit,
    fetchCatalogRows,
    listItemCatalog,
    listMeasurementUnits,
    listRateHistory,
    updateItemRate,
    updateItemStatus
};
