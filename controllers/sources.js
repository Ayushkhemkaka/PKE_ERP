import { query } from "../configs/dbConn.js";
import { sendError, sendSuccess } from "../utils/apiResponse.js";
import { logUserWork } from "../utils/workTracking.js";

const listSources = async (req, res) => {
    try {
        const includeInactive = req.query.includeInactive === 'true';
        const rows = await query(
            `SELECT id, source_name, is_active, created_by, updated_by, created_at, updated_at
             FROM source
             ${includeInactive ? '' : 'WHERE is_active = 1'}
             ORDER BY source_name ASC`
        );
        sendSuccess(res, "Sources fetched successfully.", rows);
    } catch (error) {
        console.error('List sources failed', error);
        sendError(res, "Unable to fetch sources.", 500);
    }
};

const createSource = async (req, res) => {
    const body = req.body || {};
    const sourceName = String(body.sourceName || '').trim();
    const updatedBy = body.updatedBy || 'System';
    const updatedByUserId = body.updatedByUserId || null;

    if (!sourceName) {
        sendError(res, "Source name is required.");
        return;
    }

    try {
        await query(
            `INSERT INTO source(source_name, created_by, updated_by)
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE is_active = 1, updated_by = VALUES(updated_by), updated_at = CURRENT_TIMESTAMP`,
            [sourceName, updatedBy, updatedBy]
        );

        await logUserWork({
            userId: updatedByUserId,
            userName: updatedBy,
            userEmail: updatedBy.includes('@') ? updatedBy : null,
            actionType: 'create_source',
            entityType: 'source',
            entityId: sourceName,
            details: { sourceName }
        });

        sendSuccess(res, "Source saved successfully.");
    } catch (error) {
        console.error('Create source failed', error);
        sendError(res, "Unable to save source.", 500);
    }
};

const updateSourceStatus = async (req, res) => {
    const body = req.body || {};
    const sourceId = Number(body.sourceId);
    const isActive = body.isActive === true || body.isActive === 1 || body.isActive === '1' || body.isActive === 'true' ? 1 : 0;
    const updatedBy = body.updatedBy || 'System';
    const updatedByUserId = body.updatedByUserId || null;

    if (!sourceId) {
        sendError(res, "Source id is required.");
        return;
    }

    try {
        await query(
            `UPDATE source SET is_active = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            [isActive, updatedBy, sourceId]
        );

        await logUserWork({
            userId: updatedByUserId,
            userName: updatedBy,
            userEmail: updatedBy.includes('@') ? updatedBy : null,
            actionType: isActive ? 'activate_source' : 'deactivate_source',
            entityType: 'source',
            entityId: sourceId,
            details: { isActive: Boolean(isActive) }
        });

        sendSuccess(res, `Source ${isActive ? 'activated' : 'deactivated'} successfully.`);
    } catch (error) {
        console.error('Update source status failed', error);
        sendError(res, "Unable to update source status.", 500);
    }
};

export { listSources, createSource, updateSourceStatus };
