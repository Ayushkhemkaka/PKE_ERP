import React, { useEffect, useMemo, useRef, useState } from 'react'

const SearchColumn = (props) => {
    const [columns, setColumns] = useState(props.columnList)
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const availableColumns = useMemo(() => ([
        { name: "Book Number", id: "BookNumber", default: false },
        { name: "Slip Number", id: "SlipNumber", default: false },
        { name: "Source", id: "Source", default: false },
        { name: "Site", id: "Site", default: false },
        { name: "Measurement Unit", id: "MeasurementUnit", default: true },
        { name: "Gross", id: "gross", default: false },
        { name: "Tare", id: "tare", default: false },
        { name: "Net", id: "net", default: false },
        { name: "Rate", id: "Rate", default: false },
        { name: "Amount", id: "Amount", default: false },
        { name: "Discount", id: "Discount", default: false },
        { name: "Freight", id: "Freight", default: false },
        { name: "Remarks", id: "remarks", default: false },
        { name: "Customer GSTIN", id: "customergstin", default: false },
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

    useEffect(() => {
        setColumns(props.columnList);
    }, [props.columnList]);

    useEffect(() => {
        const handleOutsideClick = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleOutsideClick);
        return () => {
            document.removeEventListener('mousedown', handleOutsideClick);
        };
    }, []);

    const toggleColumn = (id, checked) => {
        const value = Boolean(checked);
        const nextColumns = value
            ? [...new Set([...columns, id])]
            : columns.filter((column) => column !== id);

        setColumns(nextColumns);
        props.SearchColumnChangeHandler(nextColumns);
    };

    const resetColumns = () => {
        const defaultColumns = availableColumns.filter((column) => column.default).map((column) => column.id);
        setColumns(defaultColumns);
        props.SearchColumnChangeHandler(defaultColumns);
    };

    const selectedCount = columns.length;
    const selectedNames = availableColumns
        .filter((column) => columns.includes(column.id))
        .map((column) => column.name);
    const triggerText = selectedNames.length
        ? selectedNames.slice(0, 3).join(', ')
        : 'Choose visible columns';
    const triggerMeta = selectedNames.length > 3
        ? `+${selectedNames.length - 3} more`
        : `${selectedCount} selected`;

    return (<div className='mt-2 mb-2 column-selector-panel' ref={dropdownRef}>
        <div className="column-selector-toolbar">
            <div>
                <span className="column-selector-label">Display setup</span>
                <strong>{selectedCount} extra columns selected</strong>
            </div>
            <button type="button" className="btn btn-sm btn-outline-dark" onClick={resetColumns}>Reset Defaults</button>
        </div>
        <div className="column-dropdown">
            <button
                type="button"
                className={`column-dropdown-trigger ${isOpen ? 'column-dropdown-trigger-open' : ''}`}
                onClick={() => setIsOpen((current) => !current)}
                aria-expanded={isOpen}
            >
                <span className="column-dropdown-trigger-copy">
                    <strong>{triggerText}</strong>
                    <small>{triggerMeta}</small>
                </span>
                <span className="column-dropdown-chevron" aria-hidden="true">{isOpen ? '−' : '+'}</span>
            </button>
            {isOpen ? (
                <div className="column-dropdown-menu">
                    <div className="column-dropdown-grid">
                        {availableColumns.map((column) => {
                            const checked = columns.includes(column.id);
                            return (
                                <label key={column.id} className={`column-dropdown-option ${checked ? 'column-dropdown-option-active' : ''}`}>
                                    <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={(event) => toggleColumn(column.id, event.target.checked)}
                                    />
                                    <span>{column.name}</span>
                                </label>
                            );
                        })}
                    </div>
                </div>
            ) : null}
        </div>
    </div>)
}

export default SearchColumn;
