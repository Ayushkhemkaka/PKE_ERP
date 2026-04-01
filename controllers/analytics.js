import { query } from "../configs/dbConn.js";
import { sendError, sendSuccess } from "../utils/apiResponse.js";

const CURRENT_YEAR = new Date().getFullYear();

const buildConditions = ({ mode, accountId, item, fromDays }) => {
    const conditions = [];
    const values = [];

    if (fromDays) {
        conditions.push('date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)');
        values.push(fromDays);
    }

    if (item) {
        conditions.push('item = ?');
        values.push(item);
    }

    if (accountId) {
        conditions.push('customerAccountId = ?');
        values.push(accountId);
    }

    if (mode === 'normal') {
        conditions.push("LOWER(orderType) = 'standard'");
    } else if (mode === 'b2b') {
        conditions.push("LOWER(orderType) = 'b2b'");
    }

    return {
        clause: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '',
        values
    };
};

const buildPeriodConditions = ({ mode, accountId, item, year, month }) => {
    const conditions = ['YEAR(date) = ?'];
    const values = [year];

    if (month) {
        conditions.push('MONTH(date) = ?');
        values.push(month);
    }

    if (item) {
        conditions.push('item = ?');
        values.push(item);
    }

    if (accountId) {
        conditions.push('customerAccountId = ?');
        values.push(accountId);
    }

    if (mode === 'normal') {
        conditions.push("LOWER(orderType) = 'standard'");
    } else if (mode === 'b2b') {
        conditions.push("LOWER(orderType) = 'b2b'");
    }

    return {
        clause: `WHERE ${conditions.join(' AND ')}`,
        values
    };
};

const getAnalytics = async (req, res) => {
    const mode = String(req.query.mode || 'all').toLowerCase();
    const accountId = req.query.accountId || '';
    const item = req.query.item || '';
    const days = Number(req.query.days || 30);
    const year = Number(req.query.year || CURRENT_YEAR);
    const month = Number(req.query.month || (new Date().getMonth() + 1));
    const validDays = Number.isFinite(days) && days > 0 ? days : 30;
    const validYear = Number.isFinite(year) && year >= 2020 && year <= 2100 ? year : CURRENT_YEAR;
    const validMonth = Number.isFinite(month) && month >= 1 && month <= 12 ? month : (new Date().getMonth() + 1);

    const rollingFilter = buildConditions({ mode, accountId, item, fromDays: validDays });
    const yearlyFilter = buildPeriodConditions({ mode, accountId, item, year: validYear });
    const monthlyFilter = buildPeriodConditions({ mode, accountId, item, year: validYear, month: validMonth });

    try {
        const [overallSummary] = await query(
            `SELECT
                COUNT(*) AS orderCount,
                COALESCE(SUM(totalAmount), 0) AS totalSales,
                COALESCE(SUM(cashCredit), 0) AS totalCashCredit,
                COALESCE(SUM(bankCredit), 0) AS totalBankCredit,
                COALESCE(SUM(dueAmount), 0) AS totalDue,
                COALESCE(SUM(due_paid), 0) AS totalDuePaid,
                COALESCE(AVG(totalAmount), 0) AS averageOrderValue,
                COALESCE(MAX(totalAmount), 0) AS biggestOrderValue,
                COALESCE(MIN(NULLIF(totalAmount, 0)), 0) AS smallestNonZeroOrder,
                COALESCE(SUM(CASE WHEN COALESCE(quantity, 0) = 0 OR COALESCE(amount, 0) = 0 THEN 1 ELSE 0 END), 0) AS pendingPricingCount
             FROM order_entry
             ${rollingFilter.clause}`,
            rollingFilter.values
        );

        const [normalSummary] = await query(
            `SELECT
                COUNT(*) AS order_count,
                COALESCE(SUM(totalAmount), 0) AS total_sales,
                COALESCE(SUM(cashCredit), 0) AS total_cash_credit,
                COALESCE(SUM(bankCredit), 0) AS total_bank_credit,
                COALESCE(SUM(dueAmount), 0) AS total_due,
                COALESCE(SUM(due_paid), 0) AS total_due_paid
             FROM order_entry
             ${rollingFilter.clause ? `${rollingFilter.clause} AND` : 'WHERE'} LOWER(orderType) = 'standard'`,
            rollingFilter.values
        );

        const [b2bSummary] = await query(
            `SELECT
                COUNT(*) AS order_count,
                COALESCE(SUM(totalAmount), 0) AS total_sales,
                COALESCE(SUM(cashCredit), 0) AS total_cash_credit,
                COALESCE(SUM(bankCredit), 0) AS total_bank_credit,
                COALESCE(SUM(dueAmount), 0) AS total_due,
                COALESCE(SUM(due_paid), 0) AS total_due_paid
             FROM order_entry
             ${rollingFilter.clause ? `${rollingFilter.clause} AND` : 'WHERE'} LOWER(orderType) = 'b2b'`,
            rollingFilter.values
        );

        const yearlyMonthlyBreakdown = await query(
            `SELECT
                MONTH(date) AS month_number,
                DATE_FORMAT(date, '%b') AS month_label,
                COUNT(*) AS order_count,
                COALESCE(SUM(totalAmount), 0) AS total_sales,
                COALESCE(SUM(CASE WHEN LOWER(orderType) = 'standard' THEN totalAmount ELSE 0 END), 0) AS cash_sales,
                COALESCE(SUM(CASE WHEN LOWER(orderType) = 'b2b' THEN totalAmount ELSE 0 END), 0) AS b2b_sales,
                COALESCE(SUM(cashCredit), 0) AS cash_credit,
                COALESCE(SUM(bankCredit), 0) AS bank_credit,
                COALESCE(SUM(dueAmount), 0) AS due_amount,
                COALESCE(SUM(due_paid), 0) AS due_paid
             FROM order_entry
             ${yearlyFilter.clause}
             GROUP BY MONTH(date), DATE_FORMAT(date, '%b')
             ORDER BY month_number`,
            yearlyFilter.values
        );

        const monthlyDailyBreakdown = await query(
            `SELECT
                DAY(date) AS day_number,
                DATE_FORMAT(date, '%d %b') AS day_label,
                COUNT(*) AS order_count,
                COALESCE(SUM(totalAmount), 0) AS total_sales,
                COALESCE(SUM(CASE WHEN LOWER(orderType) = 'standard' THEN totalAmount ELSE 0 END), 0) AS cash_sales,
                COALESCE(SUM(CASE WHEN LOWER(orderType) = 'b2b' THEN totalAmount ELSE 0 END), 0) AS b2b_sales,
                COALESCE(SUM(cashCredit), 0) AS cash_credit,
                COALESCE(SUM(bankCredit), 0) AS bank_credit,
                COALESCE(SUM(dueAmount), 0) AS due_amount,
                COALESCE(SUM(due_paid), 0) AS due_paid
             FROM order_entry
             ${monthlyFilter.clause}
             GROUP BY DAY(date), DATE_FORMAT(date, '%d %b')
             ORDER BY day_number`,
            monthlyFilter.values
        );

        const dailyRecentTrend = await query(
            `SELECT
                DATE_FORMAT(date, '%Y-%m-%d') AS sales_date,
                COUNT(*) AS order_count,
                COALESCE(SUM(totalAmount), 0) AS total_sales,
                COALESCE(SUM(cashCredit), 0) AS cash_credit,
                COALESCE(SUM(bankCredit), 0) AS bank_credit,
                COALESCE(SUM(dueAmount), 0) AS due_amount,
                COALESCE(SUM(due_paid), 0) AS due_paid
             FROM order_entry
             ${rollingFilter.clause}
             GROUP BY DATE_FORMAT(date, '%Y-%m-%d')
             ORDER BY sales_date ASC`,
            rollingFilter.values
        );

        const topItems = await query(
            `SELECT item, COUNT(*) AS order_count, COALESCE(SUM(totalAmount), 0) AS total_sales
             FROM order_entry
             ${rollingFilter.clause}
             GROUP BY item
             ORDER BY total_sales DESC, order_count DESC
             LIMIT 10`,
            rollingFilter.values
        );

        const itemPerformance = await query(
            `SELECT
                item,
                COUNT(*) AS order_count,
                COALESCE(SUM(totalAmount), 0) AS total_sales,
                COALESCE(SUM(quantity), 0) AS total_quantity,
                COALESCE(AVG(rate), 0) AS avg_rate
             FROM order_entry
             ${yearlyFilter.clause}
             GROUP BY item
             ORDER BY total_sales DESC, order_count DESC
             LIMIT 12`,
            yearlyFilter.values
        );

        const rateChangeHistory = await query(
            `SELECT
                ih.id,
                i.item_name,
                mu.unit_name,
                ih.old_rate,
                ih.new_rate,
                ih.changed_by,
                ih.created_at
             FROM items_history ih
             INNER JOIN item i ON i.id = ih.item_id
             INNER JOIN measurement_unit mu ON mu.id = ih.measurement_unit_id
             WHERE ih.created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
             ${item ? 'AND i.item_name = ?' : ''}
             ORDER BY ih.created_at ASC, ih.id ASC`,
            item ? [validDays, item] : [validDays]
        );

        const latestRateSnapshot = await query(
            `SELECT
                i.item_name,
                mu.unit_name,
                ir.rate,
                ir.updated_at
             FROM item_rate ir
             INNER JOIN item i ON i.id = ir.item_id
             INNER JOIN measurement_unit mu ON mu.id = ir.measurement_unit_id
             WHERE ir.is_active = 1 AND i.is_active = 1
             ${item ? 'AND i.item_name = ?' : ''}
             ORDER BY i.item_name ASC, mu.unit_name ASC`,
            item ? [item] : []
        );

        const paymentBreakdown = await query(
            `SELECT paymentStatus AS payment_status,
                    COUNT(*) AS order_count,
                    COALESCE(SUM(totalAmount), 0) AS total_sales
             FROM order_entry
             ${rollingFilter.clause}
             GROUP BY paymentStatus
             ORDER BY total_sales DESC, order_count DESC`,
            rollingFilter.values
        );

        const sourceBreakdown = await query(
            `SELECT source,
                    COUNT(*) AS order_count,
                    COALESCE(SUM(totalAmount), 0) AS total_sales
             FROM order_entry
             ${rollingFilter.clause}
             GROUP BY source
             ORDER BY total_sales DESC, order_count DESC`,
            rollingFilter.values
        );

        const partyPerformance = await query(
            `SELECT
                CASE
                    WHEN LOWER(orderType) = 'b2b' THEN COALESCE(customerAccountName, name)
                    ELSE name
                END AS party_name,
                COUNT(*) AS order_count,
                COALESCE(SUM(totalAmount), 0) AS total_sales,
                COALESCE(SUM(dueAmount), 0) AS total_due
             FROM order_entry
             ${rollingFilter.clause}
             GROUP BY party_name
             HAVING party_name IS NOT NULL AND party_name <> ''
             ORDER BY total_sales DESC, order_count DESC
             LIMIT 10`,
            rollingFilter.values
        );

        const dueByParty = await query(
            `SELECT
                CASE
                    WHEN LOWER(orderType) = 'b2b' THEN COALESCE(customerAccountName, name)
                    ELSE name
                END AS party_name,
                COUNT(*) AS order_count,
                COALESCE(SUM(dueAmount), 0) AS total_due
             FROM order_entry
             ${rollingFilter.clause ? `${rollingFilter.clause} AND` : 'WHERE'} COALESCE(dueAmount, 0) > 0
             GROUP BY party_name
             HAVING party_name IS NOT NULL AND party_name <> ''
             ORDER BY total_due DESC, order_count DESC
             LIMIT 8`,
            rollingFilter.values
        );

        const pricingGaps = await query(
            `SELECT item,
                    COUNT(*) AS order_count,
                    COALESCE(SUM(totalAmount), 0) AS total_sales
             FROM order_entry
             ${rollingFilter.clause ? `${rollingFilter.clause} AND` : 'WHERE'} (COALESCE(quantity, 0) = 0 OR COALESCE(amount, 0) = 0)
             GROUP BY item
             ORDER BY order_count DESC, total_sales DESC
             LIMIT 8`,
            rollingFilter.values
        );

        const printStatusSummary = await query(
            `SELECT
                CASE WHEN COALESCE(is_printed, 0) = 1 THEN 'Printed' ELSE 'Pending Print' END AS print_status,
                COUNT(*) AS order_count
             FROM order_entry
             ${rollingFilter.clause}
             GROUP BY CASE WHEN COALESCE(is_printed, 0) = 1 THEN 'Printed' ELSE 'Pending Print' END
             ORDER BY order_count DESC`,
            rollingFilter.values
        );

        const orderValueBands = await query(
            `SELECT
                CASE
                    WHEN COALESCE(totalAmount, 0) = 0 THEN 'Zero'
                    WHEN totalAmount <= 10000 THEN '0-10k'
                    WHEN totalAmount <= 25000 THEN '10k-25k'
                    WHEN totalAmount <= 50000 THEN '25k-50k'
                    ELSE '50k+'
                END AS value_band,
                COUNT(*) AS order_count
             FROM order_entry
             ${rollingFilter.clause}
             GROUP BY value_band
             ORDER BY FIELD(value_band, 'Zero', '0-10k', '10k-25k', '25k-50k', '50k+')`,
            rollingFilter.values
        );

        const [currentMonthSummary] = await query(
            `SELECT COUNT(*) AS order_count,
                    COALESCE(SUM(totalAmount), 0) AS total_sales,
                    COALESCE(AVG(totalAmount), 0) AS average_order_value
             FROM order_entry
             ${monthlyFilter.clause}`,
            monthlyFilter.values
        );

        const previousMonth = validMonth === 1 ? 12 : validMonth - 1;
        const previousMonthYear = validMonth === 1 ? validYear - 1 : validYear;
        const previousMonthlyFilter = buildPeriodConditions({ mode, accountId, item, year: previousMonthYear, month: previousMonth });
        const [previousMonthSummary] = await query(
            `SELECT COUNT(*) AS order_count,
                    COALESCE(SUM(totalAmount), 0) AS total_sales,
                    COALESCE(AVG(totalAmount), 0) AS average_order_value
             FROM order_entry
             ${previousMonthlyFilter.clause}`,
            previousMonthlyFilter.values
        );

        const currentMonthSales = Number(currentMonthSummary.total_sales || 0);
        const previousMonthSales = Number(previousMonthSummary.total_sales || 0);
        const monthGrowthPercent = previousMonthSales > 0
            ? ((currentMonthSales - previousMonthSales) / previousMonthSales) * 100
            : (currentMonthSales > 0 ? 100 : 0);
        const highestMonth = yearlyMonthlyBreakdown.reduce((best, row) =>
            Number(row.total_sales || 0) > Number(best?.total_sales || 0) ? row : best,
            yearlyMonthlyBreakdown[0] || null
        );

        sendSuccess(res, "Analytics fetched successfully.", {
            filters: {
                mode,
                accountId,
                item,
                days: validDays,
                year: validYear,
                month: validMonth
            },
            overallSummary,
            normalSummary,
            b2bSummary,
            currentMonthSummary: {
                orderCount: Number(currentMonthSummary.order_count || 0),
                totalSales: currentMonthSales,
                averageOrderValue: Number(currentMonthSummary.average_order_value || 0)
            },
            previousMonthSummary: {
                orderCount: Number(previousMonthSummary.order_count || 0),
                totalSales: previousMonthSales,
                averageOrderValue: Number(previousMonthSummary.average_order_value || 0)
            },
            businessSignals: {
                monthGrowthPercent,
                highestMonth,
                yearToDateSales: yearlyMonthlyBreakdown.reduce((sum, row) => sum + Number(row.total_sales || 0), 0),
                yearToDateOrders: yearlyMonthlyBreakdown.reduce((sum, row) => sum + Number(row.order_count || 0), 0),
                averageDailySales: dailyRecentTrend.length ? dailyRecentTrend.reduce((sum, row) => sum + Number(row.total_sales || 0), 0) / dailyRecentTrend.length : 0,
                dueRecoveryRate: Number(overallSummary.totalDuePaid || 0) > 0
                    ? (Number(overallSummary.totalDuePaid || 0) / Math.max(Number(overallSummary.totalDue || 0) + Number(overallSummary.totalDuePaid || 0), 1)) * 100
                    : 0
            },
            yearlyMonthlyBreakdown,
            monthlyDailyBreakdown,
            dailyRecentTrend,
            topItems,
            itemPerformance,
            rateChangeHistory,
            latestRateSnapshot,
            paymentBreakdown,
            sourceBreakdown,
            partyPerformance,
            dueByParty,
            pricingGaps,
            printStatusSummary,
            orderValueBands
        });
    } catch (error) {
        console.error('Analytics failed', error);
        sendError(res, "Unable to fetch analytics.", 500);
    }
};

export { getAnalytics };