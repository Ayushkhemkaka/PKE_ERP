import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { useAppContext } from '../context/AppContext.js';

const CHART_JS_URL = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.3/dist/chart.umd.min.js';

const metricCards = [
    { key: 'totalSales', label: 'Total Sales', type: 'currency' },
    { key: 'orderCount', label: 'Orders', type: 'count' },
    { key: 'averageOrderValue', label: 'Avg Order', type: 'currency' },
    { key: 'totalDue', label: 'Open Due', type: 'currency' },
    { key: 'totalDuePaid', label: 'Recovered Due', type: 'currency' },
    { key: 'pendingPricingCount', label: 'Pending Pricing', type: 'count' }
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

const InsightCard = ({ title, value, hint }) => (
    <div className="analytics-card">
        <span>{title}</span>
        <strong>{value}</strong>
        {hint ? <small>{hint}</small> : null}
    </div>
);

const InsightList = ({ title, items, valueFormatter = formatCurrency, emptyText = 'No data available for this filter.' }) => (
    <div className="section-card">
        <div className="section-card-header">
            <div>
                <h5 className="mb-1">{title}</h5>
            </div>
        </div>
        {items.length ? <div className="history-list">
            {items.map((item) => <div className="history-item" key={`${title}-${item.label}`}>
                <strong>{item.label}</strong>
                <span>{valueFormatter(item.value)}</span>
                {item.subtext ? <small>{item.subtext}</small> : null}
            </div>)}
        </div> : <p className="mb-0 text-muted">{emptyText}</p>}
    </div>
);

const ChartPanel = ({ title, type = 'bar', labels = [], datasets = [], height = 280, options = {} }) => {
    const canvasRef = useRef(null);
    const chartRef = useRef(null);

    useEffect(() => {
        let mounted = true;
        chartJsLoader().then((Chart) => {
            if (!mounted || !Chart || !canvasRef.current) {
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
                    plugins: {
                        legend: {
                            display: datasets.length > 1 || ['pie', 'doughnut'].includes(type)
                        }
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
    }, [type, labels, datasets, options]);

    return (
        <div className="section-card analytics-chart-card">
            <div className="section-card-header">
                <div>
                    <h5 className="mb-1">{title}</h5>
                </div>
            </div>
            <div className="analytics-chart-wrap" style={{ height }}>
                <canvas ref={canvasRef} />
            </div>
        </div>
    );
};

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
        year: new Date().getFullYear()
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
            const nextItems = (response.data.data || [])
                .filter((itemRow) => itemRow.isActive)
                .map((itemRow) => itemRow.itemName)
                .sort((left, right) => left.localeCompare(right));
            setItems(nextItems);
        } catch (error) {
            notify('error', error.response?.data?.message || 'Unable to load item list.');
        }
    }, [notify]);

    useEffect(() => {
        loadAnalytics();
        loadAccounts();
        loadItems();
    }, [loadAnalytics, loadAccounts, loadItems]);

    const yearOptions = Array.from({ length: 5 }, (_, index) => new Date().getFullYear() - index);

    const ownerInsights = useMemo(() => {
        if (!analytics) {
            return [];
        }
        return [
            {
                title: 'This Month',
                value: formatCurrency(analytics.currentMonthSummary.totalSales),
                hint: `${formatCount(analytics.currentMonthSummary.orderCount)} orders`
            },
            {
                title: 'Month Growth',
                value: formatPercent(analytics.businessSignals.monthGrowthPercent),
                hint: `Prev month ${formatCurrency(analytics.previousMonthSummary.totalSales)}`
            },
            {
                title: 'Daily Run Rate',
                value: formatCurrency(analytics.businessSignals.averageDailySales),
                hint: `${filters.days}-day average`
            },
            {
                title: 'Due Recovery',
                value: formatPercent(analytics.businessSignals.dueRecoveryRate),
                hint: `${formatCurrency(analytics.overallSummary.totalDuePaid)} recovered`
            },
            {
                title: 'Best Month',
                value: analytics.businessSignals.highestMonth?.month_label || '-',
                hint: analytics.businessSignals.highestMonth ? formatCurrency(analytics.businessSignals.highestMonth.total_sales) : 'No month yet'
            },
            {
                title: 'YTD Sales',
                value: formatCurrency(analytics.businessSignals.yearToDateSales),
                hint: `${formatCount(analytics.businessSignals.yearToDateOrders)} orders`
            }
        ];
    }, [analytics, filters.days]);

    const salesTimelineChart = useMemo(() => ({
        labels: (analytics?.salesTimeline || []).map((entry) => entry.sales_date),
        datasets: [{
            label: 'Sales',
            data: (analytics?.salesTimeline || []).map((entry) => Number(entry.total_sales || 0)),
            borderColor: '#1f6f78',
            backgroundColor: 'rgba(31, 111, 120, 0.18)',
            tension: 0.32,
            fill: true
        }]
    }), [analytics]);

    const monthlyChart = useMemo(() => ({
        labels: (analytics?.yearlyMonthlySales || []).map((entry) => entry.month_label),
        datasets: [{
            label: 'Sales',
            data: (analytics?.yearlyMonthlySales || []).map((entry) => Number(entry.total_sales || 0)),
            backgroundColor: '#d38744',
            borderRadius: 8
        }]
    }), [analytics]);

    const paymentMixChart = useMemo(() => ({
        labels: (analytics?.paymentBreakdown || []).map((entry) => entry.payment_status || 'Unspecified'),
        datasets: [{
            label: 'Payment Mix',
            data: (analytics?.paymentBreakdown || []).map((entry) => Number(entry.total_sales || 0)),
            backgroundColor: ['#1f6f78', '#d38744', '#4b6b3c', '#b04e4e', '#8f7a57']
        }]
    }), [analytics]);

    const orderTypeChart = useMemo(() => ({
        labels: ['Cash', 'B2B'],
        datasets: [{
            label: 'Sales',
            data: [Number(analytics?.normalSummary?.total_sales || 0), Number(analytics?.b2bSummary?.total_sales || 0)],
            backgroundColor: ['#2f4858', '#f08a4b']
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

    const topItemsChart = useMemo(() => ({
        labels: (analytics?.topItems || []).map((entry) => entry.item || 'Unspecified'),
        datasets: [{
            label: 'Sales',
            data: (analytics?.topItems || []).map((entry) => Number(entry.total_sales || 0)),
            backgroundColor: '#1f6f78',
            borderRadius: 8
        }]
    }), [analytics]);

    const weekdayChart = useMemo(() => ({
        labels: (analytics?.weekdayPerformance || []).map((entry) => entry.weekday_label),
        datasets: [{
            label: 'Sales',
            data: (analytics?.weekdayPerformance || []).map((entry) => Number(entry.total_sales || 0)),
            backgroundColor: '#7d8f69',
            borderRadius: 8
        }]
    }), [analytics]);

    const dueChart = useMemo(() => ({
        labels: (analytics?.dueByParty || []).map((entry) => entry.party_name || 'Unspecified'),
        datasets: [{
            label: 'Open Due',
            data: (analytics?.dueByParty || []).map((entry) => Number(entry.total_due || 0)),
            backgroundColor: '#b04e4e',
            borderRadius: 8
        }]
    }), [analytics]);

    const printStatusChart = useMemo(() => ({
        labels: (analytics?.printStatusSummary || []).map((entry) => entry.print_status),
        datasets: [{
            label: 'Orders',
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

    const rateChangeChart = useMemo(() => ({
        labels: (analytics?.rateChangeHistory || []).map((entry) => `${entry.item_name} ${entry.unit_name}`),
        datasets: [{
            label: 'New Rate',
            data: (analytics?.rateChangeHistory || []).map((entry) => Number(entry.new_rate || 0)),
            borderColor: '#d38744',
            backgroundColor: 'rgba(211, 135, 68, 0.18)',
            tension: 0.28,
            fill: true
        }]
    }), [analytics]);

    const topPartyList = (analytics?.partyPerformance || []).slice(0, 6).map((entry) => ({
        label: entry.party_name || 'Unspecified',
        value: entry.total_sales,
        subtext: `${formatCount(entry.order_count)} orders | Due ${formatCurrency(entry.total_due)}`
    })) || [];

    const pricingGapList = (analytics?.pricingGaps || []).map((entry) => ({
        label: entry.item || 'Unspecified',
        value: entry.order_count,
        subtext: `${formatCurrency(entry.total_sales)} linked sales`
    })) || [];

    const rateSnapshotList = (analytics?.latestRateSnapshot || []).slice(0, 8).map((entry) => ({
        label: `${entry.item_name} (${entry.unit_name})`,
        value: entry.rate,
        subtext: `Updated ${entry.updated_at ? new Date(entry.updated_at).toLocaleDateString('en-CA') : '-'}`
    })) || [];

    return (
        <section className='form-container'>
            <div className="page-heading">
                <div>
                    <h2 className="mb-1">Owner Analytics</h2>
                </div>
            </div>
            <div className="section-card mb-4">
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
                            <label className="form-label" htmlFor="analyticsDays">Duration</label>
                            <select id="analyticsDays" className="form-select app-input" value={filters.days} onChange={(event) => setFilters((current) => ({ ...current, days: Number(event.target.value) }))}>
                                <option value={7}>7d</option>
                                <option value={30}>30d</option>
                                <option value={90}>90d</option>
                                <option value={180}>180d</option>
                                <option value={365}>365d</option>
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
                    <div className="col-lg-4 col-md-6">
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
                            <label className="form-label" htmlFor="analyticsAccount">Account</label>
                            <select id="analyticsAccount" className="form-select app-input" value={filters.accountId} disabled={filters.mode === 'normal'} onChange={(event) => setFilters((current) => ({ ...current, accountId: event.target.value }))}>
                                <option value="">All</option>
                                {accounts.map((account) => <option key={account.id} value={account.id}>{account.account_name}</option>)}
                            </select>
                        </div>
                    </div>
                </div>
            </div>
            {!analytics ? <div className="section-card"><p className="mb-0">Loading analytics...</p></div> : <>
                <div className="analytics-grid">
                    {metricCards.map((card) => <div className="analytics-card" key={card.key}>
                        <span>{card.label}</span>
                        <strong>{card.type === 'currency' ? formatCurrency(analytics.overallSummary[card.key]) : formatCount(analytics.overallSummary[card.key])}</strong>
                    </div>)}
                </div>

                <div className="analytics-grid mt-4">
                    {ownerInsights.map((card) => <InsightCard key={card.title} title={card.title} value={card.value} hint={card.hint} />)}
                </div>

                <div className="analytics-dashboard-grid mt-4">
                    <ChartPanel title="Daily Sales Trend" type="line" labels={salesTimelineChart.labels} datasets={salesTimelineChart.datasets} />
                    <ChartPanel title={`Monthly Sales ${filters.year}`} labels={monthlyChart.labels} datasets={monthlyChart.datasets} />
                    <ChartPanel title="Payment Mix" type="doughnut" labels={paymentMixChart.labels} datasets={paymentMixChart.datasets} options={{ cutout: '62%' }} />
                    <ChartPanel title="Cash vs B2B Sales" type="pie" labels={orderTypeChart.labels} datasets={orderTypeChart.datasets} options={{ plugins: { legend: { display: true } } }} />
                    <ChartPanel title="Top Items by Sales" labels={topItemsChart.labels} datasets={topItemsChart.datasets} options={{ indexAxis: 'y' }} />
                    <ChartPanel title="Source Performance" labels={sourceChart.labels} datasets={sourceChart.datasets} />
                    <ChartPanel title="Weekday Sales Pattern" labels={weekdayChart.labels} datasets={weekdayChart.datasets} />
                    <ChartPanel title="Due Concentration" labels={dueChart.labels} datasets={dueChart.datasets} options={{ indexAxis: 'y' }} />
                    <ChartPanel title="Print Status" type="doughnut" labels={printStatusChart.labels} datasets={printStatusChart.datasets} options={{ cutout: '58%' }} />
                    <ChartPanel title="Order Value Bands" labels={valueBandsChart.labels} datasets={valueBandsChart.datasets} />
                    <ChartPanel title="Item Rate Change Trend" type="line" labels={rateChangeChart.labels} datasets={rateChangeChart.datasets} />
                </div>

                <div className="analytics-dashboard-grid mt-4 analytics-insight-grid">
                    <InsightList title="Top Parties / Accounts" items={topPartyList} />
                    <InsightList title="Pricing Gaps" items={pricingGapList} valueFormatter={formatCount} emptyText="No pricing gaps for the current filter." />
                    <InsightList title="Latest Item Rates" items={rateSnapshotList} />
                </div>
            </>}
        </section>
    );
}

export default AnalyticsPage;
