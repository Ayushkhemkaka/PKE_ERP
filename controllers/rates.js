import { query } from "../configs/dbConn.js";
import { sendError, sendSuccess } from "../utils/apiResponse.js";
import { updateItemRate } from "./items.js";

const listRates = async (_req, res) => {
    try {
        const rates = await query(
            `SELECT
                ir.id,
                ir.item_id,
                ir.measurement_unit_id,
                i.item_name,
                mu.unit_name AS measurement_unit,
                ir.rate,
                ir.is_active,
                ir.created_by,
                ir.updated_by,
                ir.created_at,
                ir.updated_at
             FROM item_rate ir
             INNER JOIN item i ON i.id = ir.item_id
             INNER JOIN measurement_unit mu ON mu.id = ir.measurement_unit_id
             ORDER BY i.item_name ASC, mu.unit_name ASC`
        );
        sendSuccess(res, "Rates fetched successfully.", rates);
    } catch (error) {
        console.error('List rates failed', error);
        sendError(res, "Unable to fetch item rates.", 500);
    }
}

const upsertRate = async (req, res) => {
    const body = req.body || {};
    if (body.itemId && body.measurementUnitId) {
        await updateItemRate(req, res);
        return;
    }

    sendError(res, "Use the item and measurement unit selection to update rates.");
}

export { listRates, upsertRate }
