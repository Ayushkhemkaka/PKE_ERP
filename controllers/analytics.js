import { query } from "../configs/dbConn.js";
import { sendError, sendSuccess } from "../utils/apiResponse.js";

const getAnalytics = async (req, res) => {
    const mode = String(req.query.mode || 'all').toLowerCase();
    const accountId = req.query.accountId;
    const item = req.query.item;
    const days = Number(req.query.days || 30);
    const validDays = Number.isFinite(days) && days > 0 ? days : 30;
    const year = Number(req.query.year || new Date().getFullYear());
    const validYear = Number.isFinite(year) && year >= 2020 && year <= 2100 ? year : new Date().getFullYear();

    const conditions = ['date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)'];
    const values = [validDays];

    if (item) {
        conditions.push('item = ?');
        values.push(item);
    }

    if (accountId) {
        conditions.push('customerAccountId = ?');
        values.push(accountId);
    }

    if (mode === 'normal') {
        conditions.push(`LOWER(orderType) = 'standard'`);
    } else if (mode === 'b2b') {
        conditions.push(`LOWER(orderType) = 'b2b'`);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;
    const buildYearWhere = () => {
        const yearConditions = ['YEAR(date) = ?'];
        const yearValues = [validYear];

        if (item) {
            yearConditions.push('item = ?');
            yearValues.push(item);
        }

        if (accountId) {
            yearConditions.push('customerAccountId = ?');
            yearValues.push(accountId);
        }

        if (mode === 'normal') {
            yearConditions.push(`LOWER(orderType) = 'standard'`);
        } else if (mode === 'b2b') {
            yearConditions.push(`LOWER(orderType) = 'b2b'`);
        }

        return {
            sql: `WHERE ${yearConditions.join(' AND ')}`,
            values: yearValues
        };
    };

    const buildMonthWhere = (offsetMonths = 0) => {
        const monthConditions = [`DATE_FORMAT(date, '%Y-%m') = DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL ? MONTH), '%Y-%m')`];
        const monthValues = [offsetMonths];

        if (item) {
            monthConditions.push('item = ?');
            monthValues.push(item);
        }

        if (accountId) {
            monthConditions.push('customerAccountId = ?');
            monthValues.push(accountId);
        }

        if (mode === 'normal') {
            monthConditions.push(`LOWER(orderType) = 'standard'`);
        } else if (mode === 'b2b') {
            monthConditions.push(`LOWER(orderType) = 'b2b'`);
        }

        return {
            sql: `WHERE ${monthConditions.join(' AND ')}`,
            values: monthValues
        };
    };

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
             FROM order_entry
             ${whereClause}
             ${mode === 'b2b' ? 'AND 1 = 0' : 'AND LOWER(orderType) = \'standard\''}`,
            values
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
             FROM order_entry
             ${whereClause}
             ${mode === 'normal' ? 'AND 1 = 0' : 'AND LOWER(orderType) = \'b2b\''}`,
            values
        );

        const monthlySales = await query(
            `SELECT DATE_FORMAT(date, '%Y-%m') AS month_label,
                    COALESCE(SUM(totalAmount), 0) AS total_sales
             FROM order_entry
             ${whereClause}
             GROUP BY DATE_FORMAT(date, '%Y-%m')
             ORDER BY month_label DESC
             LIMIT 6`,
            values
        );

        const topItems = await query(
            `SELECT item, COUNT(*) AS order_count, COALESCE(SUM(totalAmount), 0) AS total_sales
             FROM order_entry
             ${whereClause}
             GROUP BY item
             ORDER BY total_sales DESC, order_count DESC
             LIMIT 8`,
            values
        );

        const accountBreakdown = await query(
            `SELECT customerAccountName AS account_name,
                    COUNT(*) AS order_count,
                    COALESCE(SUM(totalAmount), 0) AS total_sales,
                    COALESCE(SUM(dueAmount), 0) AS total_due
             FROM order_entry
             ${whereClause}
             AND LOWER(orderType) = 'b2b'
             GROUP BY customerAccountName
             HAVING customerAccountName IS NOT NULL AND customerAccountName <> ''
             ORDER BY total_sales DESC, order_count DESC
             LIMIT 8`,
            values
        );

        const paymentBreakdown = await query(
            `SELECT paymentStatus AS payment_status,
                    COUNT(*) AS order_count,
                    COALESCE(SUM(totalAmount), 0) AS total_sales
             FROM order_entry
             ${whereClause}
             GROUP BY paymentStatus
             ORDER BY total_sales DESC, order_count DESC`,
            values
        );

        const sourceBreakdown = await query(
            `SELECT source,
                    COUNT(*) AS order_count,
                    COALESCE(SUM(totalAmount), 0) AS total_sales
             FROM order_entry
             ${whereClause}
             GROUP BY source
             ORDER BY total_sales DESC, order_count DESC`,
            values
        );

        const salesTimeline = await query(
            `SELECT DATE_FORMAT(date, '%Y-%m-%d') AS sales_date,
                    COUNT(*) AS order_count,
                    COALESCE(SUM(totalAmount), 0) AS total_sales
             FROM order_entry
             ${whereClause}
             GROUP BY DATE_FORMAT(date, '%Y-%m-%d')
             ORDER BY sales_date ASC`,
            values
        );

        const weekdayPerformance = await query(
            `SELECT DAYOFWEEK(date) AS weekday_number,
                    ELT(DAYOFWEEK(date), 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat') AS weekday_label,
                    COUNT(*) AS order_count,
                    COALESCE(SUM(totalAmount), 0) AS total_sales
             FROM order_entry
             ${whereClause}
             GROUP BY DAYOFWEEK(date), ELT(DAYOFWEEK(date), 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat')
             ORDER BY weekday_number ASC`,
            values
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
             ${whereClause}
             GROUP BY party_name
             HAVING party_name IS NOT NULL AND party_name <> ''
             ORDER BY total_sales DESC, order_count DESC
             LIMIT 10`,
            values
        );

        const printStatusSummary = await query(
            `SELECT
                CASE WHEN COALESCE(is_printed, 0) = 1 THEN 'Printed' ELSE 'Pending Print' END AS print_status,
                COUNT(*) AS order_count
             FROM order_entry
             ${whereClause}
             GROUP BY CASE WHEN COALESCE(is_printed, 0) = 1 THEN 'Printed' ELSE 'Pending Print' END
             ORDER BY order_count DESC`,
            values
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
             ${whereClause}
             GROUP BY value_band
             ORDER BY FIELD(value_band, 'Zero', '0-10k', '10k-25k', '25k-50k', '50k+')`,
            values
        );

        const yearlyFilter = buildYearWhere();
        const yearlyMonthlySales = await query(
            `SELECT MONTH(date) AS month_number,
                    DATE_FORMAT(date, '%b') AS month_label,
                    COUNT(*) AS order_count,
                    COALESCE(SUM(totalAmount), 0) AS total_sales
             FROM order_entry
             ${yearlyFilter.sql}
             GROUP BY MONTH(date), DATE_FORMAT(date, '%b')
             ORDER BY month_number`,
            yearlyFilter.values
        );

        const currentMonthFilter = buildMonthWhere(0);
        const [currentMonthSummary] = await query(
            `SELECT COUNT(*) AS order_count,
                    COALESCE(SUM(totalAmount), 0) AS total_sales,
                    COALESCE(AVG(totalAmount), 0) AS average_order_value
             FROM order_entry
             ${currentMonthFilter.sql}`,
            currentMonthFilter.values
        );

        const previousMonthFilter = buildMonthWhere(1);
        const [previousMonthSummary] = await query(
            `SELECT COUNT(*) AS order_count,
                    COALESCE(SUM(totalAmount), 0) AS total_sales,
                    COALESCE(AVG(totalAmount), 0) AS average_order_value
             FROM order_entry
             ${previousMonthFilter.sql}`,
            previousMonthFilter.values
        );

        const [overallOrderMetrics] = await query(
            `SELECT COALESCE(AVG(totalAmount), 0) AS average_order_value,
                    COALESCE(MAX(totalAmount), 0) AS biggest_order_value,
                    COALESCE(MIN(NULLIF(totalAmount, 0)), 0) AS smallest_non_zero_order
             FROM order_entry
             ${whereClause}`,
            values
        );

        const dueByParty = await query(
            `SELECT party_name,
                    COUNT(*) AS order_count,
                    COALESCE(SUM(due_amount), 0) AS total_due
             FROM (
                SELECT
                    CASE
                        WHEN LOWER(orderType) = 'b2b' THEN COALESCE(customerAccountName, name)
                        ELSE name
                    END AS party_name,
                    dueAmount AS due_amount
                FROM order_entry
                ${whereClause}
             ) AS due_bucket
             WHERE COALESCE(due_amount, 0) > 0
             GROUP BY party_name
             ORDER BY total_due DESC, order_count DESC
             LIMIT 8`,
            values
        );

        const pricingGaps = await query(
            `SELECT item,
                    COUNT(*) AS order_count,
                    COALESCE(SUM(totalAmount), 0) AS total_sales
             FROM order_entry
             ${whereClause}
             AND (COALESCE(quantity, 0) = 0 OR COALESCE(amount, 0) = 0)
             GROUP BY item
             ORDER BY order_count DESC, total_sales DESC
             LIMIT 8`,
            values
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

        const overallTotalSales = Number(normalSummary.total_sales || 0) + Number(b2bSummary.total_sales || 0);
        const overallOrderCount = Number(normalSummary.order_count || 0) + Number(b2bSummary.order_count || 0);
        const currentMonthSales = Number(currentMonthSummary.total_sales || 0);
        const previousMonthSales = Number(previousMonthSummary.total_sales || 0);
        const monthGrowthPercent = previousMonthSales > 0
            ? ((currentMonthSales - previousMonthSales) / previousMonthSales) * 100
            : (currentMonthSales > 0 ? 100 : 0);
        const highestMonth = yearlyMonthlySales.reduce((best, month) =>
            Number(month.total_sales || 0) > Number(best?.total_sales || 0) ? month : best,
            yearlyMonthlySales[0] || null
        );

        sendSuccess(res, "Analytics fetched successfully.", {
            filters: {
                mode,
                accountId: accountId || '',
                item: item || '',
                days: validDays,
                year: validYear
            },
            normalSummary,
            b2bSummary,
            overallSummary: {
                orderCount: overallOrderCount,
                totalSales: overallTotalSales,
                totalCashCredit: Number(normalSummary.total_cash_credit || 0) + Number(b2bSummary.total_cash_credit || 0),
                totalBankCredit: Number(normalSummary.total_bank_credit || 0) + Number(b2bSummary.total_bank_credit || 0),
                totalDue: Number(normalSummary.total_due || 0) + Number(b2bSummary.total_due || 0),
                totalDuePaid: Number(normalSummary.total_due_paid || 0) + Number(b2bSummary.total_due_paid || 0),
                pendingPricingCount: Number(normalSummary.pending_pricing_count || 0) + Number(b2bSummary.pending_pricing_count || 0),
                averageOrderValue: Number(overallOrderMetrics.average_order_value || 0),
                biggestOrderValue: Number(overallOrderMetrics.biggest_order_value || 0),
                smallestNonZeroOrder: Number(overallOrderMetrics.smallest_non_zero_order || 0)
            },
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
                yearToDateSales: yearlyMonthlySales.reduce((sum, month) => sum + Number(month.total_sales || 0), 0),
                yearToDateOrders: yearlyMonthlySales.reduce((sum, month) => sum + Number(month.order_count || 0), 0),
                averageDailySales: salesTimeline.length ? salesTimeline.reduce((sum, day) => sum + Number(day.total_sales || 0), 0) / salesTimeline.length : 0,
                dueRecoveryRate: (Number(normalSummary.total_due_paid || 0) + Number(b2bSummary.total_due_paid || 0)) > 0
                    ? ((Number(normalSummary.total_due_paid || 0) + Number(b2bSummary.total_due_paid || 0))
                        / Math.max((Number(normalSummary.total_due || 0) + Number(b2bSummary.total_due || 0)) + (Number(normalSummary.total_due_paid || 0) + Number(b2bSummary.total_due_paid || 0)), 1)) * 100
                    : 0
            },
            monthlySales: monthlySales.reverse(),
            salesTimeline,
            yearlyMonthlySales,
            topItems,
            accountBreakdown,
            paymentBreakdown,
            sourceBreakdown,
            weekdayPerformance,
            partyPerformance,
            printStatusSummary,
            orderValueBands,
            dueByParty,
            pricingGaps,
            rateChangeHistory,
            latestRateSnapshot
        });
    } catch (error) {
        console.error('Get analytics failed', error);
        sendError(res, "Unable to fetch analytics.", 500);
    }
}

export { getAnalytics };
