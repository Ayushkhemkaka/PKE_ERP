import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { useAppContext } from '../context/AppContext.js';

const formatCurrency = (value) => Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const DueAccountsPage = () => {
    const { notify, currentUser } = useAppContext();
    const [mode, setMode] = useState('b2b');
    const [accounts, setAccounts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [selectedAccountId, setSelectedAccountId] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdatingId, setIsUpdatingId] = useState('');

    const loadDueAccounts = useCallback(async (nextMode, accountId = '') => {
        setIsLoading(true);
        try {
            const response = await axios.get('/data/due-accounts', {
                params: {
                    mode: nextMode,
                    accountId
                }
            });
            setAccounts(response.data.data.accounts || []);
            setOrders(response.data.data.orders || []);
        } catch (error) {
            notify('error', error.response?.data?.message || 'Unable to load due accounts.');
        } finally {
            setIsLoading(false);
        }
    }, [notify]);

    useEffect(() => {
        loadDueAccounts(mode, selectedAccountId);
    }, [mode, selectedAccountId, loadDueAccounts]);

    const markPaid = async (id) => {
        setIsUpdatingId(id);
        try {
            const response = await axios.post('/data/due-accounts/pay', {
                id,
                mode,
                updatedBy: currentUser?.fullName || currentUser?.email || 'System'
            });
            notify('success', response.data.message);
            loadDueAccounts(mode, selectedAccountId);
        } catch (error) {
            notify('error', error.response?.data?.message || 'Unable to mark the order as paid.');
        } finally {
            setIsUpdatingId('');
        }
    };

    return (
        <section className='form-container'>
            <div className="page-heading">
                <div>
                    <span className="page-eyebrow">Due Tracking</span>
                    <h2 className="mb-2">Due Accounts</h2>
                    <p className="page-subtitle mb-0">Review pending dues for B2B accounts and general parties, then mark individual orders as paid directly from this screen.</p>
                </div>
                <div className="page-badge">Due control</div>
            </div>

            <div className="section-card">
                <div className="due-mode-switch">
                    <button type="button" className={`btn ${mode === 'b2b' ? 'btn-success' : 'btn-outline-dark'}`} onClick={() => { setMode('b2b'); setSelectedAccountId(''); }}>B2B Due Accounts</button>
                    <button type="button" className={`btn ${mode === 'normal' ? 'btn-success' : 'btn-outline-dark'}`} onClick={() => { setMode('normal'); setSelectedAccountId(''); }}>General Due Parties</button>
                </div>
                <div className="row g-3 mt-2">
                    <div className="col-lg-6">
                        <div className="app-field">
                            <label className="form-label" htmlFor="dueAccountSelect">{mode === 'b2b' ? 'Select B2B account' : 'Select general party'}</label>
                            <select
                                id="dueAccountSelect"
                                className="form-select app-input"
                                value={selectedAccountId}
                                onChange={(event) => setSelectedAccountId(event.target.value)}
                            >
                                <option value="">Choose an account to inspect due orders</option>
                                {accounts.map((account) => (
                                    <option key={account.id} value={account.id}>
                                        {account.account_name} {account.site ? `- ${account.site}` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="col-lg-6">
                        <div className="analytics-card h-100">
                            <span>Accounts with open due</span>
                            <strong>{accounts.length}</strong>
                            <small>{selectedAccountId ? 'Showing due orders for the selected account or party.' : 'Choose an account to load the due order list.'}</small>
                        </div>
                    </div>
                </div>
            </div>

            <div className="section-card mt-4">
                {isLoading ? <p className="mb-0">Loading due data...</p> : !selectedAccountId ? <p className="mb-0 text-muted">Select an account above to view its due orders.</p> : (
                    <div className="table-responsive">
                        <table className="table table-hover app-table align-middle">
                            <thead>
                                <tr>
                                    <th>Order Id</th>
                                    <th>Date</th>
                                    <th>Book/Serial</th>
                                    <th>Name</th>
                                    <th>Site</th>
                                    <th>Item</th>
                                    <th>Amount</th>
                                    <th>Current Due</th>
                                    <th>Payment Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((order) => (
                                    <tr key={order.id}>
                                        <td>{order.id}</td>
                                        <td>{order.date ? String(order.date).split('T')[0] : '-'}</td>
                                        <td>{order.bookNumber}/{order.slipNumber}</td>
                                        <td>{order.name}</td>
                                        <td>{order.site}</td>
                                        <td>{order.item}</td>
                                        <td>{formatCurrency(order.totalAmount || order.amount)}</td>
                                        <td>{formatCurrency(order.dueAmount)}</td>
                                        <td>{order.paymentStatus}</td>
                                        <td>
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-success"
                                                disabled={isUpdatingId === order.id}
                                                onClick={() => markPaid(order.id)}
                                            >
                                                {isUpdatingId === order.id ? 'Updating...' : 'Mark Paid'}
                                            </button>
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

export default DueAccountsPage;
