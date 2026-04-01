import axios from 'axios'
import moment from 'moment'
import React, { useCallback, useEffect, useState } from 'react'
import FinanceDetails from './FinanceDetails.js';
import { useAppContext } from '../context/AppContext.js';

const OrderEntry = ({ mode = 'standard' }) => {
    const { currentUser, notify } = useAppContext();
    const isB2B = mode === 'b2b';

    let [isDisabledOtherItem, setIsDisabledOtherItem] = useState(true);
    let [isDisabledOtherMeasurnmentUnit, setIsDisabledOtherMeasurnmentUnit] = useState(true);
    const [item, setItem] = useState("")
    const [measurementUnit, setMeasurementUnit] = useState("")
    const [otherItem, setOtherItem] = useState("")
    const [otherMeasurementUnit, setOtherMeasurementUnit] = useState("")
    const [finaceDetails, setFinanceDetails] = useState({ 'quantity': 0, 'rate': 0, 'amount': 0, 'discount': 0, 'freight': 0, 'taxPercent': 0, 'taxAmount': 0, 'totalAmount': 0, 'paymentStatus': '', 'dueAmount': 0, 'cashCredit': 0, 'bankCredit': 0 })
    const [reset, setReset] = useState(0)
    const [date, setDate] = useState(moment().format("YYYY-MM-DD"))
    const [lastSubmittedOrder, setLastSubmittedOrder] = useState(null)
    const [bookNumber, setBookNumber] = useState(1)
    const [slipNumber, setSlipNumber] = useState(1)
    const [itemRates, setItemRates] = useState([])
    const [customerAccounts, setCustomerAccounts] = useState([])
    const [selectedAccountId, setSelectedAccountId] = useState("")

    const fetchNextSequence = useCallback(async (selectedDate) => {
        try {
            const response = await axios.get('http://localhost:8000/data/nextSequence', { params: { date: selectedDate } });
            setBookNumber(response.data.data.bookNumber);
            setSlipNumber(response.data.data.slipNumber);
        } catch (error) {
            notify('error', error.response?.data?.message || 'Unable to fetch the next book/slip number.');
        }
    }, [notify])

    const fetchRates = useCallback(async () => {
        try {
            const response = await axios.get('http://localhost:8000/data/rates');
            setItemRates(response.data.data);
        } catch (error) {
            notify('error', error.response?.data?.message || 'Unable to load item rates.');
        }
    }, [notify])

    const fetchAccounts = useCallback(async () => {
        if (!isB2B) {
            return;
        }

        try {
            const response = await axios.get('http://localhost:8000/data/accounts');
            setCustomerAccounts(response.data.data);
        } catch (error) {
            notify('error', error.response?.data?.message || 'Unable to load customer accounts.');
        }
    }, [isB2B, notify])

    useEffect(() => {
        fetchNextSequence(date);
        fetchRates();
        fetchAccounts();
    }, [date, fetchNextSequence, fetchRates, fetchAccounts]);

    useEffect(() => {
        if (!item || !measurementUnit || item === 'Other' || measurementUnit === 'Other') {
            return;
        }

        const matchedRate = itemRates.find((rateEntry) =>
            rateEntry.item_name === item && rateEntry.measurement_unit === measurementUnit
        );

        if (matchedRate) {
            setFinanceDetails((prev) => ({ ...prev, rate: Number(matchedRate.rate) }));
        }
    }, [item, measurementUnit, itemRates]);

    const measurementUnitChangeHandler = (event) => {
        let measurementUnitValue = event.target.value
        console.log("Measurement Unit Value", event.target)
        console.log("Measurement Unit Value", measurementUnitValue)
        setMeasurementUnit(measurementUnitValue)
        if (measurementUnitValue === "Other") {
            setIsDisabledOtherMeasurnmentUnit(false)
        } else {
            setIsDisabledOtherMeasurnmentUnit(true)
            setOtherMeasurementUnit("")
        }
    }

    const OtherMeasurementUnitChangeHandler = (event) => {
        let otherMeasurementUnitValue = event.target.value
        console.log("Other Measurement Unit Value", event.target.value)
        setOtherMeasurementUnit(otherMeasurementUnitValue)
    }

    const itemChangeHandler = (event) => {
        let itemValue = event.target.value
        console.log("Item Value", event.target)
        console.log("Item Value", itemValue)
        setItem(itemValue)
        if (itemValue === "Other") {
            setIsDisabledOtherItem(false)
        } else {
            setIsDisabledOtherItem(true)
            setOtherItem("")
        }
    }

    const otherItemChangeHandler = (event) => {
        let otherItemValue = event.target.value
        setOtherItem(otherItemValue)
    }

    const customerAccountChangeHandler = (event) => {
        const accountId = event.target.value
        setSelectedAccountId(accountId)

        const selectedAccount = customerAccounts.find((account) => String(account.id) === String(accountId))
        if (!selectedAccount) {
            return
        }

        const nameInput = document.getElementById('name')
        const siteInput = document.getElementById('site')
        if (nameInput) {
            nameInput.value = selectedAccount.account_name || ''
        }
        if (siteInput) {
            siteInput.value = selectedAccount.site || ''
        }
    }

    const financeDetailsChangeHandler = (value) => {
        setFinanceDetails(value)
    }

    const dateChangeHandler = (event) => {
        setDate(event.target.value)
        fetchNextSequence(event.target.value)
    }

    const resetClickHandler = () => {
        setFinanceDetails({ 'quantity': 0, 'rate': 0, 'amount': 0, 'discount': 0, 'freight': 0, 'taxPercent': 0, 'taxAmount': 0, 'totalAmount': 0, 'paymentStatus': '', 'dueAmount': 0, 'cashCredit': 0, 'bankCredit': 0 })
        setReset(reset + 1)
        setDate(moment().format("YYYY-MM-DD"))
        fetchNextSequence(moment().format("YYYY-MM-DD"))
        if (!isB2B) {
            setSelectedAccountId("")
        }
    }

    const formatCurrency = (value) => {
        const numericValue = Number(value || 0)
        return numericValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    }

    const buildPrintableOrder = (input) => ({
        invoiceNumber: `${input.bookNumber}/${input.slipNumber}`,
        name: input.name,
        source: input.source,
        item: input.item,
        quantityDisplay: input.quantity ? `${input.quantity} ${input.measurementUnit}` : (input.measurementUnit || 'Pending'),
        rate: input.rate,
        amount: input.amount,
        freight: input.freight,
        total: input.totalAmount,
        date: input.date,
        paymentStatus: input.paymentStatus,
        dueAmount: input.paymentStatus === "Due" ? input.dueAmount : 0,
        customerAccountName: input.customerAccountName || ''
    })

    const getPaymentSummary = (order) => {
        return order.paymentStatus === "Due"
            ? `Due - ${formatCurrency(order.dueAmount)}`
            : `${order.paymentStatus} - ${formatCurrency(order.dueAmount)}`
    }

    const printInvoice = (order) => {
        if (!order) {
            return
        }

        const printWindow = window.open('', '_blank', 'width=900,height=700')
        if (!printWindow) {
            notify('error', 'Please allow popups to print the invoice.')
            return
        }

        const paymentLine = getPaymentSummary(order)
        const customerAccountRow = order.customerAccountName
            ? `<div class="row"><div class="label">Customer Account</div><div class="value">${order.customerAccountName}</div></div>`
            : ''

        printWindow.document.write(`
            <html>
                <head>
                    <title>Invoice ${order.invoiceNumber}</title>
                    <style>
                        body { font-family: Arial, sans-serif; color: #1f2933; padding: 32px; }
                        .sheet { max-width: 760px; margin: 0 auto; border: 1px solid #d8dee4; border-radius: 18px; padding: 28px; }
                        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
                        .title { font-size: 28px; font-weight: 700; margin: 0; }
                        .subtitle { color: #52606d; margin-top: 6px; }
                        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px 24px; }
                        .row { padding: 12px 0; border-bottom: 1px solid #e5e7eb; }
                        .label { font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: #7b8794; margin-bottom: 4px; }
                        .value { font-size: 18px; font-weight: 600; }
                    </style>
                </head>
                <body>
                    <div class="sheet">
                        <div class="header">
                            <div>
                                <p class="title">P. K. ENTERPRISES</p>
                                <p class="subtitle">${isB2B ? 'B2B order print view' : 'Order entry print view'}</p>
                            </div>
                            <div>
                                <div class="label">Invoice No</div>
                                <div class="value">${order.invoiceNumber}</div>
                            </div>
                        </div>
                        <div class="grid">
                            ${customerAccountRow}
                            <div class="row"><div class="label">Name</div><div class="value">${order.name}</div></div>
                            <div class="row"><div class="label">Date</div><div class="value">${order.date}</div></div>
                            <div class="row"><div class="label">Source</div><div class="value">${order.source}</div></div>
                            <div class="row"><div class="label">Item</div><div class="value">${order.item}</div></div>
                            <div class="row"><div class="label">Quantity</div><div class="value">${order.quantityDisplay}</div></div>
                            <div class="row"><div class="label">Rate</div><div class="value">${formatCurrency(order.rate)}</div></div>
                            <div class="row"><div class="label">Amount</div><div class="value">${formatCurrency(order.amount)}</div></div>
                            <div class="row"><div class="label">Freight</div><div class="value">${formatCurrency(order.freight)}</div></div>
                            <div class="row"><div class="label">Total</div><div class="value">${formatCurrency(order.total)}</div></div>
                            <div class="row"><div class="label">Payment Status</div><div class="value">${paymentLine}</div></div>
                        </div>
                    </div>
                </body>
            </html>
        `)
        printWindow.document.close()
        printWindow.focus()
        printWindow.print()
    }

    const formSubmitHandler = (event) => {
        event.preventDefault()
        const selectedAccount = customerAccounts.find((account) => String(account.id) === String(selectedAccountId))
        if (isB2B && !selectedAccount) {
            notify('error', "Please select a customer account first.")
            return
        }
        const input = {}
        input.bookNumber = bookNumber
        input.date = event.target.date.value
        input.name = event.target.name.value
        input.site = event.target.site.value
        input.lorryNumber = event.target.lorryNumber.value
        event.target.item.value === "Other" ? input.item = event.target.otherItem.value : input.item = event.target.item.value
        event.target.measurementUnit.value === "Other" ? input.measurementUnit = event.target.othermeasurementUnit.value : input.measurementUnit = event.target.measurementUnit.value
        input.quantity = Number(finaceDetails.quantity || 0)
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
        input.source = event.target.source.value
        input.slipNumber = slipNumber
        input.createdBy = currentUser?.fullName || currentUser?.email || 'System'
        input.orderType = isB2B ? 'B2B' : 'Standard'
        input.customerAccountId = selectedAccount?.id || null
        input.customerAccountName = selectedAccount?.account_name || null
        const printableOrder = buildPrintableOrder(input)

        console.log("Input", input)
        const insertData = async () => {
            await axios.post('http://localhost:8000/data/insert', {
                body: input
            }).then(res => {
                notify('success', res.data.message)
                setLastSubmittedOrder(printableOrder)
                resetClickHandler()
                setOtherMeasurementUnit("")
                setIsDisabledOtherMeasurnmentUnit(true)
                setIsDisabledOtherItem(true)
                setOtherItem("")
                setMeasurementUnit("")
                setItem("")
                event.target.name.value = selectedAccount?.account_name || null
                event.target.site.value = selectedAccount?.site || null
                event.target.lorryNumber.value = null
                event.target.source.value = null
                fetchNextSequence(date)
            }).catch(err => {
                notify('error', err.response?.data?.message || 'Unable to save the order.')
            });

        }

        if (finaceDetails.paymentStatus === "Due" && parseInt(finaceDetails.bankCredit) + parseInt(finaceDetails.cashCredit) + parseInt(finaceDetails.dueAmount) !== parseInt(finaceDetails.totalAmount)) {
            notify('error', "Due, cash credit, and bank credit must add up to the total amount.")
        } else if (item === "Other" && !event.target.otherItem.value) {
            notify('error', "Please enter the other item first.")
        } else if (measurementUnit === "Other" && !event.target.othermeasurementUnit.value) {
            notify('error', "Please enter the other measurement unit first.")
        } else if (input.slipNumber > 50) {
            notify('error', "Slip number should be less than or equal to 50.")
        } else {
            insertData();
        }
    }
    return (
        <section className='form-container'>
            <div className="page-heading">
                <div>
                    <span className="page-eyebrow">{isB2B ? 'B2B Operations' : 'Operations'}</span>
                    <h2 className="mb-2">{isB2B ? 'B2B Order Entry' : 'Order Entry'}</h2>
                    <p className="page-subtitle mb-0">{isB2B ? 'Select a customer account first, then capture dispatch and commercial details for the B2B order.' : 'Capture dispatch details, product specifics, and payment breakdown in one workflow.'}</p>
                </div>
                <div className="page-badge">{isB2B ? 'Account-backed' : 'Live form'}</div>
            </div>
            <form onSubmit={formSubmitHandler}>
                <div className="section-card">
                    <div className="section-card-header">
                        <div>
                            <h5 className="mb-1">Dispatch Details</h5>
                            <p className="section-subtitle mb-0">Start with the slip, source, date, and customer details for this order.</p>
                        </div>
                    </div>
                    {isB2B ? <div className="account-panel mb-4">
                        <div className="account-panel-header">
                            <div>
                                <span className="page-eyebrow">Customer Account</span>
                                <h6 className="mb-1">Link this order to an account</h6>
                                <p className="section-subtitle mb-0">Selecting an account prefills the customer name and site for faster B2B entry.</p>
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
                                    <span>Available Accounts</span>
                                    <strong>{customerAccounts.length}</strong>
                                    <small>{selectedAccountId ? 'This B2B order will be saved against the selected account.' : 'Choose an existing account before you submit the order.'}</small>
                                </div>
                            </div>
                        </div>
                    </div> : null}
                    <div className='row g-3'>
                        <div className="col-lg-3 col-md-6">
                            <div className="app-field app-display-field">
                                <span className="form-label">Book Number</span>
                                <div className="app-display-value">{bookNumber}</div>
                            </div>
                        </div>
                        <div className="col-lg-3 col-md-6">
                            <div className="app-field app-display-field">
                                <span className="form-label">Serial Number</span>
                                <div className="app-display-value">{slipNumber}</div>
                            </div>
                        </div>
                        <div className="col-lg-3 col-md-6">
                            <div className="app-field">
                                <label className="form-label" htmlFor='source'>Source:</label>
                                <select id="source" className="form-select app-input" name="source" required>
                                    <option value=''></option>
                                    <option value="Plant">Plant</option>
                                    <option value="Rake">Rake</option>
                                </select>
                            </div>
                        </div>
                        <div className="col-lg-3 col-md-6">
                            <div className="app-field">
                                <label className="form-label" htmlFor='date'>Date:</label>
                                <input type="date" id="date" name="date" required className="form-control app-input" max={moment().format("YYYY-MM-DD")} value={date} onChange={dateChangeHandler} />
                            </div>
                        </div>
                    </div>
                    <div className='row g-3 mt-1'>
                        <div className="col-lg-6">
                            <div className="app-field">
                                <label className="form-label" htmlFor='name'>Name:</label>
                                <input type="text" className="form-control app-input" id="name" required name="name" placeholder="Customer Name" />
                            </div>
                        </div>
                        <div className="col-lg-6">
                            <div className="app-field">
                                <label className="form-label" htmlFor='site'>Site: </label>
                                <input type="text" id="site" className="form-control app-input" required name="site" placeholder="Customer Site" />
                            </div>
                        </div>
                    </div>
                    <div className='row g-3 mt-1'>
                        <div className="col-lg-4 col-md-6">
                            <div className="app-field">
                                <label className="form-label" htmlFor='lorryNumber'>Lorry Number:</label>
                                <input type="text" className="form-control app-input" id="lorryNumber" required name="lorryNumber" placeholder="Lorry Number" />
                            </div>
                        </div>
                        <div className="col-lg-4 col-md-6">
                            <div className="app-field">
                                <label className="form-label" htmlFor='item'>Item:</label>
                                <select id="item" className="form-select app-input" name="item" required value={item} onChange={itemChangeHandler}>
                                    <option value=''></option>
                                    <option value="10mm">10 mm Chips</option>
                                    <option value="20mm">20 mm Chips</option>
                                    <option value="Dust">Dust</option>
                                    <option value="Sand">Sand</option>
                                    <option value="Local Sand">Local Sand</option>
                                    <option value="Metal">Metal</option>
                                    <option value="GSB">GSB</option>
                                    <option value="Other">Others</option>
                                </select>
                            </div>
                        </div>
                        <div className="col-lg-4 col-md-6">
                            <div className="app-field">
                                <label className="form-label" htmlFor='otherItem'>Other Item:</label>
                                <input type="text" className="form-control app-input" id="otherItem" required name="otherItem" placeholder="Enter Other Item" disabled={isDisabledOtherItem} value={otherItem} onChange={otherItemChangeHandler} />
                            </div>
                        </div>
                        <div className="col-lg-4 col-md-6">
                            <div className="app-field">
                                <label className="form-label" htmlFor='measurementUnit'>Measurement Unit:</label>
                                <select id="measurementUnit" className="form-select app-input" name="measurementUnit" value={measurementUnit} onChange={measurementUnitChangeHandler} required>
                                    <option value=''></option>
                                    <option value="Cft">Cft</option>
                                    <option value="Tons">Tons</option>
                                    <option value="Other">Others</option>
                                </select>
                            </div>
                        </div>
                        <div className="col-lg-4 col-md-6">
                            <div className="app-field">
                                <label className="form-label" htmlFor='othermeasurementUnit'>Other Measurement Unit:</label>
                                <input type="text" className="form-control app-input" id="othermeasurementUnit" required name="othermeasurementUnit" placeholder="Enter Other Item" disabled={isDisabledOtherMeasurnmentUnit} value={otherMeasurementUnit} onChange={OtherMeasurementUnitChangeHandler} />
                            </div>
                        </div>
                    </div>
                </div>
                <FinanceDetails isQuantityDisabled={false} onChange={financeDetailsChangeHandler} onNotify={notify} value={finaceDetails} reset={reset} />
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
                        <p className="section-subtitle mb-0">This invoice-style layout appears immediately after a successful submit.</p>
                    </div>
                    <div className="page-badge">{lastSubmittedOrder.invoiceNumber}</div>
                </div>
                <div className="invoice-sheet">
                    <div className="invoice-sheet-header">
                        <div>
                            <p className="invoice-sheet-title">P. K. ENTERPRISES</p>
                            <p className="invoice-sheet-subtitle">{isB2B ? 'B2B Order Invoice' : 'Order Entry Invoice'}</p>
                        </div>
                        <div className="invoice-meta">
                            <span>Invoice No</span>
                            <strong>{lastSubmittedOrder.invoiceNumber}</strong>
                        </div>
                    </div>
                    <div className="invoice-preview-grid">
                        {lastSubmittedOrder.customerAccountName ? <div><span>Customer Account</span><strong>{lastSubmittedOrder.customerAccountName}</strong></div> : null}
                        <div><span>Name</span><strong>{lastSubmittedOrder.name}</strong></div>
                        <div><span>Date</span><strong>{lastSubmittedOrder.date}</strong></div>
                        <div><span>Source</span><strong>{lastSubmittedOrder.source}</strong></div>
                        <div><span>Item</span><strong>{lastSubmittedOrder.item}</strong></div>
                        <div><span>Quantity</span><strong>{lastSubmittedOrder.quantityDisplay}</strong></div>
                        <div><span>Rate</span><strong>{formatCurrency(lastSubmittedOrder.rate)}</strong></div>
                        <div><span>Amount</span><strong>{formatCurrency(lastSubmittedOrder.amount)}</strong></div>
                        <div><span>Freight</span><strong>{formatCurrency(lastSubmittedOrder.freight)}</strong></div>
                        <div><span>Total</span><strong>{formatCurrency(lastSubmittedOrder.total)}</strong></div>
                        <div><span>Payment Status</span><strong>{getPaymentSummary(lastSubmittedOrder)}</strong></div>
                    </div>
                </div>
            </div> : null}
        </section>
    )
}

export default OrderEntry;
