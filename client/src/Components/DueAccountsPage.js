import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import { useAppContext } from '../context/AppContext.js';

const formatCurrency = (value) => Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const DueAccountsPage = ({ fixedMode = '' }) => {
    const { notify, currentUser } = useAppContext();
    const location = useLocation();
    const queryMode = useMemo(() => {
        if (fixedMode === 'normal' || fixedMode === 'b2b') {
            return fixedMode;
        }
        const searchParams = new URLSearchParams(location.search);
        return searchParams.get('mode') === 'normal' ? 'normal' : 'b2b';
    }, [fixedMode, location.search]);
    const [mode, setMode] = useState(queryMode);
    const [accounts, setAccounts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [selectedAccountId, setSelectedAccountId] = useState('');
    const [accountSearch, setAccountSearch] = useState('');
    const [invoiceId, setInvoiceId] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdatingId, setIsUpdatingId] = useState('');

    const loadDueAccounts = useCallback(async (nextMode, accountId = '', nextInvoiceId = '') => {
        setIsLoading(true);
        try {
            const response = await axios.get('/data/due-accounts', {
                params: {
                    mode: nextMode,
                    accountId,
                    invoiceId: nextInvoiceId
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
        setMode(queryMode);
        setSelectedAccountId('');
        setAccountSearch('');
        setInvoiceId('');
    }, [queryMode]);

    useEffect(() => {
        loadDueAccounts(mode, selectedAccountId, invoiceId);
    }, [mode, selectedAccountId, invoiceId, loadDueAccounts]);

    useEffect(() => {
        if (!accountSearch) {
            setSelectedAccountId('');
            return;
        }

        const match = accounts.find((account) => account.account_name.toLowerCase() === accountSearch.toLowerCase());
        setSelectedAccountId(match ? String(match.id) : '');
    }, [accountSearch, accounts]);

    const filteredAccounts = accountSearch.length >= 3
        ? accounts.filter((account) => account.account_name.toLowerCase().includes(accountSearch.toLowerCase()))
        : accounts;

    const markPaid = async (id) => {
        setIsUpdatingId(id);
        try {
            const response = await axios.post('/data/due-accounts/pay', {
                id,
                mode,
                updatedBy: currentUser?.fullName || currentUser?.email || 'System',
                updatedByUserId: currentUser?.id || null
            });
            notify('success', response.data.message);
            loadDueAccounts(mode, selectedAccountId, invoiceId);
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
                    <h2 className="mb-2">{mode === 'b2b' ? 'B2B Due Accounts' : 'Cash Due Parties'}</h2>
                    <p className="page-subtitle mb-0">{mode === 'b2b' ? 'Review pending dues for B2B accounts and mark individual orders as paid.' : 'Review pending dues for cash/general parties and mark individual orders as paid.'}</p>
                </div>
                <div className="page-badge">Due control</div>
            </div>

            <div className="section-card">
                {!fixedMode ? <div className="due-mode-switch">
                    <button type="button" className={`btn ${mode === 'b2b' ? 'btn-success' : 'btn-outline-dark'}`} onClick={() => { setMode('b2b'); setSelectedAccountId(''); }}>B2B Due Accounts</button>
                    <button type="button" className={`btn ${mode === 'normal' ? 'btn-success' : 'btn-outline-dark'}`} onClick={() => { setMode('normal'); setSelectedAccountId(''); }}>General Due Parties</button>
                </div> : null}
                <div className="row g-3 mt-2">
                    <div className="col-lg-4">
                        <div className="app-field">
                            <label className="form-label" htmlFor="dueAccountSelect">{mode === 'b2b' ? 'B2B account name' : 'Cash party name'}</label>
                            <input
                                id="dueAccountSelect"
                                list="dueAccountOptions"
                                className="form-control app-input"
                                value={accountSearch}
                                onChange={(event) => setAccountSearch(event.target.value)}
                                placeholder={mode === 'b2b' ? 'Type 3 letters or choose from the list' : 'Type 3 letters to search party'}
                            />
                            <datalist id="dueAccountOptions">
                                {filteredAccounts.map((account) => (
                                    <option key={account.id} value={account.account_name}>
                                        {account.address ? `${account.account_name} - ${account.address}` : account.account_name}
                                    </option>
                                ))}
                            </datalist>
                        </div>
                    </div>
                    <div className="col-lg-4">
                        <div className="app-field">
                            <label className="form-label" htmlFor="dueInvoiceId">Invoice Number</label>
                            <input
                                id="dueInvoiceId"
                                className="form-control app-input"
                                type="text"
                                value={invoiceId}
                                onChange={(event) => setInvoiceId(event.target.value)}
                                placeholder={mode === 'b2b' ? 'Filter B2B due by invoice id' : 'Filter cash due by invoice id'}
                            />
                        </div>
                    </div>
                    <div className="col-lg-4">
                        <div className="analytics-card h-100">
                            <span>Accounts with open due</span>
                            <strong>{accounts.length}</strong>
                            <small>{selectedAccountId || invoiceId ? 'Showing due orders for the selected account, party, or invoice.' : 'Type 3 letters of the party/account or enter an invoice id to load due orders.'}</small>
                        </div>
                    </div>
                </div>
            </div>

            <div className="section-card mt-4">
                {isLoading ? <p className="mb-0">Loading due data...</p> : !(selectedAccountId || invoiceId) ? <p className="mb-0 text-muted">Select an account or enter an invoice number above to view due orders.</p> : (
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
