import { query } from "../configs/dbConn.js";
import { sendError, sendSuccess } from "../utils/apiResponse.js";

const getAnalytics = async (req, res) => {
    const mode = String(req.query.mode || 'all').toLowerCase();
    const accountId = req.query.accountId;
    const item = req.query.item;
    const days = Number(req.query.days || 30);
    const validDays = Number.isFinite(days) && days > 0 ? days : 30;

    const normalConditions = ['date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)'];
    const normalValues = [validDays];
    const b2bConditions = ['date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)'];
    const b2bValues = [validDays];

    if (item) {
        normalConditions.push('item = ?');
        b2bConditions.push('item = ?');
        normalValues.push(item);
        b2bValues.push(item);
    }

    if (accountId) {
        b2bConditions.push('customerAccountId = ?');
        b2bValues.push(accountId);
    }

    const normalWhere = mode === 'b2b' ? 'WHERE 1 = 0' : `WHERE ${normalConditions.join(' AND ')}`;
    const b2bWhere = mode === 'normal' ? 'WHERE 1 = 0' : `WHERE ${b2bConditions.join(' AND ')}`;

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
             FROM normal_order_entry
             ${normalWhere}`,
            mode === 'b2b' ? [] : normalValues
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
             FROM b2b_order_entry
             ${b2bWhere}`,
            mode === 'normal' ? [] : b2bValues
        );

        const monthlySales = await query(
            `SELECT bucket.month_label, SUM(bucket.total_amount) AS total_sales
             FROM (
                SELECT DATE_FORMAT(date, '%Y-%m') AS month_label, totalAmount AS total_amount
                FROM normal_order_entry
                ${normalWhere}
                UNION ALL
                SELECT DATE_FORMAT(date, '%Y-%m') AS month_label, totalAmount AS total_amount
                FROM b2b_order_entry
                ${b2bWhere}
             ) AS bucket
             GROUP BY bucket.month_label
             ORDER BY bucket.month_label DESC
             LIMIT 6`,
            [...(mode === 'b2b' ? [] : normalValues), ...(mode === 'normal' ? [] : b2bValues)]
        );

        const topItems = await query(
            `SELECT item, COUNT(*) AS order_count, COALESCE(SUM(total_amount), 0) AS total_sales
             FROM (
                SELECT item, totalAmount AS total_amount
                FROM normal_order_entry
                ${normalWhere}
                UNION ALL
                SELECT item, totalAmount AS total_amount
                FROM b2b_order_entry
                ${b2bWhere}
             ) AS item_bucket
             GROUP BY item
             ORDER BY total_sales DESC, order_count DESC
             LIMIT 8`,
            [...(mode === 'b2b' ? [] : normalValues), ...(mode === 'normal' ? [] : b2bValues)]
        );

        const accountBreakdown = await query(
            `SELECT customerAccountName AS account_name,
                    COUNT(*) AS order_count,
                    COALESCE(SUM(totalAmount), 0) AS total_sales,
                    COALESCE(SUM(dueAmount), 0) AS total_due
             FROM b2b_order_entry
             ${b2bWhere}
             GROUP BY customerAccountName
             HAVING customerAccountName IS NOT NULL AND customerAccountName <> ''
             ORDER BY total_sales DESC, order_count DESC
             LIMIT 8`,
            mode === 'normal' ? [] : b2bValues
        );

        const paymentBreakdown = await query(
            `SELECT paymentStatus AS payment_status,
                    COUNT(*) AS order_count,
                    COALESCE(SUM(total_amount), 0) AS total_sales
             FROM (
                SELECT paymentStatus, totalAmount AS total_amount
                FROM normal_order_entry
                ${normalWhere}
                UNION ALL
                SELECT paymentStatus, totalAmount AS total_amount
                FROM b2b_order_entry
                ${b2bWhere}
             ) AS payment_bucket
             GROUP BY paymentStatus
             ORDER BY total_sales DESC, order_count DESC`,
            [...(mode === 'b2b' ? [] : normalValues), ...(mode === 'normal' ? [] : b2bValues)]
        );

        sendSuccess(res, "Analytics fetched successfully.", {
            filters: {
                mode,
                accountId: accountId || '',
                item: item || '',
                days: validDays
            },
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
            topItems,
            accountBreakdown,
            paymentBreakdown
        });
    } catch (error) {
        console.error('Get analytics failed', error);
        sendError(res, "Unable to fetch analytics.", 500);
    }
}

export { getAnalytics };
