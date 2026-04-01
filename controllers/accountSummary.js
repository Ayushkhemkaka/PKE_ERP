import { query } from "../configs/dbConn.js";
import { sendError, sendSuccess } from "../utils/apiResponse.js";

const getAccountSummary = async (_req, res) => {
    try {
        const rows = await query(
            `SELECT
                ca.id,
                ca.account_name,
                ca.address,
                ca.contact_name,
                ca.phone,
                ca.gstin,
                COUNT(oe.id) AS order_count,
                COALESCE(SUM(oe.totalAmount), 0) AS total_order_amount,
                COALESCE(SUM(oe.cashCredit), 0) AS total_cash_credit,
                COALESCE(SUM(oe.bankCredit), 0) AS total_bank_credit,
                COALESCE(SUM(oe.dueAmount), 0) AS total_due,
                COALESCE(SUM(oe.due_on_create), 0) AS due_on_create,
                COALESCE(SUM(oe.due_paid), 0) AS due_paid,
                COALESCE(SUM(CASE WHEN COALESCE(oe.quantity, 0) = 0 OR COALESCE(oe.amount, 0) = 0 THEN 1 ELSE 0 END), 0) AS pending_order_count
            FROM customer_account ca
            LEFT JOIN order_entry oe
                ON oe.customerAccountId = ca.id
               AND LOWER(oe.orderType) = 'b2b'
            WHERE ca.is_active = 1
            GROUP BY ca.id, ca.account_name, ca.address, ca.contact_name, ca.phone, ca.gstin
            ORDER BY total_due DESC, ca.account_name ASC`
        );

        sendSuccess(res, "Account summaries fetched successfully.", rows);
    } catch (error) {
        console.error('Get account summary failed', error);
        sendError(res, "Unable to fetch account summaries.", 500);
    }
}

export { getAccountSummary };
