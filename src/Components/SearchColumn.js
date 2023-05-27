import React from 'react'

function SearchColumn(props) {

    return (<div className='mt-2 mb-2' >
    <div className="form-check form-check-inline">
        <input className="form-check-input" type="checkbox" id="BookNumber" value="BookNumber" />
        <label className="form-check-label" htmlFor="BookNumber">Book Number</label>
    </div>
    <div className="form-check form-check-inline">
        <input className="form-check-input" type="checkbox" id="SlipNumber" value="SlipNumber" />
        <label className="form-check-label" htmlFor="SlipNumber">Slip Number</label>
    </div>
    <div className="form-check form-check-inline">
        <input className="form-check-input" type="checkbox" id="Source" value="Source" />
        <label className="form-check-label" htmlFor="Source">Source</label>
    </div>
    <div className="form-check form-check-inline">
        <input className="form-check-input" type="checkbox" id="Date" value="Date" />
        <label className="form-check-label" htmlFor="Date">Date</label>
    </div>
    <div className="form-check form-check-inline">
        <input className="form-check-input" type="checkbox" id="Name" value="Name" />
        <label className="form-check-label" htmlFor="Name">Name</label>
    </div>
    <div className="form-check form-check-inline">
        <input className="form-check-input" type="checkbox" id="Site" value="Site" />
        <label className="form-check-label" htmlFor="Site">Site</label>
    </div>
    <div className="form-check form-check-inline">
        <input className="form-check-input" type="checkbox" id="LooryNumber" value="LooryNumber" />
        <label className="form-check-label" htmlFor="LooryNumber">Lorry Number</label>
    </div>
    <div className="form-check form-check-inline">
        <input className="form-check-input" type="checkbox" id="Item" value="Item" />
        <label className="form-check-label" htmlFor="Item">Item</label>
    </div>
    <div className="form-check form-check-inline">
        <input className="form-check-input" type="checkbox" id="MeasurementUnit" value="MeasurementUnit" />
        <label className="form-check-label" htmlFor="MeasurementUnit">Measurement Unit</label>
    </div>
    <div className="form-check form-check-inline">
        <input className="form-check-input" type="checkbox" id="Quantity" value="Quantity" />
        <label className="form-check-label" htmlFor="Quantity">Quantity</label>
    </div>
    <div className="form-check form-check-inline">
        <input className="form-check-input" type="checkbox" id="Rate" value="Rate" />
        <label className="form-check-label" htmlFor="Rate">Rate</label>
    </div>
    <div className="form-check form-check-inline">
        <input className="form-check-input" type="checkbox" id="Amount" value="Amount" />
        <label className="form-check-label" htmlFor="Amount">Amount</label>
    </div>
    <div className="form-check form-check-inline">
        <input className="form-check-input" type="checkbox" id="Discount" value="Discount" />
        <label className="form-check-label" htmlFor="Discount">Discount</label>
    </div>
    <div className="form-check form-check-inline">
        <input className="form-check-input" type="checkbox" id="Freight" value="Freight" />
        <label className="form-check-label" htmlFor="Freight">Freight</label>
    </div>
    <div className="form-check form-check-inline">
        <input className="form-check-input" type="checkbox" id="TaxPercent" value="TaxPercent" />
        <label className="form-check-label" htmlFor="TaxPercent">Tax Percent</label>
    </div>
    <div className="form-check form-check-inline">
        <input className="form-check-input" type="checkbox" id="TaxAmount" value="TaxAmount" />
        <label className="form-check-label" htmlFor="TaxAmount">Tax Amount</label>
    </div>
    <div className="form-check form-check-inline">
        <input className="form-check-input" type="checkbox" id="TotalAmount" value="TotalAmount" />
        <label className="form-check-label" htmlFor="TotalAmount">Total Amount</label>
    </div>
    <div className="form-check form-check-inline">
        <input className="form-check-input" type="checkbox" id="PaymentStatus" value="PaymentStatus" />
        <label className="form-check-label" htmlFor="PaymentStatus">Payment Status</label>
    </div>
    <div className="form-check form-check-inline">
        <input className="form-check-input" type="checkbox" id="DueAmount" value="DueAmount" />
        <label className="form-check-label" htmlFor="DueAmount">Due Amount</label>
    </div>
    <div className="form-check form-check-inline">
        <input className="form-check-input" type="checkbox" id="CashCredit" value="CashCredit" />
        <label className="form-check-label" htmlFor="CashCredit">Cash Credit</label>
    </div>
    <div className="form-check form-check-inline">
        <input className="form-check-input" type="checkbox" id="BankCredit" value="BankCredit" />
        <label className="form-check-label" htmlFor="BankCredit">Bank Credit</label>
    </div>
    </div>)
}

export default SearchColumn;