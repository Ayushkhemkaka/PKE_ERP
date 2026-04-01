import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { useAppContext } from '../context/AppContext.js';

const metricCards = [
    { key: 'totalSales', label: 'Total Sales' },
    { key: 'totalCashCredit', label: 'Cash Credit' },
    { key: 'totalBankCredit', label: 'Bank Credit' },
    { key: 'totalDue', label: 'Open Due' },
    { key: 'totalDuePaid', label: 'Due Paid' },
    { key: 'pendingPricingCount', label: 'Pending Pricing' }
];

const formatCurrency = (value) => Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const ChartList = ({ title, data, valueKey, labelKey = 'label', formatter = formatCurrency }) => {
    const maxValue = Math.max(...data.map((item) => Number(item[valueKey] || 0)), 1);

    return (
        <div className="section-card mt-4">
            <div className="section-card-header">
                <div>
                    <h5 className="mb-1">{title}</h5>
                    <p className="section-subtitle mb-0">Visual comparison for the current filter selection.</p>
                </div>
            </div>
            <div className="chart-list">
                {data.map((item) => (
                    <div className="chart-row" key={`${title}-${item[labelKey]}`}>
                        <div className="chart-row-meta">
                            <strong>{item[labelKey]}</strong>
                            <span>{formatter(item[valueKey])}</span>
                        </div>
                        <div className="chart-row-track">
                            <div className="chart-row-fill" style={{ width: `${(Number(item[valueKey] || 0) / maxValue) * 100}%` }} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const AnalyticsPage = () => {
    const { notify } = useAppContext();
    const [analytics, setAnalytics] = useState(null);
    const [accounts, setAccounts] = useState([]);
    const [filters, setFilters] = useState({
        mode: 'all',
        days: 30,
        item: '',
        accountId: ''
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

    useEffect(() => {
        loadAnalytics();
        loadAccounts();
    }, [loadAnalytics, loadAccounts]);

    const chartItems = analytics?.topItems?.map((entry) => ({ ...entry, label: entry.item })) || [];
    const chartAccounts = analytics?.accountBreakdown?.map((entry) => ({ ...entry, label: entry.account_name })) || [];
    const chartMonths = analytics?.monthlySales?.map((entry) => ({ ...entry, label: entry.month_label })) || [];
    const chartPayments = analytics?.paymentBreakdown?.map((entry) => ({ ...entry, label: entry.payment_status || 'Unspecified' })) || [];

    return (
        <section className='form-container'>
            <div className="page-heading">
                <div>
                    <span className="page-eyebrow">Analytics</span>
                    <h2 className="mb-2">Sales Insights</h2>
                    <p className="page-subtitle mb-0">Track sales, dues, account performance, item trends, and payment mix with flexible filters for time, account, and item.</p>
                </div>
                <div className="page-badge">Insights board</div>
            </div>
            <div className="section-card mb-4">
                <div className="row g-3">
                    <div className="col-lg-3 col-md-6">
                        <div className="app-field">
                            <label className="form-label" htmlFor="analyticsMode">Order Type</label>
                            <select id="analyticsMode" className="form-select app-input" value={filters.mode} onChange={(event) => setFilters((current) => ({ ...current, mode: event.target.value, accountId: '' }))}>
                                <option value="all">All Orders</option>
                                <option value="normal">General Orders</option>
                                <option value="b2b">B2B Orders</option>
                            </select>
                        </div>
                    </div>
                    <div className="col-lg-3 col-md-6">
                        <div className="app-field">
                            <label className="form-label" htmlFor="analyticsDays">Time Duration</label>
                            <select id="analyticsDays" className="form-select app-input" value={filters.days} onChange={(event) => setFilters((current) => ({ ...current, days: Number(event.target.value) }))}>
                                <option value={7}>Last 7 days</option>
                                <option value={30}>Last 30 days</option>
                                <option value={90}>Last 90 days</option>
                                <option value={180}>Last 180 days</option>
                                <option value={365}>Last 365 days</option>
                            </select>
                        </div>
                    </div>
                    <div className="col-lg-3 col-md-6">
                        <div className="app-field">
                            <label className="form-label" htmlFor="analyticsItem">Item</label>
                            <input id="analyticsItem" className="form-control app-input" value={filters.item} onChange={(event) => setFilters((current) => ({ ...current, item: event.target.value }))} placeholder="Filter by item name" />
                        </div>
                    </div>
                    <div className="col-lg-3 col-md-6">
                        <div className="app-field">
                            <label className="form-label" htmlFor="analyticsAccount">B2B Account</label>
                            <select id="analyticsAccount" className="form-select app-input" value={filters.accountId} disabled={filters.mode === 'normal'} onChange={(event) => setFilters((current) => ({ ...current, accountId: event.target.value }))}>
                                <option value="">All accounts</option>
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
                        <strong>{card.key === 'pendingPricingCount' ? analytics.overallSummary[card.key] : formatCurrency(analytics.overallSummary[card.key])}</strong>
                    </div>)}
                    <div className="analytics-card">
                        <span>Total Orders</span>
                        <strong>{analytics.overallSummary.orderCount}</strong>
                    </div>
                </div>
                <div className="section-card mt-4">
                    <div className="row g-4">
                        <div className="col-lg-6">
                            <h5 className="mb-3">Channel Split</h5>
                            <div className="analytics-split-card">
                                <div>
                                    <span>Normal Orders</span>
                                    <strong>{analytics.normalSummary.order_count} orders</strong>
                                    <small>{formatCurrency(analytics.normalSummary.total_sales)} sales</small>
                                </div>
                                <div>
                                    <span>B2B Orders</span>
                                    <strong>{analytics.b2bSummary.order_count} orders</strong>
                                    <small>{formatCurrency(analytics.b2bSummary.total_sales)} sales</small>
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-6">
                            <h5 className="mb-3">Recent Monthly Sales</h5>
                            <div className="history-list">
                                {analytics.monthlySales.map((month) => <div className="history-item" key={month.month_label}>
                                    <strong>{month.month_label}</strong>
                                    <span>{formatCurrency(month.total_sales)}</span>
                                </div>)}
                            </div>
                        </div>
                    </div>
                </div>
                <ChartList title="Monthly Sales Chart" data={chartMonths} valueKey="total_sales" />
                <ChartList title="Top Items Chart" data={chartItems} valueKey="total_sales" />
                {chartAccounts.length ? <ChartList title="Account Sales Chart" data={chartAccounts} valueKey="total_sales" /> : null}
                <ChartList title="Payment Status Chart" data={chartPayments} valueKey="total_sales" />
            </>}
        </section>
    );
}

export default AnalyticsPage;
