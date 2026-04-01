import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { useAppContext } from '../context/AppContext.js';
import { buildInvoiceHtml, buildPrintableOrder, formatCurrency } from '../utils/receiptUtils.js';

const OwnerReceiptReprint = () => {
    const { currentUser, notify } = useAppContext();
    const [receipts, setReceipts] = useState([]);
    const [selectedReceipt, setSelectedReceipt] = useState(null);

    const loadReceipts = useCallback(async () => {
        try {
            const response = await axios.get('/data/receipts');
            const nextReceipts = response.data.data.map((receipt) => buildPrintableOrder(receipt));
            setReceipts(nextReceipts);
            setSelectedReceipt((current) => nextReceipts.find((receipt) => receipt.id === current?.id) || nextReceipts[0] || null);
        } catch (error) {
            notify('error', error.response?.data?.message || 'Unable to load receipt history.');
        }
    }, [notify]);

    useEffect(() => {
        loadReceipts();
    }, [loadReceipts]);

    const printReceipt = async (receipt) => {
        const printWindow = window.open('', '_blank', 'width=900,height=700');
        if (!printWindow) {
            notify('error', 'Please allow popups to print the invoice.');
            return;
        }

        try {
            await axios.post('/data/receipts/print', {
                id: receipt.id,
                printedBy: currentUser?.email || currentUser?.fullName || 'Owner'
            });
            printWindow.document.write(buildInvoiceHtml(receipt, receipt.orderType === 'B2B' ? 'B2B Order Invoice' : 'Order Entry Invoice'));
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
            notify('success', 'Receipt print status updated.');
            await loadReceipts();
        } catch (error) {
            printWindow.close();
            notify('error', error.response?.data?.message || 'Unable to print this receipt.');
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
                            <p className="section-subtitle mb-0">Includes both printed and unprinted receipts from general and B2B orders.</p>
                        </div>
                    </div>
                    <div className="receipt-list">
                        {receipts.map((receipt) => <button type="button" className={`receipt-list-item${selectedReceipt?.id === receipt.id ? ' receipt-list-item-active' : ''}`} key={receipt.id} onClick={() => setSelectedReceipt(receipt)}>
                            <span>{receipt.invoiceNumber}</span>
                            <strong>{receipt.name}</strong>
                            <small>{receipt.orderType} | {receipt.printedBy || 'Not printed yet'}</small>
                        </button>)}
                    </div>
                </div>
                <div className="section-card invoice-preview-card">
                    {selectedReceipt ? <>
                        <div className="section-card-header">
                            <div>
                                <h5 className="mb-1">Receipt Preview</h5>
                                <p className="section-subtitle mb-0">Owner reprints are tracked against the current login id.</p>
                            </div>
                            <div className="page-badge">{selectedReceipt.printedBy || 'Unprinted'}</div>
                        </div>
                        <div className="invoice-sheet">
                            <div className="challan-preview-grid">
                                <div className="challan-preview-card">
                                    <div className="challan-preview-topline">Railway Gate Pass / Challan</div>
                                    <div className="challan-preview-header">
                                        <div className="challan-brand-block">
                                            <p className="challan-brand-name">P. K. ENTERPRISES</p>
                                            <p className="challan-brand-copy">Harinagar - 845106, Bihar</p>
                                            <p className="challan-brand-copy">GSTIN - 10AENPK8366A1ZQ</p>
                                        </div>
                                        <div className="challan-meta-block">
                                            <div className="challan-meta-row">
                                                <span>Sl. No.</span>
                                                <strong>{selectedReceipt.invoiceNumber}</strong>
                                            </div>
                                            <div className="challan-meta-row">
                                                <span>Date</span>
                                                <strong>{selectedReceipt.date?.split('T')[0] || selectedReceipt.date}</strong>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="challan-body-grid">
                                        <div className="challan-row challan-row-full"><span>M/s</span><strong>{selectedReceipt.name}</strong></div>
                                        <div className="challan-row"><span>GSTN</span><strong>{selectedReceipt.customerGstin || '-'}</strong></div>
                                        <div className="challan-row"><span>Dly. Point</span><strong>{selectedReceipt.site || '-'}</strong></div>
                                        <div className="challan-row"><span>Material/Size</span><strong>{selectedReceipt.item}</strong></div>
                                        <div className="challan-row"><span>{selectedReceipt.showQuantity ? 'Quantity' : 'Gross'}</span><strong>{selectedReceipt.showQuantity ? selectedReceipt.quantity : selectedReceipt.gross}</strong></div>
                                        <div className="challan-row"><span>{selectedReceipt.showQuantity ? 'Measurement' : 'Tare'}</span><strong>{selectedReceipt.showQuantity ? selectedReceipt.measurementUnit : selectedReceipt.tare}</strong></div>
                                        {!selectedReceipt.showQuantity ? <div className="challan-row"><span>Net</span><strong>{selectedReceipt.net}</strong></div> : <div className="challan-row"><span>Source</span><strong>{selectedReceipt.source || '-'}</strong></div>}
                                        <div className="challan-row"><span>Rate</span><strong>{formatCurrency(selectedReceipt.rate)}</strong></div>
                                        <div className="challan-row"><span>MOD</span><strong>{selectedReceipt.paymentStatus}</strong></div>
                                        <div className="challan-row"><span>Amount</span><strong>{formatCurrency(selectedReceipt.amount)}</strong></div>
                                        <div className="challan-row"><span>FRT</span><strong>{formatCurrency(selectedReceipt.freight)}</strong></div>
                                        <div className="challan-row challan-row-full"><span>Vehicle No.</span><strong>{selectedReceipt.lorryNumber || '-'}</strong></div>
                                        <div className="challan-row challan-row-full"><span>Remarks</span><strong>{selectedReceipt.remarks || '-'}</strong></div>
                                    </div>
                                </div>
                            </div>
                            <div className="invoice-preview-grid mt-3">
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
