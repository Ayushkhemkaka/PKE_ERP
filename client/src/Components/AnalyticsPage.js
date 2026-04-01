import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { useAppContext } from '../context/AppContext.js';

const CHART_JS_URL = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.3/dist/chart.umd.min.js';
const monthOptions = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
];

const chartJsLoader = (() => {
    let promise;
    return () => {
        if (typeof window === 'undefined') {
            return Promise.resolve(null);
        }
        if (window.Chart) {
            return Promise.resolve(window.Chart);
        }
        if (!promise) {
            promise = new Promise((resolve, reject) => {
                const existingScript = document.querySelector(`script[src="${CHART_JS_URL}"]`);
                if (existingScript) {
                    existingScript.addEventListener('load', () => resolve(window.Chart), { once: true });
                    existingScript.addEventListener('error', reject, { once: true });
                    return;
                }
                const script = document.createElement('script');
                script.src = CHART_JS_URL;
                script.async = true;
                script.onload = () => resolve(window.Chart);
                script.onerror = reject;
                document.head.appendChild(script);
            });
        }
        return promise;
    };
})();

const formatCurrency = (value) => Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const formatCount = (value) => Number(value || 0).toLocaleString('en-IN');
const formatPercent = (value) => `${Number(value || 0).toFixed(1)}%`;

const ChartPanel = ({ title, subtitle, type = 'bar', labels = [], datasets = [], height = 280, options = {}, emptyText = 'No data available for this view.' }) => {
    const canvasRef = useRef(null);
    const chartRef = useRef(null);
    const hasData = labels.length && datasets.some((dataset) => (dataset.data || []).some((value) => Number(value || 0) !== 0));

    useEffect(() => {
        let mounted = true;
        chartJsLoader().then((Chart) => {
            if (!mounted || !Chart || !canvasRef.current || !hasData) {
                return;
            }

            if (chartRef.current) {
                chartRef.current.destroy();
                chartRef.current = null;
            }

            chartRef.current = new Chart(canvasRef.current, {
                type,
                data: { labels, datasets },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: { mode: 'index', intersect: false },
                    plugins: {
                        legend: { display: true, position: 'bottom' }
                    },
                    scales: type === 'doughnut' || type === 'pie' ? undefined : {
                        y: { beginAtZero: true }
                    },
                    ...options
                }
            });
        }).catch(() => {});

        return () => {
            mounted = false;
            if (chartRef.current) {
                chartRef.current.destroy();
                chartRef.current = null;
            }
        };
    }, [type, labels, datasets, options, hasData]);

    return (
        <div className="section-card analytics-chart-card">
            <div className="section-card-header">
                <div>
                    <h5 className="mb-1">{title}</h5>
                    {subtitle ? <p className="section-subtitle mb-0">{subtitle}</p> : null}
                </div>
            </div>
            {hasData ? <div className="analytics-chart-wrap" style={{ height }}><canvas ref={canvasRef} /></div> : <p className="mb-0 text-muted">{emptyText}</p>}
        </div>
    );
};

const SummaryCard = ({ label, value, hint }) => (
    <div className="analytics-card analytics-summary-card">
        <span>{label}</span>
        <strong>{value}</strong>
        {hint ? <small>{hint}</small> : null}
    </div>
);

const CompactList = ({ title, rows, valueFormatter = formatCurrency, emptyText = 'No data available.' }) => (
    <div className="section-card analytics-list-card">
        <div className="section-card-header">
            <div>
                <h5 className="mb-1">{title}</h5>
            </div>
        </div>
        {rows.length ? <div className="analytics-compact-list">
            {rows.map((row) => (
                <div key={`${title}-${row.label}`} className="analytics-compact-item">
                    <div>
                        <strong>{row.label}</strong>
                        {row.subtext ? <small>{row.subtext}</small> : null}
                    </div>
                    <span>{valueFormatter(row.value)}</span>
                </div>
            ))}
        </div> : <p className="mb-0 text-muted">{emptyText}</p>}
    </div>
);

const AnalyticsSection = ({ title, subtitle, isOpen, onToggle, children }) => (
    <section className="analytics-section-card">
        <button type="button" className={`analytics-section-toggle${isOpen ? ' analytics-section-toggle-open' : ''}`} onClick={onToggle}>
            <div>
                <strong>{title}</strong>
                {subtitle ? <small>{subtitle}</small> : null}
            </div>
            <span>{isOpen ? 'Hide' : 'Show'}</span>
        </button>
        {isOpen ? <div className="analytics-section-body">{children}</div> : null}
    </section>
);

const AnalyticsPage = () => {
    const { notify } = useAppContext();
    const [analytics, setAnalytics] = useState(null);
    const [accounts, setAccounts] = useState([]);
    const [items, setItems] = useState([]);
    const [filters, setFilters] = useState({
        mode: 'all',
        days: 30,
        item: '',
        accountId: '',
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1
    });
    const [openSections, setOpenSections] = useState({
        yearly: true,
        monthly: false,
        daily: false,
        itemWise: false,
        other: false
    });

    const loadAnalytics = useCallback(async () => {
        try {
            const response = await axios.get('/data/analytics', { params: filters });
            setAnalytics(response.data.data);
        } catch (error) {
            notify('error', error.response?.data?.message || 'Unable to load analytics.');
        }
    }, [filters, notify]);

    const loadAccounts = useCallback(async () => {
        try {
            const response = await axios.get('/data/accounts');
            setAccounts(response.data.data || []);
        } catch (error) {
            notify('error', error.response?.data?.message || 'Unable to load customer accounts.');
        }
    }, [notify]);

    const loadItems = useCallback(async () => {
        try {
            const response = await axios.get('/data/items/catalog');
            setItems((response.data.data || []).filter((itemRow) => itemRow.isActive).map((itemRow) => itemRow.itemName).sort((left, right) => left.localeCompare(right)));
        } catch (error) {
            notify('error', error.response?.data?.message || 'Unable to load items.');
        }
    }, [notify]);

    useEffect(() => {
        loadAnalytics();
    }, [loadAnalytics]);

    useEffect(() => {
        loadAccounts();
        loadItems();
    }, [loadAccounts, loadItems]);

    const yearOptions = Array.from({ length: 6 }, (_, index) => new Date().getFullYear() - index);
    const toggleSection = (key) => setOpenSections((current) => ({ ...current, [key]: !current[key] }));

    const overallCards = analytics ? [
        { label: 'Total Sales', value: formatCurrency(analytics.overallSummary.totalSales) },
        { label: 'Orders', value: formatCount(analytics.overallSummary.orderCount) },
        { label: 'Average Order', value: formatCurrency(analytics.overallSummary.averageOrderValue) },
        { label: 'Open Due', value: formatCurrency(analytics.overallSummary.totalDue) },
        { label: 'Recovered Due', value: formatCurrency(analytics.overallSummary.totalDuePaid) },
        { label: 'Pending Pricing', value: formatCount(analytics.overallSummary.pendingPricingCount) }
    ] : [];

    const ownerSignals = analytics ? [
        { label: 'Month Growth', value: formatPercent(analytics.businessSignals.monthGrowthPercent), hint: `Vs previous month` },
        { label: 'Year To Date', value: formatCurrency(analytics.businessSignals.yearToDateSales), hint: `${formatCount(analytics.businessSignals.yearToDateOrders)} orders` },
        { label: 'Daily Run Rate', value: formatCurrency(analytics.businessSignals.averageDailySales), hint: `${filters.days}-day average` },
        { label: 'Due Recovery', value: formatPercent(analytics.businessSignals.dueRecoveryRate), hint: `${formatCurrency(analytics.overallSummary.totalDuePaid)} recovered` }
    ] : [];

    const yearlySalesChart = useMemo(() => ({
        labels: (analytics?.yearlyMonthlyBreakdown || []).map((entry) => entry.month_label),
        datasets: [
            {
                type: 'bar',
                label: 'Cash Sales',
                data: (analytics?.yearlyMonthlyBreakdown || []).map((entry) => Number(entry.cash_sales || 0)),
                backgroundColor: 'rgba(31, 111, 120, 0.75)',
                borderRadius: 8
            },
            {
                type: 'bar',
                label: 'B2B Sales',
                data: (analytics?.yearlyMonthlyBreakdown || []).map((entry) => Number(entry.b2b_sales || 0)),
                backgroundColor: 'rgba(211, 135, 68, 0.75)',
                borderRadius: 8
            },
            {
                type: 'line',
                label: 'Total Sales',
                data: (analytics?.yearlyMonthlyBreakdown || []).map((entry) => Number(entry.total_sales || 0)),
                borderColor: '#2f4858',
                backgroundColor: 'rgba(47, 72, 88, 0.12)',
                tension: 0.28,
                fill: false
            }
        ]
    }), [analytics]);

    const yearlyDueChart = useMemo(() => ({
        labels: (analytics?.yearlyMonthlyBreakdown || []).map((entry) => entry.month_label),
        datasets: [
            {
                label: 'Open Due',
                data: (analytics?.yearlyMonthlyBreakdown || []).map((entry) => Number(entry.due_amount || 0)),
                borderColor: '#b04e4e',
                backgroundColor: 'rgba(176, 78, 78, 0.18)',
                tension: 0.25,
                fill: true
            },
            {
                label: 'Due Paid',
                data: (analytics?.yearlyMonthlyBreakdown || []).map((entry) => Number(entry.due_paid || 0)),
                borderColor: '#4b6b3c',
                backgroundColor: 'rgba(75, 107, 60, 0.16)',
                tension: 0.25,
                fill: true
            }
        ]
    }), [analytics]);

    const yearlyCreditChart = useMemo(() => ({
        labels: (analytics?.yearlyMonthlyBreakdown || []).map((entry) => entry.month_label),
        datasets: [
            {
                label: 'Cash Credit',
                data: (analytics?.yearlyMonthlyBreakdown || []).map((entry) => Number(entry.cash_credit || 0)),
                backgroundColor: 'rgba(29, 125, 74, 0.75)',
                borderRadius: 8
            },
            {
                label: 'Bank Credit',
                data: (analytics?.yearlyMonthlyBreakdown || []).map((entry) => Number(entry.bank_credit || 0)),
                backgroundColor: 'rgba(90, 111, 170, 0.72)',
                borderRadius: 8
            }
        ]
    }), [analytics]);

    const monthlySalesChart = useMemo(() => ({
        labels: (analytics?.monthlyDailyBreakdown || []).map((entry) => entry.day_label),
        datasets: [
            {
                type: 'bar',
                label: 'Cash Sales',
                data: (analytics?.monthlyDailyBreakdown || []).map((entry) => Number(entry.cash_sales || 0)),
                backgroundColor: 'rgba(31, 111, 120, 0.72)',
                borderRadius: 6
            },
            {
                type: 'bar',
                label: 'B2B Sales',
                data: (analytics?.monthlyDailyBreakdown || []).map((entry) => Number(entry.b2b_sales || 0)),
                backgroundColor: 'rgba(211, 135, 68, 0.72)',
                borderRadius: 6
            },
            {
                type: 'line',
                label: 'Total Sales',
                data: (analytics?.monthlyDailyBreakdown || []).map((entry) => Number(entry.total_sales || 0)),
                borderColor: '#2f4858',
                tension: 0.28,
                fill: false
            }
        ]
    }), [analytics]);

    const monthlyDueChart = useMemo(() => ({
        labels: (analytics?.monthlyDailyBreakdown || []).map((entry) => entry.day_label),
        datasets: [
            {
                label: 'Open Due',
                data: (analytics?.monthlyDailyBreakdown || []).map((entry) => Number(entry.due_amount || 0)),
                borderColor: '#b04e4e',
                backgroundColor: 'rgba(176, 78, 78, 0.14)',
                tension: 0.25,
                fill: true
            },
            {
                label: 'Due Paid',
                data: (analytics?.monthlyDailyBreakdown || []).map((entry) => Number(entry.due_paid || 0)),
                borderColor: '#4b6b3c',
                backgroundColor: 'rgba(75, 107, 60, 0.12)',
                tension: 0.25,
                fill: true
            }
        ]
    }), [analytics]);

    const dailyTrendChart = useMemo(() => ({
        labels: (analytics?.dailyRecentTrend || []).map((entry) => entry.sales_date),
        datasets: [
            {
                label: 'Sales',
                data: (analytics?.dailyRecentTrend || []).map((entry) => Number(entry.total_sales || 0)),
                borderColor: '#1f6f78',
                backgroundColor: 'rgba(31, 111, 120, 0.18)',
                tension: 0.3,
                fill: true
            },
            {
                label: 'Due Paid',
                data: (analytics?.dailyRecentTrend || []).map((entry) => Number(entry.due_paid || 0)),
                borderColor: '#4b6b3c',
                backgroundColor: 'rgba(75, 107, 60, 0.12)',
                tension: 0.25,
                fill: false
            }
        ]
    }), [analytics]);

    const dailyCreditChart = useMemo(() => ({
        labels: (analytics?.dailyRecentTrend || []).map((entry) => entry.sales_date),
        datasets: [
            {
                label: 'Cash Credit',
                data: (analytics?.dailyRecentTrend || []).map((entry) => Number(entry.cash_credit || 0)),
                borderColor: '#d38744',
                backgroundColor: 'rgba(211, 135, 68, 0.16)',
                tension: 0.25,
                fill: false
            },
            {
                label: 'Bank Credit',
                data: (analytics?.dailyRecentTrend || []).map((entry) => Number(entry.bank_credit || 0)),
                borderColor: '#5671aa',
                backgroundColor: 'rgba(86, 113, 170, 0.14)',
                tension: 0.25,
                fill: false
            }
        ]
    }), [analytics]);

    const itemSalesChart = useMemo(() => ({
        labels: (analytics?.itemPerformance || []).map((entry) => entry.item || 'Unspecified'),
        datasets: [{
            label: 'Item Sales',
            data: (analytics?.itemPerformance || []).map((entry) => Number(entry.total_sales || 0)),
            backgroundColor: '#1f6f78',
            borderRadius: 8
        }]
    }), [analytics]);

    const selectedItemRateTrendChart = useMemo(() => ({
        labels: (analytics?.rateChangeHistory || []).map((entry) => new Date(entry.created_at).toLocaleDateString('en-CA')),
        datasets: [{
            label: filters.item ? `${filters.item} Rate Trend` : 'Rate Trend',
            data: (analytics?.rateChangeHistory || []).map((entry) => Number(entry.new_rate || 0)),
            borderColor: '#d38744',
            backgroundColor: 'rgba(211, 135, 68, 0.16)',
            tension: 0.26,
            fill: true
        }]
    }), [analytics, filters.item]);

    const paymentMixChart = useMemo(() => ({
        labels: (analytics?.paymentBreakdown || []).map((entry) => entry.payment_status || 'Unspecified'),
        datasets: [{
            label: 'Payment Mix',
            data: (analytics?.paymentBreakdown || []).map((entry) => Number(entry.total_sales || 0)),
            backgroundColor: ['#1f6f78', '#d38744', '#4b6b3c', '#b04e4e', '#8f7a57']
        }]
    }), [analytics]);

    const sourceChart = useMemo(() => ({
        labels: (analytics?.sourceBreakdown || []).map((entry) => entry.source || 'Unspecified'),
        datasets: [{
            label: 'Source Sales',
            data: (analytics?.sourceBreakdown || []).map((entry) => Number(entry.total_sales || 0)),
            backgroundColor: '#5a8f7b',
            borderRadius: 8
        }]
    }), [analytics]);

    const printStatusChart = useMemo(() => ({
        labels: (analytics?.printStatusSummary || []).map((entry) => entry.print_status),
        datasets: [{
            data: (analytics?.printStatusSummary || []).map((entry) => Number(entry.order_count || 0)),
            backgroundColor: ['#1f6f78', '#d9c7a8']
        }]
    }), [analytics]);

    const valueBandsChart = useMemo(() => ({
        labels: (analytics?.orderValueBands || []).map((entry) => entry.value_band),
        datasets: [{
            label: 'Orders',
            data: (analytics?.orderValueBands || []).map((entry) => Number(entry.order_count || 0)),
            backgroundColor: '#7c5e10',
            borderRadius: 8
        }]
    }), [analytics]);

    const partyRows = (analytics?.partyPerformance || []).slice(0, 8).map((entry) => ({
        label: entry.party_name || 'Unspecified',
        value: entry.total_sales,
        subtext: `${formatCount(entry.order_count)} orders | Due ${formatCurrency(entry.total_due)}`
    }));

    const dueRows = (analytics?.dueByParty || []).map((entry) => ({
        label: entry.party_name || 'Unspecified',
        value: entry.total_due,
        subtext: `${formatCount(entry.order_count)} due orders`
    }));

    const pricingGapRows = (analytics?.pricingGaps || []).map((entry) => ({
        label: entry.item || 'Unspecified',
        value: entry.order_count,
        subtext: `${formatCurrency(entry.total_sales)} linked sales`
    }));

    const rateSnapshotRows = (analytics?.latestRateSnapshot || []).slice(0, 10).map((entry) => ({
        label: `${entry.item_name} (${entry.unit_name})`,
        value: entry.rate,
        subtext: `Updated ${entry.updated_at ? new Date(entry.updated_at).toLocaleDateString('en-CA') : '-'}`
    }));

    return (
        <section className='form-container'>
            <div className="page-heading analytics-heading">
                <div>
                    <h2 className="mb-1">Owner Analytics</h2>
                    <p className="page-subtitle mb-0">A structured view of yearly, monthly, daily, item-wise, and operational trends.</p>
                </div>
            </div>

            <div className="section-card analytics-filter-card mb-4">
                <div className="row g-3">
                    <div className="col-lg-2 col-md-4">
                        <div className="app-field">
                            <label className="form-label" htmlFor="analyticsMode">Order Type</label>
                            <select id="analyticsMode" className="form-select app-input" value={filters.mode} onChange={(event) => setFilters((current) => ({ ...current, mode: event.target.value, accountId: '' }))}>
                                <option value="all">All</option>
                                <option value="normal">Cash</option>
                                <option value="b2b">B2B</option>
                            </select>
                        </div>
                    </div>
                    <div className="col-lg-2 col-md-4">
                        <div className="app-field">
                            <label className="form-label" htmlFor="analyticsDays">Daily Window</label>
                            <select id="analyticsDays" className="form-select app-input" value={filters.days} onChange={(event) => setFilters((current) => ({ ...current, days: Number(event.target.value) }))}>
                                <option value={7}>7 days</option>
                                <option value={30}>30 days</option>
                                <option value={90}>90 days</option>
                                <option value={180}>180 days</option>
                                <option value={365}>365 days</option>
                            </select>
                        </div>
                    </div>
                    <div className="col-lg-2 col-md-4">
                        <div className="app-field">
                            <label className="form-label" htmlFor="analyticsYear">Year</label>
                            <select id="analyticsYear" className="form-select app-input" value={filters.year} onChange={(event) => setFilters((current) => ({ ...current, year: Number(event.target.value) }))}>
                                {yearOptions.map((yearValue) => <option key={yearValue} value={yearValue}>{yearValue}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="col-lg-2 col-md-4">
                        <div className="app-field">
                            <label className="form-label" htmlFor="analyticsMonth">Month</label>
                            <select id="analyticsMonth" className="form-select app-input" value={filters.month} onChange={(event) => setFilters((current) => ({ ...current, month: Number(event.target.value) }))}>
                                {monthOptions.map((monthOption) => <option key={monthOption.value} value={monthOption.value}>{monthOption.label}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="col-lg-2 col-md-6">
                        <div className="app-field">
                            <label className="form-label" htmlFor="analyticsItem">Item</label>
                            <select id="analyticsItem" className="form-select app-input" value={filters.item} onChange={(event) => setFilters((current) => ({ ...current, item: event.target.value }))}>
                                <option value="">All items</option>
                                {items.map((itemName) => <option key={itemName} value={itemName}>{itemName}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="col-lg-2 col-md-6">
                        <div className="app-field">
                            <label className="form-label" htmlFor="analyticsAccount">B2B Account</label>
                            <select id="analyticsAccount" className="form-select app-input" value={filters.accountId} disabled={filters.mode === 'normal'} onChange={(event) => setFilters((current) => ({ ...current, accountId: event.target.value }))}>
                                <option value="">All</option>
                                {accounts.map((account) => <option key={account.id} value={account.id}>{account.account_name}</option>)}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {!analytics ? <div className="section-card"><p className="mb-0">Loading analytics...</p></div> : <>
                <div className="analytics-grid analytics-summary-grid">
                    {overallCards.map((card) => <SummaryCard key={card.label} label={card.label} value={card.value} hint={card.hint} />)}
                </div>

                <div className="analytics-grid analytics-signal-grid mt-3">
                    {ownerSignals.map((card) => <SummaryCard key={card.label} label={card.label} value={card.value} hint={card.hint} />)}
                </div>

                <div className="analytics-accordion mt-4">
                    <AnalyticsSection
                        title="Yearly Data Analytics"
                        subtitle={`Month by month business view for ${filters.year}`}
                        isOpen={openSections.yearly}
                        onToggle={() => toggleSection('yearly')}
                    >
                        <div className="analytics-dashboard-grid">
                            <ChartPanel title="Sales Trend Over Months" subtitle="Cash, B2B, and total sales together" labels={yearlySalesChart.labels} datasets={yearlySalesChart.datasets} height={320} />
                            <ChartPanel title="Due Trend" subtitle="Open due and recovered due by month" type="line" labels={yearlyDueChart.labels} datasets={yearlyDueChart.datasets} height={320} />
                            <ChartPanel title="Cash / Bank Trend" subtitle="Credit movement month by month" labels={yearlyCreditChart.labels} datasets={yearlyCreditChart.datasets} height={300} />
                        </div>
                    </AnalyticsSection>

                    <AnalyticsSection
                        title="Monthly Data Analytics"
                        subtitle={`${monthOptions.find((entry) => entry.value === filters.month)?.label || ''} ${filters.year}`}
                        isOpen={openSections.monthly}
                        onToggle={() => toggleSection('monthly')}
                    >
                        <div className="analytics-dashboard-grid">
                            <ChartPanel title="Daily Sales Within The Month" subtitle="Cash, B2B, and total sales by day" labels={monthlySalesChart.labels} datasets={monthlySalesChart.datasets} height={320} />
                            <ChartPanel title="Daily Due Movement" subtitle="Open due and recovered due inside the selected month" type="line" labels={monthlyDueChart.labels} datasets={monthlyDueChart.datasets} height={320} />
                        </div>
                    </AnalyticsSection>

                    <AnalyticsSection
                        title="Daily Data Analytics"
                        subtitle={`Rolling ${filters.days}-day view`}
                        isOpen={openSections.daily}
                        onToggle={() => toggleSection('daily')}
                    >
                        <div className="analytics-dashboard-grid">
                            <ChartPanel title="Daily Sales Trend" subtitle="Recent day-to-day revenue movement" type="line" labels={dailyTrendChart.labels} datasets={dailyTrendChart.datasets} height={320} />
                            <ChartPanel title="Daily Cash / Bank Trend" subtitle="How collections moved day by day" type="line" labels={dailyCreditChart.labels} datasets={dailyCreditChart.datasets} height={320} />
                        </div>
                    </AnalyticsSection>

                    <AnalyticsSection
                        title="Item Wise Analytics"
                        subtitle="Product performance and item rate movement"
                        isOpen={openSections.itemWise}
                        onToggle={() => toggleSection('itemWise')}
                    >
                        <div className="analytics-dashboard-grid">
                            <ChartPanel title="Item Sales Comparison" subtitle="Highest selling items in the selected year" labels={itemSalesChart.labels} datasets={itemSalesChart.datasets} height={320} />
                            <ChartPanel title="Rate Change Trend" subtitle={filters.item ? `Rate history for ${filters.item}` : 'Select an item to see its individual rate trend'} type="line" labels={selectedItemRateTrendChart.labels} datasets={selectedItemRateTrendChart.datasets} height={320} emptyText="Select a specific item to see its individual rate trend." />
                        </div>
                        <div className="analytics-dashboard-grid mt-3 analytics-insight-grid">
                            <CompactList title="Latest Item Rates" rows={rateSnapshotRows} />
                            <CompactList title="Pricing Gaps" rows={pricingGapRows} valueFormatter={formatCount} emptyText="No pricing gaps for the selected filters." />
                        </div>
                    </AnalyticsSection>

                    <AnalyticsSection
                        title="Other Trends"
                        subtitle="Operational and decision-support insights"
                        isOpen={openSections.other}
                        onToggle={() => toggleSection('other')}
                    >
                        <div className="analytics-dashboard-grid">
                            <ChartPanel title="Payment Mix" subtitle="Which payment modes are contributing the most" type="doughnut" labels={paymentMixChart.labels} datasets={paymentMixChart.datasets} height={280} options={{ cutout: '62%' }} />
                            <ChartPanel title="Source Trend" subtitle="Plant vs rake contribution" labels={sourceChart.labels} datasets={sourceChart.datasets} height={280} />
                            <ChartPanel title="Print Status" subtitle="Printed vs pending challans" type="doughnut" labels={printStatusChart.labels} datasets={printStatusChart.datasets} height={280} options={{ cutout: '60%' }} />
                            <ChartPanel title="Order Value Bands" subtitle="Where your invoice values are clustering" labels={valueBandsChart.labels} datasets={valueBandsChart.datasets} height={280} />
                        </div>
                        <div className="analytics-dashboard-grid mt-3 analytics-insight-grid">
                            <CompactList title="Top Parties / Accounts" rows={partyRows} />
                            <CompactList title="Due Concentration" rows={dueRows} />
                        </div>
                    </AnalyticsSection>
                </div>
            </>}
        </section>
    );
};

export default AnalyticsPage;