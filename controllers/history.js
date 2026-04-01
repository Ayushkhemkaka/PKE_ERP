import { query } from "../configs/dbConn.js";
import { sendError, sendSuccess } from "../utils/apiResponse.js";

const getOrderHistory = async (req, res) => {
    const id = req.query.id;
    if (!id) {
        sendError(res, "Order id is required.");
        return;
    }

    try {
        const changes = await query(
            `SELECT id, field, oldvalue, newvalue, createddate, createdby
             FROM history
             WHERE entryid = ?
             ORDER BY createddate DESC, id DESC`,
            [id]
        );

        const workLog = await query(
            `SELECT id, user_name, user_email, action_type, entity_type, entity_id, details, created_at
             FROM user_work_log
             WHERE entity_id = ?
             ORDER BY created_at DESC, id DESC`,
            [id]
        );

        sendSuccess(res, "Order history fetched successfully.", { changes, workLog });
    } catch (error) {
        console.error('Get order history failed', error);
        sendError(res, "Unable to fetch order history.", 500);
    }
}

export { getOrderHistory }
