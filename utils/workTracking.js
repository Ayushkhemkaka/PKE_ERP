import { query } from "../configs/dbConn.js";

const logUserWork = async ({
    userId = null,
    userName = 'System',
    userEmail = null,
    actionType,
    entityType,
    entityId = null,
    details = null
}) => {
    try {
        const normalizedUserId = Number.isFinite(Number(userId)) ? Number(userId) : null;
        await query(
            `INSERT INTO user_work_log(user_id, user_name, user_email, action_type, entity_type, entity_id, details)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                normalizedUserId,
                userName,
                userEmail,
                actionType,
                entityType,
                entityId,
                details ? JSON.stringify(details) : null
            ]
        );
    } catch (error) {
        console.error('User work log failed', error);
    }
}

export { logUserWork }
