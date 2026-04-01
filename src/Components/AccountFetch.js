import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { useAppContext } from '../context/AppContext.js';

const formatCurrency = (value) => Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const AccountFetch = () => {
    const { notify } = useAppContext();
    const [accounts, setAccounts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadAccounts = useCallback(async () => {
        try {
            const response = await axios.get('/data/account-summary');
            setAccounts(response.data.data);
        } catch (error) {
            notify('error', error.response?.data?.message || 'Unable to load account summaries.');
        } finally {
            setIsLoading(false);
        }
    }, [notify]);

    useEffect(() => {
        loadAccounts();
    }, [loadAccounts]);

    return (
        <section className='form-container'>
            <div className="page-heading">
                <div>
                    <span className="page-eyebrow">Accounts</span>
                    <h2 className="mb-2">Account Fetch</h2>
                    <p className="page-subtitle mb-0">Review each B2B account’s current due, due collection progress, total order values, and how many orders still need quantity or amount to be completed.</p>
                </div>
                <div className="page-badge">Live dues</div>
            </div>
            <div className="section-card">
                {isLoading ? <p className="mb-0">Loading accounts...</p> : <div className="table-responsive">
                    <table className="table table-hover app-table align-middle">
                        <thead>
                            <tr>
                                <th>Account</th>
                                <th>Site</th>
                                <th>Orders</th>
                                <th>Pending Pricing</th>
                                <th>Total Order</th>
                                <th>Cash Credit</th>
                                <th>Bank Credit</th>
                                <th>Due On Create</th>
                                <th>Due Paid</th>
                                <th>Current Due</th>
                            </tr>
                        </thead>
                        <tbody>
                            {accounts.map((account) => (
                                <tr key={account.id}>
                                    <td>
                                        <strong>{account.account_name}</strong>
                                        <div className="table-subtext">{account.contact_name || 'No contact added'}</div>
                                    </td>
                                    <td>{account.site || '-'}</td>
                                    <td>{account.order_count}</td>
                                    <td>{account.pending_order_count}</td>
                                    <td>{formatCurrency(account.total_order_amount)}</td>
                                    <td>{formatCurrency(account.total_cash_credit)}</td>
                                    <td>{formatCurrency(account.total_bank_credit)}</td>
                                    <td>{formatCurrency(account.due_on_create)}</td>
                                    <td>{formatCurrency(account.due_paid)}</td>
                                    <td>{formatCurrency(account.total_due)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>}
            </div>
        </section>
    );
}

export default AccountFetch;
