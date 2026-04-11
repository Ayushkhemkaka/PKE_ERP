import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { useAppContext } from '../context/AppContext.js';
import { buildInvoiceHtml, buildMultiInvoiceHtml, buildPrintableOrder } from '../utils/receiptUtils.js';

const defaultFilters = {
    bookNumber: '',
    slipNumber: '',
    year: '',
    partyName: '',
    accountName: '',
    item: ''
};

const OwnerReceiptReprint = () => {
    const { notify, notifyError } = useAppContext();
    const [receipts, setReceipts] = useState([]);
    const [selectedReceipt, setSelectedReceipt] = useState(null);
    const [selectedReceiptIds, setSelectedReceiptIds] = useState([]);
    const [itemOptions, setItemOptions] = useState([]);
    const [accountOptions, setAccountOptions] = useState([]);
    const [filters, setFilters] = useState(defaultFilters);

    const loadReceipts = useCallback(async (activeFilters = defaultFilters) => {
        try {
            const response = await axios.get('/data/receipts', { params: activeFilters });
            const nextReceipts = response.data.data.map((receipt) => buildPrintableOrder(receipt));
            setReceipts(nextReceipts);
            setSelectedReceipt((current) => nextReceipts.find((receipt) => receipt.id === current?.id) || nextReceipts[0] || null);
            setSelectedReceiptIds((current) => current.filter((id) => nextReceipts.some((receipt) => receipt.id === id)));
        } catch (error) {
            notifyError(error, 'Unable to load receipt history.');
        }
    }, [notify]);

    const loadFilterOptions = useCallback(async () => {
        try {
            const [itemsResponse, accountsResponse] = await Promise.all([
                axios.get('/data/items/catalog'),
                axios.get('/data/accounts')
            ]);
            setItemOptions((itemsResponse.data.data || []).filter((item) => item.isActive).map((item) => item.itemName).sort((left, right) => left.localeCompare(right)));
            setAccountOptions((accountsResponse.data.data || []).map((account) => account.account_name).sort((left, right) => left.localeCompare(right)));
        } catch (error) {
            notifyError(error, 'Unable to load receipt filters.');
        }
    }, [notify]);

    useEffect(() => {
        loadReceipts(defaultFilters);
    }, [loadReceipts]);

    useEffect(() => {
        loadFilterOptions();
    }, [loadFilterOptions]);

    const filterChangeHandler = (field, value) => {
        setFilters((current) => ({
            ...current,
            [field]: value
        }));
    };

    const searchHandler = async (event) => {
        event.preventDefault();
        await loadReceipts(filters);
    };

    const clearFilters = () => {
        setFilters(defaultFilters);
        setSelectedReceipt(null);
        setSelectedReceiptIds([]);
        loadReceipts(defaultFilters);
    };

    const toggleReceiptSelection = (receiptId) => {
        setSelectedReceiptIds((current) => current.includes(receiptId) ? current.filter((id) => id !== receiptId) : [...current, receiptId]);
    };

    const printReceipt = async (targetReceipts) => {
        const printWindow = window.open('', '_blank', 'width=900,height=700');
        if (!printWindow) {
            notify('error', 'Please allow popups to print the invoice.');
            return;
        }

        try {
            const receiptList = Array.isArray(targetReceipts) ? targetReceipts : [targetReceipts];
            printWindow.document.write(
                receiptList.length > 1
                    ? buildMultiInvoiceHtml(receiptList, 'Owner Receipt Batch Print')
                    : buildInvoiceHtml(receiptList[0], receiptList[0].orderType === 'B2B' ? 'B2B Order Invoice' : 'Order Entry Invoice')
            );
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
            notify('success', `${receiptList.length} receipt${receiptList.length > 1 ? 's' : ''} sent to print.`);
            await loadReceipts();
            window.setTimeout(() => window.location.reload(), 250);
        } catch (error) {
            printWindow.close();
            notifyError(error, 'Unable to print this receipt.');
        }
    }

    return (
        <section className='form-container'>
            <div className="page-heading">
                <div>
                    <span className="page-eyebrow">Owner Desk</span>
                    <h2 className="mb-2">Reprint Receipts</h2>
                    <p className="page-subtitle mb-0">Review any previously generated receipt and reprint it with full print attribution.</p>
                </div>
                <div className="page-badge">Owner only</div>
            </div>
            <div className="receipt-desk-layout">
                <div className="section-card">
                    <div className="section-card-header">
                        <div>
                            <h5 className="mb-1">Past Receipts</h5>
                            <p className="section-subtitle mb-0">Search by book, serial, year, cash party, or B2B account name.</p>
                        </div>
                    </div>
                    <form onSubmit={searchHandler}>
                        <div className="row g-3 mb-3">
                            <div className="col-lg-6 col-md-6">
                                <div className="app-field">
                                    <label className="form-label" htmlFor="receiptBookNumber">Book Number</label>
                                    <input id="receiptBookNumber" className="form-control app-input" type="text" value={filters.bookNumber} onChange={(event) => filterChangeHandler('bookNumber', event.target.value)} />
                                </div>
                            </div>
                            <div className="col-lg-6 col-md-6">
                                <div className="app-field">
                                    <label className="form-label" htmlFor="receiptSlipNumber">Invoice Number</label>
                                    <input id="receiptSlipNumber" className="form-control app-input" type="text" value={filters.slipNumber} onChange={(event) => filterChangeHandler('slipNumber', event.target.value)} />
                                </div>
                            </div>
                            <div className="col-lg-6 col-md-6">
                                <div className="app-field">
                                    <label className="form-label" htmlFor="receiptYear">Year</label>
                                    <input id="receiptYear" className="form-control app-input" type="text" placeholder="2026" value={filters.year} onChange={(event) => filterChangeHandler('year', event.target.value)} />
                                </div>
                            </div>
                            <div className="col-lg-6 col-md-6">
                                <div className="app-field">
                                    <label className="form-label" htmlFor="receiptPartyName">Cash Party Name</label>
                                    <input id="receiptPartyName" className="form-control app-input" type="text" value={filters.partyName} onChange={(event) => filterChangeHandler('partyName', event.target.value)} />
                                </div>
                            </div>
                            <div className="col-12">
                                <div className="app-field">
                                    <label className="form-label" htmlFor="receiptAccountName">B2B Account Name</label>
                                    <select id="receiptAccountName" className="form-select app-input" value={filters.accountName} onChange={(event) => filterChangeHandler('accountName', event.target.value)}>
                                        <option value="">All B2B accounts</option>
                                        {accountOptions.map((accountName) => <option key={accountName} value={accountName}>{accountName}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="col-12">
                                <div className="app-field">
                                    <label className="form-label" htmlFor="receiptItem">Item</label>
                                    <select id="receiptItem" className="form-select app-input" value={filters.item} onChange={(event) => filterChangeHandler('item', event.target.value)}>
                                        <option value="">All items</option>
                                        {itemOptions.map((itemName) => <option key={itemName} value={itemName}>{itemName}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className='action-row mb-3'>
                            <button type="button" className="btn btn-outline-secondary btn-sm" onClick={clearFilters}>Clear Search</button>
                            <button type="submit" className="btn btn-dark btn-sm">Search Receipts</button>
                        </div>
                    </form>
                    <div className="receipt-list">
                        {receipts.map((receipt) => <button type="button" className={`receipt-list-item${selectedReceipt?.id === receipt.id ? ' receipt-list-item-active' : ''}`} key={receipt.id} onClick={() => setSelectedReceipt(receipt)}>
                            <input
                                type="checkbox"
                                className="form-check-input"
                                checked={selectedReceiptIds.includes(receipt.id)}
                                onChange={(event) => {
                                    event.stopPropagation();
                                    toggleReceiptSelection(receipt.id);
                                }}
                                onClick={(event) => event.stopPropagation()}
                            />
                            <span>{receipt.receiptReference}</span>
                            <strong>{receipt.name}</strong>
                            <small>{receipt.orderType} | {receipt.printedBy || 'Not printed yet'}</small>
                        </button>)}
                        {!receipts.length ? <p className="mb-0 text-muted">No receipts matched the current search.</p> : null}
                    </div>
                    <div className='action-row mt-3'>
                        <button type="button" className="btn btn-dark btn-sm" disabled={!selectedReceiptIds.length} onClick={() => printReceipt(receipts.filter((receipt) => selectedReceiptIds.includes(receipt.id)))}>Print Selected</button>
                    </div>
                </div>
                <div className="section-card invoice-preview-card">
                    {selectedReceipt ? <>
                        <div className="section-card-header">
                            <div>
                                <h5 className="mb-1">Receipt Preview</h5>
                                <p className="section-subtitle mb-0">This preview matches the actual print area, and owner reprints are tracked against the current login id.</p>
                            </div>
                            <div className="page-badge">{selectedReceipt.printedBy || 'Unprinted'}</div>
                        </div>
                        <div className="invoice-sheet">
                            <iframe
                                title={`Receipt preview ${selectedReceipt.id}`}
                                className="receipt-preview-frame"
                                srcDoc={buildInvoiceHtml(selectedReceipt, selectedReceipt.orderType === 'B2B' ? 'B2B Order Invoice' : 'Order Entry Invoice')}
                            />
                            <div className="invoice-preview-grid mt-3">
                                <div><span>Reference</span><strong>{selectedReceipt.receiptReference}</strong></div>
                                <div><span>Printed By</span><strong>{selectedReceipt.printedBy || 'Not printed yet'}</strong></div>
                            </div>
                        </div>
                        <div className='action-row mt-4'>
                            <button type="button" className="btn btn-dark btn-lg" onClick={() => printReceipt(selectedReceipt)}>Reprint Receipt</button>
                        </div>
                    </> : <p className="mb-0">No receipts available yet.</p>}
                </div>
            </div>
        </section>
    );
}

export default OwnerReceiptReprint;
