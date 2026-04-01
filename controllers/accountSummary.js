import { query } from "../configs/dbConn.js";
import { sendError, sendSuccess } from "../utils/apiResponse.js";

const getAccountSummary = async (_req, res) => {
    try {
        const rows = await query(
            `SELECT
                ca.id,
                ca.account_name,
                ca.site,
                ca.contact_name,
                ca.phone,
                ca.gstin,
                COUNT(bo.id) AS order_count,
                COALESCE(SUM(bo.totalAmount), 0) AS total_order_amount,
                COALESCE(SUM(bo.cashCredit), 0) AS total_cash_credit,
                COALESCE(SUM(bo.bankCredit), 0) AS total_bank_credit,
                COALESCE(SUM(bo.dueAmount), 0) AS total_due,
                COALESCE(SUM(bo.due_on_create), 0) AS due_on_create,
                COALESCE(SUM(bo.due_paid), 0) AS due_paid,
                COALESCE(SUM(CASE WHEN COALESCE(bo.quantity, 0) = 0 OR COALESCE(bo.amount, 0) = 0 THEN 1 ELSE 0 END), 0) AS pending_order_count
            FROM customer_account ca
            LEFT JOIN b2b_order_entry bo ON bo.customerAccountId = ca.id
            WHERE ca.is_active = 1
            GROUP BY ca.id, ca.account_name, ca.site, ca.contact_name, ca.phone
            ORDER BY total_due DESC, ca.account_name ASC`
        );

        sendSuccess(res, "Account summaries fetched successfully.", rows);
    } catch (error) {
        console.error('Get account summary failed', error);
        sendError(res, "Unable to fetch account summaries.", 500);
    }
}

export { getAccountSummary };
