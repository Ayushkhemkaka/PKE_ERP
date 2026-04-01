import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { useAppContext } from '../context/AppContext.js';
import { buildInvoiceHtml, buildPrintableOrder, formatCurrency } from '../utils/receiptUtils.js';

const EmployeeReceiptDesk = () => {
    const { notify } = useAppContext();
    const [receipts, setReceipts] = useState([]);
    const [selectedReceipt, setSelectedReceipt] = useState(null);

    const loadReceipts = useCallback(async () => {
        try {
            const response = await axios.get('/data/receipts', { params: { status: 'pending' } });
            const nextReceipts = response.data.data.map((receipt) => buildPrintableOrder(receipt));
            setReceipts(nextReceipts);
            setSelectedReceipt((current) => nextReceipts.find((receipt) => receipt.id === current?.id) || nextReceipts[0] || null);
        } catch (error) {
            notify('error', error.response?.data?.message || 'Unable to load generated receipts.');
        }
    }, [notify]);

    useEffect(() => {
        loadReceipts();
        const intervalId = window.setInterval(() => {
            loadReceipts();
        }, 120000);

        return () => window.clearInterval(intervalId);
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
                printedBy: 'Customer'
            });
            printWindow.document.write(buildInvoiceHtml(receipt, receipt.orderType === 'B2B' ? 'B2B Order Invoice' : 'Order Entry Invoice'));
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
            notify('success', 'Receipt marked as printed.');
            setReceipts((current) => current.filter((entry) => entry.id !== receipt.id));
            setSelectedReceipt((current) => current?.id === receipt.id ? null : current);
            await loadReceipts();
        } catch (error) {
            printWindow.close();
            notify('error', error.response?.data?.message || 'Unable to mark the receipt as printed.');
        }
    }

    return (
        <section className='form-container'>
            <div className="page-heading">
                <div>
                    <span className="page-eyebrow">Employee Desk</span>
                    <h2 className="mb-2">Receipt Desk</h2>
                    <p className="page-subtitle mb-0">Only receipts that still need customer printing appear here, and the desk refreshes automatically every 2 minutes for new orders.</p>
                </div>
                <div className="page-badge">Pending only</div>
            </div>
            <div className="receipt-desk-layout">
                <div className="section-card">
                    <div className="section-card-header">
                        <div>
                            <h5 className="mb-1">Recent Receipts</h5>
                            <p className="section-subtitle mb-0">Latest orders appear here automatically after entry.</p>
                        </div>
                    </div>
                    <div className="receipt-list">
                        {receipts.map((receipt) => <button type="button" className={`receipt-list-item${selectedReceipt?.id === receipt.id ? ' receipt-list-item-active' : ''}`} key={receipt.id} onClick={() => setSelectedReceipt(receipt)}>
                            <span>{receipt.invoiceNumber}</span>
                            <strong>{receipt.name}</strong>
                            <small>{receipt.orderType} | {receipt.isPrinted ? 'Printed' : 'Pending Print'}</small>
                        </button>)}
                    </div>
                </div>
                <div className="section-card invoice-preview-card">
                    {selectedReceipt ? <>
                        <div className="section-card-header">
                            <div>
                                <h5 className="mb-1">Receipt Preview</h5>
                                <p className="section-subtitle mb-0">Print from this page to update the print status for the selected receipt.</p>
                            </div>
                            <div className="page-badge">{selectedReceipt.isPrinted ? 'Printed' : 'Pending'}</div>
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
                        </div>
                        <div className='action-row mt-4'>
                            <button type="button" className="btn btn-dark btn-lg" onClick={() => printReceipt(selectedReceipt)}>Print Receipt</button>
                        </div>
                    </> : <p className="mb-0">No receipts available yet.</p>}
                </div>
            </div>
        </section>
    );
}

export default EmployeeReceiptDesk;
