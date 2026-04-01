import { query } from "../configs/dbConn.js";
import { sendError, sendSuccess } from "../utils/apiResponse.js";

const getAnalytics = async (_req, res) => {
    try {
        const [normalSummary] = await query(
            `SELECT
                COUNT(*) AS order_count,
                COALESCE(SUM(totalAmount), 0) AS total_sales,
                COALESCE(SUM(cashCredit), 0) AS total_cash_credit,
                COALESCE(SUM(bankCredit), 0) AS total_bank_credit,
                COALESCE(SUM(dueAmount), 0) AS total_due,
                COALESCE(SUM(due_paid), 0) AS total_due_paid,
                COALESCE(SUM(CASE WHEN COALESCE(quantity, 0) = 0 OR COALESCE(amount, 0) = 0 THEN 1 ELSE 0 END), 0) AS pending_pricing_count
             FROM normal_order_entry`
        );

        const [b2bSummary] = await query(
            `SELECT
                COUNT(*) AS order_count,
                COALESCE(SUM(totalAmount), 0) AS total_sales,
                COALESCE(SUM(cashCredit), 0) AS total_cash_credit,
                COALESCE(SUM(bankCredit), 0) AS total_bank_credit,
                COALESCE(SUM(dueAmount), 0) AS total_due,
                COALESCE(SUM(due_paid), 0) AS total_due_paid,
                COALESCE(SUM(CASE WHEN COALESCE(quantity, 0) = 0 OR COALESCE(amount, 0) = 0 THEN 1 ELSE 0 END), 0) AS pending_pricing_count
             FROM b2b_order_entry`
        );

        const monthlySales = await query(
            `SELECT bucket.month_label, SUM(bucket.total_amount) AS total_sales
             FROM (
                SELECT DATE_FORMAT(date, '%Y-%m') AS month_label, totalAmount AS total_amount FROM normal_order_entry
                UNION ALL
                SELECT DATE_FORMAT(date, '%Y-%m') AS month_label, totalAmount AS total_amount FROM b2b_order_entry
             ) AS bucket
             GROUP BY bucket.month_label
             ORDER BY bucket.month_label DESC
             LIMIT 6`
        );

        const topItems = await query(
            `SELECT item, COUNT(*) AS order_count, COALESCE(SUM(total_amount), 0) AS total_sales
             FROM (
                SELECT item, totalAmount AS total_amount FROM normal_order_entry
                UNION ALL
                SELECT item, totalAmount AS total_amount FROM b2b_order_entry
             ) AS item_bucket
             GROUP BY item
             ORDER BY total_sales DESC, order_count DESC
             LIMIT 5`
        );

        sendSuccess(res, "Analytics fetched successfully.", {
            normalSummary,
            b2bSummary,
            overallSummary: {
                orderCount: Number(normalSummary.order_count || 0) + Number(b2bSummary.order_count || 0),
                totalSales: Number(normalSummary.total_sales || 0) + Number(b2bSummary.total_sales || 0),
                totalCashCredit: Number(normalSummary.total_cash_credit || 0) + Number(b2bSummary.total_cash_credit || 0),
                totalBankCredit: Number(normalSummary.total_bank_credit || 0) + Number(b2bSummary.total_bank_credit || 0),
                totalDue: Number(normalSummary.total_due || 0) + Number(b2bSummary.total_due || 0),
                totalDuePaid: Number(normalSummary.total_due_paid || 0) + Number(b2bSummary.total_due_paid || 0),
                pendingPricingCount: Number(normalSummary.pending_pricing_count || 0) + Number(b2bSummary.pending_pricing_count || 0)
            },
            monthlySales: monthlySales.reverse(),
            topItems
        });
    } catch (error) {
        console.error('Get analytics failed', error);
        sendError(res, "Unable to fetch analytics.", 500);
    }
}

export { getAnalytics };
