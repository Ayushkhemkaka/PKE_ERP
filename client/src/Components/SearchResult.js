import React, { useMemo, useState } from 'react';
import axios from 'axios';
import UpdateButton from './UpdateButton.js';
import OrderUpdate from './OrderUpdate.js';
import { useAppContext } from '../context/AppContext.js';

const formatHistoryValue = (value) => {
    if (value === null || value === undefined || value === '') {
        return 'Empty';
    }
    return String(value);
};

const SearchResult = (props) => {
    const { notify, notifyError } = useAppContext();
    const [selectedData, setSelectedData] = useState(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [initialData, setInitialData] = useState({});
    const [idx, setIdx] = useState(-1);
    const [historyData, setHistoryData] = useState({ changes: [], workLog: [] });
    const orderedChanges = useMemo(() => [...(historyData.changes || [])], [historyData.changes]);

    const selectedOrderTitle = selectedData?.id ? `${selectedData.name || 'Order'} - ${selectedData.id}` : 'No order selected';
    const selectedOrderMeta = selectedData?.id
        ? `${selectedData.item || 'Item pending'} | Qty ${selectedData.quantity || 0}${selectedData.net ? ` | Net ${selectedData.net}` : ''}${selectedData.remarks ? ` | ${selectedData.remarks}` : ''}`
        : props.mode === 'b2b'
            ? 'Choose a B2B order to inspect account-linked details and update values.'
            : 'Choose a general order to inspect payment and pricing details.';

    const rowSelectHandler = async (_event, selectedRowData, selectedIndex) => {
        const isSameRow = selectedData?.key === selectedRowData.key;

        props.tableData.forEach((row) => {
            row.selected = false;
        });

        if (isSameRow) {
            setSelectedData(null);
            setIdx(-1);
            setIsUpdating(false);
            setHistoryData({ changes: [], workLog: [] });
            setInitialData({});
            return;
        }

        selectedRowData.selected = true;
        setSelectedData(selectedRowData);
        setIdx(selectedIndex);
        setIsUpdating(false);
        await findById(selectedRowData.id);
        await loadHistory(selectedRowData.id);
    };

    const findById = async (id) => {
        await axios.get('/data/findById', {
            headers: {
                'Content-Type': 'application/json'
            },
            params: {
                Id: id,
                mode: props.mode || selectedData?.ordermode || 'normal'
            }
        }).then((res) => {
            const order = res.data.data[0];
            setInitialData({
                name: order.name,
                site: order.site,
                source: order.source,
                item: order.item,
                measurementUnit: order.measurementunit,
                orderStatus: order.orderstatus,
                quantity: order.quantity,
                gross: order.gross,
                tare: order.tare,
                net: order.net,
                rate: order.rate,
                amount: order.amount,
                discount: order.discount,
                freight: order.freight,
                taxPercent: order.taxpercent,
                taxAmount: order.taxamount,
                totalAmount: order.totalamount,
                paymentStatus: order.paymentstatus,
                dueAmount: order.dueamount,
                cashCredit: order.cashcredit,
                bankCredit: order.bankcredit
            });
        }).catch((err) => {
            notifyError(err, 'Data for this order was not found.');
        });
    };

    const updateStatusHandler = () => {
        if (selectedData?.id) {
            setIsUpdating(true);
        } else {
            notify('error', 'Select a row to update.');
        }
    };

    const loadHistory = async (id) => {
        try {
            const res = await axios.get('/data/history', {
                params: { id, mode: props.mode || selectedData?.ordermode || 'normal' }
            });
            setHistoryData(res.data.data);
        } catch (err) {
            notifyError(err, 'Unable to load order history.');
        }
    };
    const updateSuccessfulHandler = async () => {
        setIsUpdating(false);
        setSelectedData(null);
        if (idx >= 0) {
            props.tableData[idx].selected = false;
        }
        setIdx(-1);
    };

    return (
        <section className="form-container mt-4">
            <div className="page-heading page-heading-compact">
                <div>
                    <span className="page-eyebrow">Results</span>
                    <h3 className="mb-2">{props.mode === 'b2b' ? 'B2B Search Results' : 'Search Results'}</h3>
                    <p className="page-subtitle mb-0">{props.mode === 'b2b' ? 'Select one B2B row at a time to inspect and update account-linked details.' : 'Select one row at a time to inspect and update financial details.'}</p>
                </div>
                <div className="result-count">{props.tableData.length} rows</div>
            </div>
            <div className="fetch-results-summary">
                <div className="fetch-results-card">
                    <span>Selected Order</span>
                    <strong>{selectedOrderTitle}</strong>
                    <small>{selectedOrderMeta}</small>
                </div>
                <div className="fetch-results-card">
                    <span>Mode</span>
                    <strong>{props.mode === 'b2b' ? 'B2B Fetch' : 'General Fetch'}</strong>
                    <small>Search by invoice id or other details, then select one row to load its history and updates.</small>
                </div>
                <div className="fetch-results-card">
                    <span>Visible Columns</span>
                    <strong>{props.columnList.length}</strong>
                    <small>{props.columnList.join(', ')}</small>
                </div>
            </div>
            <div className="table-responsive">
                <table className="table table-hover app-table align-middle fetch-results-table">
                    <thead style={{ position: 'sticky' }}>
                        <tr>
                            <th scope="col">#</th>
                            <th scope="col">Id</th>
                            <th scope="col">Date</th>
                            <th scope="col">Name</th>
                            <th scope="col">Lorry Number</th>
                            <th scope="col">Item</th>
                            <th scope="col">Quantity</th>
                            {props.columnList.map((column) => (
                                <th scope="col" key={column}>{column}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {props.tableData.map((data, index) => (
                            <tr key={data.key}>
                                <th scope="row">
                                    <input
                                        type="checkbox"
                                        checked={data.selected}
                                        className="form-check-input"
                                        id={data.key}
                                        onChange={(event) => rowSelectHandler(event, data, index)}
                                    />
                                </th>
                                <td>{data.id}</td>
                                <td>{data.date?.split('T')[0]}</td>
                                <td>{data.name}</td>
                                <td>{data.lorrynumber}</td>
                                <td>{data.item}</td>
                                <td>{data.quantity}</td>
                                {props.columnList.map((column) => (
                                    <td key={`${data.id}-${column}`}>{data[column.toLowerCase()]}</td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <UpdateButton updateStatus={updateStatusHandler} data={selectedData} />
            {isUpdating ? <OrderUpdate updateSuccessful={updateSuccessfulHandler} initialData={initialData} data={selectedData} mode={props.mode} /> : null}
            {selectedData?.id ? (
                <div className="section-card mt-4">
                    <div className="section-card-header">
                        <div>
                            <h5 className="mb-1">Change History</h5>
                            <p className="section-subtitle mb-0">Track field-level edits and user actions for the selected order.</p>
                        </div>
                    </div>
                    <div>
                        <h6 className="mb-3">Field Changes</h6>
                        {orderedChanges.length ? (
                            <div className="history-list history-list-two-col">
                                {orderedChanges.map((entry) => (
                                    <div className="history-item" key={`change-${entry.id}`}>
                                        <div className="history-item-line history-item-line-compact">
                                            <strong>{entry.field}</strong>
                                            <span>{`${formatHistoryValue(entry.oldvalue)} -> ${formatHistoryValue(entry.newvalue)}`}</span>
                                        </div>
                                        <small>{entry.createdby} | {new Date(entry.createddate).toLocaleString()}</small>
                                    </div>
                                ))}
                            </div>
                        ) : <p className="mb-0 text-muted">No field changes recorded yet.</p>}
                    </div>
                    <div className="mt-3">
                        <h6 className="mb-3">User Work Log</h6>
                        {historyData.workLog?.length ? (
                            <div className="history-list">
                                {historyData.workLog.map((entry) => (
                                    <div className="history-item" key={`work-${entry.id}`}>
                                        <div className="history-item-line history-item-line-compact">
                                            <strong>{entry.action_type}</strong>
                                            <span>{entry.user_name}{entry.user_email ? ` (${entry.user_email})` : ''}</span>
                                        </div>
                                        <small>{new Date(entry.created_at).toLocaleString()}</small>
                                    </div>
                                ))}
                            </div>
                        ) : <p className="mb-0 text-muted">No user activity recorded yet.</p>}
                    </div>
                </div>
            ) : null}
        </section>
    );
};

export default SearchResult;
