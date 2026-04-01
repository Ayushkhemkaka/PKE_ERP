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

const AnalyticsPage = () => {
    const { notify } = useAppContext();
    const [analytics, setAnalytics] = useState(null);

    const loadAnalytics = useCallback(async () => {
        try {
            const response = await axios.get('/data/analytics');
            setAnalytics(response.data.data);
        } catch (error) {
            notify('error', error.response?.data?.message || 'Unable to load analytics.');
        }
    }, [notify]);

    useEffect(() => {
        loadAnalytics();
    }, [loadAnalytics]);

    return (
        <section className='form-container'>
            <div className="page-heading">
                <div>
                    <span className="page-eyebrow">Analytics</span>
                    <h2 className="mb-2">Sales Insights</h2>
                    <p className="page-subtitle mb-0">Track total sales, collection health, pending pricing gaps, channel split, and high-performing items from one view.</p>
                </div>
                <div className="page-badge">Insights board</div>
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
                            <h5 className="mb-3">Monthly Sales</h5>
                            <div className="history-list">
                                {analytics.monthlySales.map((month) => <div className="history-item" key={month.month_label}>
                                    <strong>{month.month_label}</strong>
                                    <span>{formatCurrency(month.total_sales)}</span>
                                </div>)}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="section-card mt-4">
                    <div className="section-card-header">
                        <div>
                            <h5 className="mb-1">Top Items</h5>
                            <p className="section-subtitle mb-0">Best performing items across normal and B2B orders.</p>
                        </div>
                    </div>
                    <div className="table-responsive">
                        <table className="table table-hover app-table align-middle">
                            <thead>
                                <tr>
                                    <th>Item</th>
                                    <th>Orders</th>
                                    <th>Total Sales</th>
                                </tr>
                            </thead>
                            <tbody>
                                {analytics.topItems.map((item) => <tr key={item.item}>
                                    <td>{item.item}</td>
                                    <td>{item.order_count}</td>
                                    <td>{formatCurrency(item.total_sales)}</td>
                                </tr>)}
                            </tbody>
                        </table>
                    </div>
                </div>
            </>}
        </section>
    );
}

export default AnalyticsPage;
