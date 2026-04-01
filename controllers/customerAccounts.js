import { query } from "../configs/dbConn.js";
import { sendError, sendSuccess } from "../utils/apiResponse.js";
import { logUserWork } from "../utils/workTracking.js";

const listCustomerAccounts = async (_req, res) => {
    try {
        const rows = await query(
            `SELECT id, account_name, address, contact_name, phone, gstin, is_active, created_at, updated_at
             FROM customer_account
             WHERE is_active = 1
             ORDER BY account_name ASC`
        );
        sendSuccess(res, "Customer accounts fetched successfully.", rows);
    } catch (error) {
        console.error('List customer accounts failed', error);
        sendError(res, "Unable to fetch customer accounts.", 500);
    }
}

const createCustomerAccount = async (req, res) => {
    const reqBody = req.body || {};
    const accountName = reqBody.accountName?.trim();

    if (!accountName) {
        sendError(res, "Customer account name is required.");
        return;
    }

    const address = reqBody.address?.trim() || '';
    const contactName = reqBody.contactName?.trim() || '';
    const phone = reqBody.phone?.trim() || '';
    const gstin = reqBody.gstin?.trim() || '';
    const updatedBy = reqBody.updatedBy || 'System';
    const updatedByUserId = reqBody.updatedByUserId || null;

    try {
        const result = await query(
            `INSERT INTO customer_account(account_name, address, contact_name, phone, gstin, created_by, updated_by)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [accountName, address, contactName, phone, gstin, updatedBy, updatedBy]
        );

        await logUserWork({
            userId: updatedByUserId,
            userName: updatedBy,
            userEmail: updatedBy.includes('@') ? updatedBy : null,
            actionType: 'create_customer_account',
            entityType: 'customer_account',
            entityId: String(result.insertId),
            details: {
                accountName,
                address,
                contactName,
                gstin
            }
        });

        sendSuccess(res, "Customer account created successfully.", { id: result.insertId });
    } catch (error) {
        console.error('Create customer account failed', error);
        if (error.code === 'ER_DUP_ENTRY') {
            sendError(res, "This customer account already exists.", 409);
            return;
        }
        sendError(res, "Unable to create customer account.", 500);
    }
}

export { listCustomerAccounts, createCustomerAccount };
