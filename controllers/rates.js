import { query } from "../configs/dbConn.js";
import { sendError, sendSuccess } from "../utils/apiResponse.js";
import { logUserWork } from "../utils/workTracking.js";

const listRates = async (_req, res) => {
    try {
        const rates = await query(
            `SELECT id, item_name, measurement_unit, rate, created_by, updated_by, created_at, updated_at
             FROM item_rate
             ORDER BY item_name ASC, measurement_unit ASC`
        );
        sendSuccess(res, "Rates fetched successfully.", rates);
    } catch (error) {
        console.error('List rates failed', error);
        sendError(res, "Unable to fetch item rates.", 500);
    }
}

const upsertRate = async (req, res) => {
    const body = req.body || {};
    const itemName = body.itemName?.trim();
    const measurementUnit = body.measurementUnit?.trim();
    const rate = Number(body.rate);
    const updatedBy = body.updatedBy || 'System';

    if (!itemName || !measurementUnit || Number.isNaN(rate)) {
        sendError(res, "Item, measurement unit, and rate are required.");
        return;
    }

    try {
        await query(
            `INSERT INTO item_rate(item_name, measurement_unit, rate, created_by, updated_by)
             VALUES (?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE rate = VALUES(rate), updated_by = VALUES(updated_by), updated_at = CURRENT_TIMESTAMP`,
            [itemName, measurementUnit, rate, updatedBy, updatedBy]
        );

        await logUserWork({
            userName: updatedBy,
            userEmail: updatedBy.includes('@') ? updatedBy : null,
            actionType: 'upsert_rate',
            entityType: 'item_rate',
            entityId: `${itemName}:${measurementUnit}`,
            details: { itemName, measurementUnit, rate }
        });

        sendSuccess(res, "Rate saved successfully.");
    } catch (error) {
        console.error('Upsert rate failed', error);
        sendError(res, "Unable to save the rate.", 500);
    }
}

export { listRates, upsertRate }
