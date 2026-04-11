import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { useAppContext } from '../context/AppContext.js';

const formatCurrency = (value) => Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const OnsiteCashCollectionPage = () => {
    const { currentUser, notify, notifyError } = useAppContext();
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCollecting, setIsCollecting] = useState(false);
    const [selectedIds, setSelectedIds] = useState(new Set());

    const loadOrders = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await axios.get('/data/onsite-cash');
            const nextOrders = response.data.data || [];
            setOrders(nextOrders);
            setSelectedIds((previous) => {
                if (!previous.size) {
                    return previous;
                }
                const next = new Set();
                nextOrders.forEach((order) => {
                    if (previous.has(order.id)) {
                        next.add(order.id);
                    }
                });
                return next;
            });
        } catch (error) {
            notifyError(error, 'Unable to load onsite cash collection orders.');
        } finally {
            setIsLoading(false);
        }
    }, [notify]);

    useEffect(() => {
        loadOrders();
    }, [loadOrders]);

    const collectCashHandler = async () => {
        setIsCollecting(true);
        try {
            const response = await axios.post('/data/onsite-cash/collect', {
                ids: Array.from(selectedIds),
                updatedBy: currentUser?.fullName || currentUser?.email || 'System',
                updatedByUserId: currentUser?.id || null
            });
            notify('success', response.data.message);
            await loadOrders();
        } catch (error) {
            notifyError(error, 'Unable to mark onsite cash as collected.');
        } finally {
            setIsCollecting(false);
        }
    };

    const totalPending = orders.reduce((sum, order) => sum + Number(order.cashCredit || 0), 0);
    const selectedTotal = orders
        .filter((order) => selectedIds.has(order.id))
        .reduce((sum, order) => sum + Number(order.cashCredit || 0), 0);

    const toggleSelectAll = () => {
        if (selectedIds.size === orders.length) {
            setSelectedIds(new Set());
            return;
        }
        setSelectedIds(new Set(orders.map((order) => order.id)));
    };

    const toggleSelectOne = (orderId) => {
        setSelectedIds((previous) => {
            const next = new Set(previous);
            if (next.has(orderId)) {
                next.delete(orderId);
            } else {
                next.add(orderId);
            }
            return next;
        });
    };

    const getFinancialYear = (dateValue) => {
        if (!dateValue) {
            return '-';
        }
        const dateObj = new Date(dateValue);
        if (Number.isNaN(dateObj.getTime())) {
            return '-';
        }
        const year = dateObj.getFullYear();
        const month = dateObj.getMonth() + 1;
        if (month >= 4) {
            return `${year}/${String(year + 1).slice(-2)}`;
        }
        return `${year - 1}/${String(year).slice(-2)}`;
    };

    return (
        <section className="form-container">
            <div className="page-heading">
                <div>
                    <h2 className="mb-2">Onsite Cash Collection</h2>
                    <p className="page-subtitle mb-0">Review cash orders that still need to be collected from the site and mark them as collected together.</p>
                </div>
                <div className="page-badge">{orders.length} pending</div>
            </div>

            <div className="section-card">
                <div className="fetch-results-summary">
                    <div className="fetch-results-card">
                        <span>Orders Pending</span>
                        <strong>{orders.length}</strong>
                    </div>
                    <div className="fetch-results-card">
                        <span>Cash To Collect</span>
                        <strong>{formatCurrency(totalPending)}</strong>
                    </div>
                    <div className="fetch-results-card">
                        <span>Selected Cash</span>
                        <strong>{formatCurrency(selectedTotal)}</strong>
                    </div>
                </div>
                <div className="action-row">
                    <button type="button" className="btn btn-success" disabled={isCollecting || !selectedIds.size} onClick={collectCashHandler}>
                        {isCollecting ? 'Updating...' : 'Collected Cash'}
                    </button>
                </div>
            </div>

            <div className="section-card mt-4">
                {isLoading ? <p className="mb-0">Loading onsite cash orders...</p> : !orders.length ? <p className="mb-0 text-muted">No onsite cash collection is pending right now.</p> : (
                    <div className="table-responsive">
                        <table className="table table-hover app-table align-middle">
                            <thead>
                                <tr>
                                    <th>Order Id</th>
                                    <th>Invoice No.</th>
                                    <th>Date</th>
                                    <th>Party</th>
                                    <th>Site</th>
                                    <th>Item</th>
                                    <th>Quantity</th>
                                    <th>Amount</th>
                                    <th>Due</th>
                                    <th>Cash To Collect</th>
                                    <th>
                                        <input
                                            type="checkbox"
                                            className="form-check-input"
                                            checked={orders.length > 0 && selectedIds.size === orders.length}
                                            onChange={toggleSelectAll}
                                        />
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((order) => (
                                    <tr key={order.id}>
                                        <td>{order.bookNumber}/{order.slipNumber}/{getFinancialYear(order.date)}</td>
                                        <td>{order.date ? String(order.date).split('T')[0] : '-'}</td>
                                        <td>{order.name}</td>
                                        <td>{order.site}</td>
                                        <td>{order.item}</td>
                                        <td>{order.quantity ?? '-'}</td>
                                        <td>{formatCurrency(order.amount)}</td>
                                        <td>{formatCurrency(order.dueAmount)}</td>
                                        <td>{formatCurrency(order.cashCredit)}</td>
                                        <td>
                                            <input
                                                type="checkbox"
                                                className="form-check-input"
                                                checked={selectedIds.has(order.id)}
                                                onChange={() => toggleSelectOne(order.id)}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </section>
    );
};

export default OnsiteCashCollectionPage;
