import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useAppContext } from '../context/AppContext.js';

const formatHistoryValue = (value) => {
    if (value === null || value === undefined || value === '') {
        return 'Empty';
    }
    return String(value);
};

const InvoiceHistoryPage = ({ mode = 'normal' }) => {
    const { notify } = useAppContext();
    const [searchResults, setSearchResults] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [historyData, setHistoryData] = useState({ changes: [], workLog: [] });
    const [itemOptions, setItemOptions] = useState([]);
    const [accountOptions, setAccountOptions] = useState([]);
    const isB2B = mode === 'b2b';
    const orderedChanges = useMemo(() => [...(historyData.changes || [])], [historyData.changes]);

    useEffect(() => {
        const loadOptions = async () => {
            try {
                const [itemsResponse, accountsResponse] = await Promise.all([
                    axios.get('/data/items/catalog'),
                    axios.get('/data/accounts')
                ]);
                setItemOptions((itemsResponse.data.data || []).filter((itemRow) => itemRow.isActive).map((itemRow) => itemRow.itemName).sort((left, right) => left.localeCompare(right)));
                setAccountOptions((accountsResponse.data.data || []).map((account) => account.account_name).sort((left, right) => left.localeCompare(right)));
            } catch (error) {
                notify('error', error.response?.data?.message || 'Unable to load history filters.');
            }
        };

        loadOptions();
    }, [notify]);

    const loadHistory = async (order) => {
        setSelectedOrder(order);
        try {
            const response = await axios.get('/data/history', {
                params: { id: order.id, mode }
            });
            setHistoryData(response.data.data || { changes: [], workLog: [] });
        } catch (error) {
            notify('error', error.response?.data?.message || 'Unable to load invoice history.');
        }
    };

    const searchHandler = async (event) => {
        event.preventDefault();
        const params = {
            mode,
            bookNumber: event.target.bookNumber.value,
            year: event.target.year.value,
            slipNumber: event.target.slipNumber.value,
            name: event.target.name.value,
            item: event.target.item.value,
            lorryNumber: event.target.lorryNumber.value,
            customerAccountName: event.target.customerAccountName?.value || '',
            columns: ['booknumber', 'slipnumber', 'site', 'paymentstatus', 'amount', 'totalamount', 'customeraccountname']
        };

        try {
            const response = await axios.get('/data/find', { params });
            setSearchResults(response.data.data || []);
            setSelectedOrder(null);
            setHistoryData({ changes: [], workLog: [] });
        } catch (error) {
            notify('error', error.response?.data?.message || 'Unable to search invoices.');
        }
    };

    return (
        <section className='form-container'>
            <div className="page-heading">
                <div>
                    <h2 className="mb-2">{isB2B ? 'B2B Invoice History' : 'Cash Invoice History'}</h2>
                </div>
            </div>
            <form onSubmit={searchHandler}>
                <div className="section-card">
                    <div className="row g-3">
                        <div className="col-lg-3 col-md-6">
                            <div className="app-field">
                                <label className="form-label" htmlFor='year'>Year</label>
                                <input className="form-control app-input" type="number" id="year" name="year" placeholder="2026" />
                            </div>
                        </div>
                        <div className="col-lg-3 col-md-6">
                            <div className="app-field">
                                <label className="form-label" htmlFor='bookNumber'>Book Number</label>
                                <input className="form-control app-input" type="number" id="bookNumber" name="bookNumber" />
                            </div>
                        </div>
                        <div className="col-lg-3 col-md-6">
                            <div className="app-field">
                                <label className="form-label" htmlFor='slipNumber'>Serial Number</label>
                                <input className="form-control app-input" type="number" id="slipNumber" name="slipNumber" />
                            </div>
                        </div>
                        <div className="col-lg-3 col-md-6">
                            <div className="app-field">
                                <label className="form-label" htmlFor='name'>Name</label>
                                <input className="form-control app-input" type="text" id="name" name="name" />
                            </div>
                        </div>
                        <div className="col-lg-3 col-md-6">
                            <div className="app-field">
                                <label className="form-label" htmlFor='item'>Item</label>
                                <select className="form-select app-input" id="item" name="item" defaultValue="">
                                    <option value="">All items</option>
                                    {itemOptions.map((itemName) => <option key={itemName} value={itemName}>{itemName}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="col-lg-3 col-md-6">
                            <div className="app-field">
                                <label className="form-label" htmlFor='lorryNumber'>Lorry Number</label>
                                <input className="form-control app-input" type="text" id="lorryNumber" name="lorryNumber" />
                            </div>
                        </div>
                        {isB2B ? <div className="col-lg-3 col-md-6">
                            <div className="app-field">
                                <label className="form-label" htmlFor='customerAccountName'>Customer Account</label>
                                <select className="form-select app-input" id="customerAccountName" name="customerAccountName" defaultValue="">
                                    <option value="">All B2B accounts</option>
                                    {accountOptions.map((accountName) => <option key={accountName} value={accountName}>{accountName}</option>)}
                                </select>
                            </div>
                        </div> : null}
                    </div>
                    <div className='action-row mt-4'>
                        <button type="submit" className="btn btn-success btn-lg">Search History</button>
                    </div>
                </div>
            </form>

            <div className="section-card mt-4">
                {!searchResults.length ? <p className="mb-0 text-muted">Search an invoice to load its history.</p> : <div className="table-responsive">
                    <table className="table table-hover app-table align-middle">
                        <thead>
                            <tr>
                                <th>Year</th>
                                <th>Name</th>
                                <th>Item</th>
                                <th>Site</th>
                                <th>Total</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {searchResults.map((order) => (
                                <tr key={order.id}>
                                    <td>{order.date ? new Date(order.date).getFullYear() : '-'}</td>
                                    <td>{order.name}</td>
                                    <td>{order.item}</td>
                                    <td>{order.site || '-'}</td>
                                    <td>{Number(order.totalamount || order.amount || 0).toFixed(2)}</td>
                                    <td>
                                        <button type="button" className="btn btn-sm btn-outline-dark" onClick={() => loadHistory(order)}>
                                            View History
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>}
            </div>

            {selectedOrder ? <div className="section-card mt-4">
                <div className="section-card-header">
                    <div>
                        <h5 className="mb-1">{selectedOrder.date ? new Date(selectedOrder.date).getFullYear() : 'History'}</h5>
                    </div>
                </div>
                <div>
                    <h6 className="mb-3">Field Changes</h6>
                    {orderedChanges.length ? <div className="history-list history-list-two-col">
                        {orderedChanges.map((entry) => (
                            <div className="history-item" key={`change-${entry.id}`}>
                                <div className="history-item-line history-item-line-compact">
                                    <strong>{entry.field}</strong>
                                    <span>{`${formatHistoryValue(entry.oldvalue)} -> ${formatHistoryValue(entry.newvalue)}`}</span>
                                </div>
                                <small>{entry.createdby} | {new Date(entry.createddate).toLocaleString()}</small>
                            </div>
                        ))}
                    </div> : <p className="mb-0 text-muted">No field changes recorded yet.</p>}
                </div>
                <div className="mt-3">
                    <h6 className="mb-3">User Work Log</h6>
                    {historyData.workLog?.length ? <div className="history-list">
                        {historyData.workLog.map((entry) => (
                            <div className="history-item" key={`work-${entry.id}`}>
                                <div className="history-item-line history-item-line-compact">
                                    <strong>{entry.action_type}</strong>
                                    <span>{entry.user_name}{entry.user_email ? ` (${entry.user_email})` : ''}</span>
                                </div>
                                <small>{new Date(entry.created_at).toLocaleString()}</small>
                            </div>
                        ))}
                    </div> : <p className="mb-0 text-muted">No user activity recorded yet.</p>}
                </div>
            </div> : null}
        </section>
    );
};

export default InvoiceHistoryPage;
