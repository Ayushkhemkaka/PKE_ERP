import axios from 'axios'
import moment from 'moment'
import React, { useCallback, useEffect, useState } from 'react'
import FinanceDetails from './FinanceDetails.js';
import { useAppContext } from '../context/AppContext.js';
import { buildInvoiceHtml, buildPrintableOrder, formatCurrency } from '../utils/receiptUtils.js';
import { getErrorMessage } from '../utils/errorUtils.js';

const OrderEntry = ({ mode = 'standard' }) => {
    const { currentUser, notify } = useAppContext();
    const isB2B = mode === 'b2b';
    const [localNotice, setLocalNotice] = useState(null);

    const [item, setItem] = useState("")
    const [measurementUnit, setMeasurementUnit] = useState("")
    const [finaceDetails, setFinanceDetails] = useState({ 'quantity': 0, 'gross': 0, 'tare': 0, 'net': 0, 'rate': 0, 'amount': 0, 'discount': 0, 'freight': 0, 'taxPercent': 0, 'taxAmount': 0, 'totalAmount': 0, 'paymentStatus': '', 'dueAmount': 0, 'cashCredit': 0, 'bankCredit': 0, 'needToCollectCash': false, 'isCollectedCashFromOnsite': false })
    const [reset, setReset] = useState(0)
    const [date, setDate] = useState(moment().format("YYYY-MM-DD"))
    const [lastSubmittedOrder, setLastSubmittedOrder] = useState(null)
    const [bookNumber, setBookNumber] = useState(1)
    const [slipNumber, setSlipNumber] = useState(1)
    const [itemCatalog, setItemCatalog] = useState([])
    const [sources, setSources] = useState([])
    const [customerAccounts, setCustomerAccounts] = useState([])
    const [selectedAccountId, setSelectedAccountId] = useState("")

    const fetchNextSequence = useCallback(async (selectedDate) => {
        try {
            const response = await axios.get('/data/nextSequence', { params: { date: selectedDate } });
            setBookNumber(response.data.data.bookNumber);
            setSlipNumber(response.data.data.slipNumber);
        } catch (error) {
            setLocalNotice({ type: 'error', message: getErrorMessage(error, 'Unable to load the next book and serial number at the moment. Please try again.') });
        }
    }, [])

    const fetchItems = useCallback(async () => {
        try {
            const response = await axios.get('/data/items/catalog');
            setItemCatalog(response.data.data || []);
        } catch (error) {
            setLocalNotice({ type: 'error', message: getErrorMessage(error, 'Unable to load the item list right now. Please refresh and try again.') });
        }
    }, [])

    const fetchAccounts = useCallback(async () => {
        if (!isB2B) {
            return;
        }

        try {
            const response = await axios.get('/data/accounts');
            setCustomerAccounts(response.data.data);
        } catch (error) {
            setLocalNotice({ type: 'error', message: getErrorMessage(error, 'Unable to load customer accounts right now. Please try again.') });
        }
    }, [isB2B])

    const fetchSources = useCallback(async () => {
        try {
            const response = await axios.get('/data/sources');
            setSources(response.data.data || []);
        } catch (error) {
            setLocalNotice({ type: 'error', message: getErrorMessage(error, 'Unable to load sources right now. Please try again.') });
        }
    }, [])

    useEffect(() => {
        fetchNextSequence(date);
        fetchItems();
        fetchAccounts();
        fetchSources();
    }, [date, fetchNextSequence, fetchItems, fetchAccounts, fetchSources]);

    useEffect(() => {
        if (!item || !measurementUnit) {
            return;
        }

        const selectedItem = itemCatalog.find((entry) => entry.itemName === item);
        const matchedRate = selectedItem?.measurementUnits?.find((rateEntry) =>
            rateEntry.measurementUnitName === measurementUnit
        );

        if (matchedRate) {
            setFinanceDetails((prev) => ({ ...prev, rate: Number(matchedRate.rate) }));
        }
    }, [item, measurementUnit, itemCatalog]);

    const itemChangeHandler = (event) => {
        const selectedItemName = event.target.value
        setItem(selectedItemName)

        const selectedItem = itemCatalog.find((entry) => entry.itemName === selectedItemName)
        const defaultUnit = selectedItem?.measurementUnits?.find((unit) => unit.measurementUnitId === selectedItem.defaultMeasurementUnitId)
            || selectedItem?.measurementUnits?.[0]
            || null

        setMeasurementUnit(defaultUnit?.measurementUnitName || '')
        setFinanceDetails((prev) => ({
            ...prev,
            rate: Number(defaultUnit?.rate || 0)
        }))
    }

    const customerAccountChangeHandler = (event) => {
        const accountId = event.target.value
        setSelectedAccountId(accountId)
    }

    const financeDetailsChangeHandler = (value) => {
        setFinanceDetails(value)
    }

    const rateInputChangeHandler = (event) => {
        setFinanceDetails((previous) => ({
            ...previous,
            rate: Number(event.target.value || 0)
        }))
    }

    const itemOptions = itemCatalog
        .filter((catalogItem) => catalogItem.isActive)
        .map((catalogItem) => catalogItem.itemName)
        .sort((left, right) => left.localeCompare(right))
    const sourceOptions = sources
        .filter((source) => Number(source.is_active) === 1)
        .map((source) => source.source_name)
        .sort((left, right) => left.localeCompare(right))

    const selectedItemConfig = itemCatalog.find((catalogItem) => catalogItem.itemName === item)
    const measurementUnitOptions = selectedItemConfig?.measurementUnits || []
    const selectedMeasurementUnit = measurementUnitOptions.find((unit) => unit.measurementUnitName === measurementUnit) || null
    const selectedAccount = customerAccounts.find((account) => String(account.id) === String(selectedAccountId)) || null
    const dateChangeHandler = (event) => {
        setDate(event.target.value)
        fetchNextSequence(event.target.value)
    }

    const resetClickHandler = () => {
        setFinanceDetails({ 'quantity': 0, 'gross': 0, 'tare': 0, 'net': 0, 'rate': 0, 'amount': 0, 'discount': 0, 'freight': 0, 'taxPercent': 0, 'taxAmount': 0, 'totalAmount': 0, 'paymentStatus': '', 'dueAmount': 0, 'cashCredit': 0, 'bankCredit': 0, 'needToCollectCash': false, 'isCollectedCashFromOnsite': false })
        setReset(reset + 1)
        setLocalNotice(null)
        setDate(moment().format("YYYY-MM-DD"))
        fetchNextSequence(moment().format("YYYY-MM-DD"))
        if (!isB2B) {
            setSelectedAccountId("")
        }
    }

    const printInvoice = async (order) => {
        if (!order) {
            return
        }

        const printWindow = window.open('', '_blank', 'width=900,height=700')
        if (!printWindow) {
            setLocalNotice({ type: 'error', message: 'Printing could not be started because pop-ups are blocked. Please allow pop-ups for this site and try again.' })
            return
        }

        try {
            printWindow.document.write(buildInvoiceHtml(order, isB2B ? 'B2B order print view' : 'Order entry print view'));
            printWindow.document.close()
            printWindow.focus()
            printWindow.print()
            setLastSubmittedOrder((prev) => prev ? { ...prev, isPrinted: true } : prev)
        } catch (error) {
            printWindow.close()
            setLocalNotice({ type: 'error', message: getErrorMessage(error, 'The print status could not be updated. Please try again.') })
        }
    }

    const formSubmitHandler = (event) => {
        event.preventDefault()
        setLocalNotice(null)
        if (isB2B && !selectedAccount) {
            setLocalNotice({ type: 'error', message: 'Please select a customer account before submitting the B2B order.' })
            return
        }
        const input = {}
        input.bookNumber = bookNumber
        input.date = event.target.date.value
        input.name = isB2B ? (selectedAccount?.account_name || '') : event.target.name.value
        input.site = event.target.site.value
        input.customerGstin = isB2B ? (selectedAccount?.gstin || '') : ''
        input.lorryNumber = event.target.lorryNumber.value
        input.item = event.target.item.value
        input.measurementUnit = measurementUnit
        input.quantity = Number(finaceDetails.quantity || 0)
        input.gross = Number(finaceDetails.gross || 0)
        input.tare = Number(finaceDetails.tare || 0)
        input.net = Number(finaceDetails.net || finaceDetails.quantity || 0)
        input.rate = Number(finaceDetails.rate || 0)
        input.amount = Number(finaceDetails.amount || 0)
        input.discount = Number(finaceDetails.discount || 0)
        input.freight = Number(finaceDetails.freight || 0)
        input.taxPercent = Number(finaceDetails.taxPercent || 0)
        input.taxAmount = Number(finaceDetails.taxAmount || 0)
        input.totalAmount = Number(finaceDetails.totalAmount || 0)
        input.paymentStatus = finaceDetails.paymentStatus
        input.dueAmount = Number(finaceDetails.dueAmount || 0)
        input.cashCredit = Number(finaceDetails.cashCredit || 0)
        input.bankCredit = Number(finaceDetails.bankCredit || 0)
        input.needToCollectCash = Boolean(finaceDetails.needToCollectCash)
        input.isCollectedCashFromOnsite = Boolean(finaceDetails.isCollectedCashFromOnsite)
        input.source = event.target.source.value
        input.remarks = event.target.remarks.value
        input.slipNumber = slipNumber
        input.createdBy = currentUser?.fullName || currentUser?.email || 'System'
        input.createdByUserId = currentUser?.id || null
        input.orderType = isB2B ? 'B2B' : 'Standard'
        input.customerAccountId = selectedAccount?.id || null
        input.customerAccountName = selectedAccount?.account_name || null
        input.itemId = selectedItemConfig?.id || null
        input.measurementUnitId = selectedMeasurementUnit?.measurementUnitId || selectedItemConfig?.defaultMeasurementUnitId || null
        input.itemRateId = selectedMeasurementUnit?.itemRateId || null
        const printableOrder = buildPrintableOrder(input)

        console.log("Input", input)
        const insertData = async () => {
            await axios.post('/data/insert', {
                body: input
            }).then(res => {
                notify('success', res.data.message)
                setLocalNotice(null)
                setLastSubmittedOrder({ ...printableOrder, id: res.data.data.id, orderType: input.orderType, isPrinted: false })
                resetClickHandler()
                setMeasurementUnit("")
                setItem("")
                if (!isB2B) {
                    event.target.name.value = ''
                }
                event.target.site.value = ''
                event.target.lorryNumber.value = null
                event.target.source.value = null
                event.target.remarks.value = ''
                fetchNextSequence(date)
            }).catch(err => {
                setLocalNotice({ type: 'error', message: getErrorMessage(err, 'The order could not be saved. Please review the form and try again.') })
            });

        }

        if (!isB2B && Number(finaceDetails.totalAmount || 0) <= 0) {
            setLocalNotice({ type: 'error', message: 'Cash orders require a total amount greater than zero before submission.' })
        } else if (!isB2B && !finaceDetails.paymentStatus) {
            setLocalNotice({ type: 'error', message: 'Please select a payment status for the cash order before submitting.' })
        } else if (finaceDetails.paymentStatus === "Due" && parseInt(finaceDetails.bankCredit) + parseInt(finaceDetails.cashCredit) + parseInt(finaceDetails.dueAmount) !== parseInt(finaceDetails.totalAmount)) {
            setLocalNotice({ type: 'error', message: 'For due payments, cash credit, bank credit, and due amount must together match the total amount.' })
        } else if (input.slipNumber > 50) {
            setLocalNotice({ type: 'error', message: 'The serial number cannot be greater than 50 within the same book.' })
        } else {
            insertData();
        }
    }
    return (
        <section className='form-container'>
            <div className="page-heading order-entry-heading">
                <div>
                    <span className="page-eyebrow">{isB2B ? 'B2B Operations' : 'Operations'}</span>
                    <h2 className="mb-2">{isB2B ? 'B2B Order Entry' : 'Order Entry'}</h2>
                    <p className="page-subtitle mb-0">{isB2B ? 'Select the account, fill only the dispatch fields that matter, and save.' : 'Enter dispatch details, weights or quantity, and payment information.'}</p>
                </div>
                <div className="order-entry-generated">
                    <div className="generated-inline-item">
                        <span>Book</span>
                        <strong>{bookNumber}</strong>
                    </div>
                    <div className="generated-inline-item">
                        <span>Serial</span>
                        <strong>{slipNumber}</strong>
                    </div>
                    <div className="generated-inline-item">
                        <span>Printed</span>
                        <strong>No</strong>
                    </div>
                </div>
            </div>
            {localNotice ? <div className={`app-alert app-alert-${localNotice.type} app-alert-inline`}>
                <div>
                    <strong>{localNotice.type === 'error' ? 'Please Review' : 'Notice'}</strong>
                    <p className="mb-0">{localNotice.message}</p>
                </div>
                <button type="button" className="btn-close" aria-label="Close" onClick={() => setLocalNotice(null)}></button>
            </div> : null}
            <form onSubmit={formSubmitHandler}>
                <div className="section-card">
                    <div className="section-card-header">
                        <div>
                            <h5 className="mb-1">Dispatch Details</h5>
                            <p className="section-subtitle mb-0">Computer-generated values are shown as text. Only fill the dispatch and customer details below.</p>
                        </div>
                    </div>
                    {isB2B ? <div className="account-panel mb-4">
                        <div className="account-panel-header">
                            <div>
                                <span className="page-eyebrow">Customer Account</span>
                                <h6 className="mb-1">Link this order to an account</h6>
                                <p className="section-subtitle mb-0">Selecting an account links the customer name and GSTIN for faster B2B entry.</p>
                            </div>
                        </div>
                        <div className='row g-3 mt-1'>
                            <div className="col-lg-6">
                                <div className="app-field">
                                    <label className="form-label" htmlFor='customerAccount'>Customer Account:</label>
                                    <select id="customerAccount" className="form-select app-input" value={selectedAccountId} onChange={customerAccountChangeHandler} required>
                                        <option value=''></option>
                                        {customerAccounts.map((account) => <option key={account.id} value={account.id}>{account.account_name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="col-lg-6">
                                <div className="account-summary-card">
                                    <span>Account Status</span>
                                    <strong>{selectedAccountId ? 'Selected' : customerAccounts.length}</strong>
                                    <small>{selectedAccountId ? 'Name and GSTIN are now linked to this order.' : 'Choose an account before you submit the B2B order.'}</small>
                                </div>
                            </div>
                        </div>
                    </div> : null}
                    <div className='row g-3'>
                        <div className="col-lg-3 col-md-6">
                            <div className="app-field">
                                <label className="form-label" htmlFor='source'>Source:</label>
                                <select id="source" className="form-select app-input" name="source" required>
                                    <option value=''></option>
                                    {sourceOptions.map((sourceName) => <option key={sourceName} value={sourceName}>{sourceName}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="col-lg-3 col-md-6">
                            <div className="app-field">
                                <label className="form-label" htmlFor='date'>Date:</label>
                                <input type="date" id="date" name="date" required className="form-control app-input" max={moment().format("YYYY-MM-DD")} value={date} onChange={dateChangeHandler} />
                            </div>
                        </div>
                        <div className="col-lg-3 col-md-6">
                            <div className="app-field">
                                <label className="form-label" htmlFor='item'>Item:</label>
                                <select id="item" className="form-select app-input" name="item" required value={item} onChange={itemChangeHandler}>
                                    <option value=''></option>
                                    {itemOptions.map((itemName) => <option key={itemName} value={itemName}>{itemName}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                    <div className="generated-inline-row mt-3">
                        <div className="generated-inline-item">
                            <span>Measurement Unit</span>
                            <strong>{measurementUnit || '-'}</strong>
                        </div>
                        {isB2B ? <div className="generated-inline-input">
                            <label className="form-label" htmlFor="b2bRate">Rate</label>
                            <input
                                id="b2bRate"
                                type="number"
                                className="form-control app-input"
                                min="0"
                                step="0.01"
                                value={finaceDetails.rate || 0}
                                onChange={rateInputChangeHandler}
                            />
                        </div> : <div className="generated-inline-item">
                            <span>Rate</span>
                            <strong>{Number(finaceDetails.rate || 0).toFixed(2)}</strong>
                        </div>}
                        {isB2B ? <>
                        <div className="generated-inline-item">
                            <span>Name</span>
                            <strong>{selectedAccount?.account_name || '-'}</strong>
                        </div>
                        <div className="generated-inline-item">
                            <span>GSTIN</span>
                            <strong>{selectedAccount?.gstin || '-'}</strong>
                        </div>
                        </> : null}
                    </div>
                    <div className='row g-3 mt-1'>
                        {isB2B ? null : <>
                            <div className="col-lg-6 col-md-6">
                                <div className="app-field">
                                    <label className="form-label" htmlFor='name'>Name:</label>
                                    <input type="text" className="form-control app-input" id="name" required name="name" placeholder="Customer Name" />
                                </div>
                            </div>
                            <div className="col-lg-6 col-md-6">
                                <div className="app-field">
                                    <label className="form-label" htmlFor='site'>Site: </label>
                                    <input type="text" id="site" className="form-control app-input" required name="site" placeholder="Customer Site" />
                                </div>
                            </div>
                        </>}
                    </div>
                    <div className='row g-3 mt-1'>
                        <div className="col-lg-3 col-md-6">
                            <div className="app-field">
                                <label className="form-label" htmlFor='lorryNumber'>Lorry Number:</label>
                                <input type="text" className="form-control app-input" id="lorryNumber" required name="lorryNumber" placeholder="Lorry Number" />
                            </div>
                        </div>
                        {isB2B ? <div className="col-lg-3 col-md-6">
                            <div className="app-field">
                                <label className="form-label" htmlFor='site'>Delivery Point:</label>
                                <input type="text" id="site" className="form-control app-input" required name="site" placeholder="Delivery point / site" />
                            </div>
                        </div> : null}
                        <div className={isB2B ? "col-lg-6 col-md-6" : "col-lg-9 col-md-6"}>
                            <div className="app-field">
                                <label className="form-label" htmlFor='remarks'>Remarks:</label>
                                <input type="text" className="form-control app-input" id="remarks" name="remarks" placeholder="Optional remarks for challan" />
                            </div>
                        </div>
                    </div>
                </div>
                <FinanceDetails
                    isQuantityDisabled={false}
                    onChange={financeDetailsChangeHandler}
                    onNotify={(type, message) => setLocalNotice({ type, message })}
                    value={finaceDetails}
                    reset={reset}
                    hideRateField={true}
                    showTaxFields={isB2B}
                    requirePaymentStatus={!isB2B}
                    allowCashOnsite={true}
                    measurementSelection={measurementUnit}
                    measurementUnit={measurementUnit}
                />
                <div className='action-row mt-4'>
                    {lastSubmittedOrder ? <button type="button" className="btn btn-dark btn-lg" onClick={() => printInvoice(lastSubmittedOrder)}>Print Invoice</button> : null}
                    <button id="reset" type="reset" className="btn btn-outline-secondary btn-lg" onClick={resetClickHandler}>Reset</button>
                    <button id="submit" type="submit" className="btn btn-success btn-lg">Submit Order</button>
                </div>
            </form>
            {lastSubmittedOrder ? <div className="section-card invoice-preview-card mt-4">
                <div className="section-card-header">
                    <div>
                        <h5 className="mb-1">Printed Format</h5>
                        <p className="section-subtitle mb-0">This challan layout appears immediately after a successful submit.</p>
                    </div>
                    <div className="page-badge">{lastSubmittedOrder.receiptReference}</div>
                </div>
                <div className="invoice-sheet">
                    <div className="challan-preview-grid">
                        <div className="challan-preview-card">
                            <div className="challan-preview-topline">Railway Gate Pass / Challan</div>
                            <div className="challan-preview-header">
                                <div className="challan-brand-block">
                                    <div className="challan-brand-line">
                                        <div className="challan-logo-row">
                                            <img src="/parentLogo.png" alt="PK Enterprises" className="challan-logo" />
                                        </div>
                                        <p className="challan-brand-name">P. K. ENTERPRISES</p>
                                    </div>
                                    <p className="challan-brand-copy">Harinagar - 845106, Bihar</p>
                                    <p className="challan-brand-copy">GSTIN - 10AENPK8366A1ZQ</p>
                                </div>
                                <div className="challan-meta-block">
                                    <div className="challan-meta-row">
                                        <span>Book No.</span>
                                        <strong>{lastSubmittedOrder.bookNumber}</strong>
                                    </div>
                                    <div className="challan-meta-row">
                                        <span>Slip No.</span>
                                        <strong>{lastSubmittedOrder.slipNumber}</strong>
                                    </div>
                                    <div className="challan-meta-row">
                                        <span>Year</span>
                                        <strong>{lastSubmittedOrder.year || '-'}</strong>
                                    </div>
                                    <div className="challan-meta-row">
                                        <span>Date</span>
                                        <strong>{lastSubmittedOrder.date}</strong>
                                    </div>
                                </div>
                            </div>
                            <div className="challan-body-grid">
                                <div className="challan-row challan-row-full"><span>M/s</span><strong>{lastSubmittedOrder.name}</strong></div>
                                <div className="challan-row"><span>GSTN</span><strong>{lastSubmittedOrder.customerGstin || '-'}</strong></div>
                                <div className="challan-row"><span>Dly. Point</span><strong>{lastSubmittedOrder.site || '-'}</strong></div>
                                <div className="challan-row"><span>Material/Size</span><strong>{lastSubmittedOrder.item}</strong></div>
                                <div className="challan-row"><span>{lastSubmittedOrder.showQuantity ? 'Quantity' : 'Gross'}</span><strong>{lastSubmittedOrder.showQuantity ? lastSubmittedOrder.quantity : lastSubmittedOrder.gross}</strong></div>
                                <div className="challan-row"><span>{lastSubmittedOrder.showQuantity ? 'Measurement' : 'Tare'}</span><strong>{lastSubmittedOrder.showQuantity ? lastSubmittedOrder.measurementUnit : lastSubmittedOrder.tare}</strong></div>
                                {!lastSubmittedOrder.showQuantity ? <div className="challan-row"><span>Net</span><strong>{lastSubmittedOrder.net}</strong></div> : <div className="challan-row"><span>Source</span><strong>{lastSubmittedOrder.source || '-'}</strong></div>}
                                <div className="challan-row"><span>Rate</span><strong>{formatCurrency(lastSubmittedOrder.rate)}</strong></div>
                                <div className="challan-row"><span>MOD</span><strong>{lastSubmittedOrder.paymentStatus}</strong></div>
                                <div className="challan-row"><span>Amount</span><strong>{formatCurrency(lastSubmittedOrder.amount)}</strong></div>
                                <div className="challan-row"><span>FRT</span><strong>{formatCurrency(lastSubmittedOrder.freight)}</strong></div>
                                <div className="challan-row challan-row-full"><span>Vehicle No.</span><strong>{lastSubmittedOrder.lorryNumber || '-'}</strong></div>
                                <div className="challan-row challan-row-full"><span>Remarks</span><strong>{lastSubmittedOrder.remarks || '-'}</strong></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div> : null}
        </section>
    )
}

export default OrderEntry;
