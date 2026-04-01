import React, { useMemo, useState } from 'react'
import Checkbox from './CheckBox.js';

const SearchColumn = (props) => {
    const [columns,setColumns] = useState(props.columnList)

    const availableColumns = useMemo(() => ([
        { name: "Book Number", id: "BookNumber", default: false },
        { name: "Slip Number", id: "SlipNumber", default: false },
        { name: "Source", id: "Source", default: false },
        { name: "Site", id: "Site", default: false },
        { name: "Measurement Unit", id: "MeasurementUnit", default: true },
        { name: "Rate", id: "Rate", default: false },
        { name: "Amount", id: "Amount", default: false },
        { name: "Discount", id: "Discount", default: false },
        { name: "Freight", id: "Freight", default: false },
        { name: "Tax Percent", id: "TaxPercent", default: false },
        { name: "Tax Amount", id: "TaxAmount", default: false },
        { name: "Total Amount", id: "TotalAmount", default: false },
        { name: "Payment Status", id: "PaymentStatus", default: true },
        { name: "Order Status", id: "orderStatus", default: false },
        { name: "Is Printed", id: "is_printed", default: false },
        { name: "Printed By", id: "printed_by", default: false },
        { name: "Due Amount", id: "DueAmount", default: true },
        { name: "Due On Create", id: "due_on_create", default: false },
        { name: "Due Paid", id: "due_paid", default: false },
        { name: "Cash Credit", id: "CashCredit", default: true },
        { name: "Bank Credit", id: "BankCredit", default: true },
        { name: "Customer Account", id: "customerAccountName", default: false }
    ]), []);

    const checkboxChangeHandler = (id, value) =>{
        const nextColumns = value
            ? [...new Set([...columns, id])]
            : columns.filter((column) => column !== id);

        setColumns(nextColumns)
        props.SearchColumnChangeHandler(nextColumns)
    }

    const resetColumns = () => {
        const defaultColumns = availableColumns.filter((column) => column.default).map((column) => column.id);
        setColumns(defaultColumns);
        props.SearchColumnChangeHandler(defaultColumns);
    };

    const selectedCount = columns.length;

    return (<div className='mt-2 mb-2 column-selector-panel'>
        <div className="column-selector-toolbar">
            <div>
                <span className="column-selector-label">Display setup</span>
                <strong>{selectedCount} extra columns selected</strong>
            </div>
            <button type="button" className="btn btn-sm btn-outline-dark" onClick={resetColumns}>Reset Defaults</button>
        </div>
        <div className="column-chip-grid">
            {availableColumns.map((column) => (
                <Checkbox
                    key={column.id}
                    name={column.name}
                    id={column.id}
                    default={columns.includes(column.id)}
                    checkboxChangeHandler={checkboxChangeHandler}
                />
            ))}
        </div>
    </div>)
}

export default SearchColumn;
