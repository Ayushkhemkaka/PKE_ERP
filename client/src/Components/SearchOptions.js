import React, { useEffect, useState } from 'react'
import axios from 'axios';
import SearchColumn from './SearchColumn.js';
import { useAppContext } from '../context/AppContext.js';
import * as XLSX from 'xlsx';

const SearchOptions = (props) => {
    const { notify, currentUser } = useAppContext();
    const [columnList, setColumnList] = useState(() => (
        props.mode === 'b2b'
            ? ["MeasurementUnit", "gross", "tare", "net", "remarks", "PaymentStatus", "DueAmount", "customerAccountName"]
            : ["MeasurementUnit", "gross", "tare", "net", "remarks", "PaymentStatus", "DueAmount"]
    ));
    const [item, setItem] = useState("")
    const [itemOptions, setItemOptions] = useState([])
    const [accountOptions, setAccountOptions] = useState([])
    const [searchParams, setSearchParams] = useState({})
    const [exportDisabled, setExportDisabled] = useState(true)
    const isB2B = props.mode === 'b2b';
    const columnLabelMap = {
        booknumber: 'Book Number',
        slipnumber: 'Slip Number',
        source: 'Source',
        site: 'Site',
        measurementunit: 'Measurement Unit',
        gross: 'Gross',
        tare: 'Tare',
        net: 'Net',
        rate: 'Rate',
        amount: 'Amount',
        discount: 'Discount',
        freight: 'Freight',
        remarks: 'Remarks',
        customergstin: 'Customer GSTIN',
        taxpercent: 'Tax Percent',
        taxamount: 'Tax Amount',
        totalamount: 'Total Amount',
        paymentstatus: 'Payment Status',
        orderstatus: 'Order Status',
        is_printed: 'Is Printed',
        printed_by: 'Printed By',
        dueamount: 'Due Amount',
        due_on_create: 'Due On Create',
        due_paid: 'Due Paid',
        cashcredit: 'Cash Credit',
        bankcredit: 'Bank Credit',
        customeraccountname: 'Customer Account'
    };

    const itemChangeHandler = (event) => {
        setItem(event.target.value)
    }

    useEffect(() => {
        const loadItems = async () => {
            try {
                const [itemsResponse, accountsResponse] = await Promise.all([
                    axios.get('/data/items/catalog'),
                    axios.get('/data/accounts')
                ]);
                const nextItems = (itemsResponse.data.data || [])
                    .filter((itemRow) => itemRow.isActive)
                    .map((itemRow) => itemRow.itemName)
                    .sort((left, right) => left.localeCompare(right));
                setItemOptions(nextItems);
                setAccountOptions((accountsResponse.data.data || []).map((account) => account.account_name).sort((left, right) => left.localeCompare(right)));
            } catch (error) {
                notify('error', error.response?.data?.message || 'Unable to load item list.');
            }
        };

        loadItems();
    }, [notify]);

    const SearchColumnChangeHandler = (updatedCloumnList) => {
        console.log(updatedCloumnList)
        console.log(columnList)
        setColumnList(updatedCloumnList)
    }

    const exportClickHandler = (event) => {
        event.preventDefault()
        const exportData = async () => {
            await axios.get('/data/find', {
                "params": { ...searchParams, mode: props.mode || 'normal' }
            }).then(res => {
                const rows = res.data.data.map((row) => {
                    const exportRow = {
                        'Id': row.id,
                        'Date': row.date?.split?.('T')?.[0] || row.date || '',
                        'Name': row.name || '',
                        'Lorry Number': row.lorrynumber || '',
                        'Item': row.item || '',
                        'Quantity': row.quantity ?? ''
                    };

                    columnList.forEach((column) => {
                        const key = column.toLowerCase();
                        exportRow[columnLabelMap[key] || column] = row[key] ?? '';
                    });

                    return exportRow;
                });

                const worksheet = XLSX.utils.json_to_sheet(rows);
                const workbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(workbook, worksheet, isB2B ? 'B2B Orders' : 'Orders');
                XLSX.writeFile(workbook, `${isB2B ? 'b2b_orders' : 'orders'}_export.xlsx`);
                setExportDisabled(true)
                notify('success', 'Excel file prepared successfully.')
            }).catch(err => {
                notify('error', err.response?.data?.message || 'Unable to export orders.')
            });
        }
        exportData();
    }

    const findClickHandler = (event) => {
        event.preventDefault()
        const params = {}
        params.id = event.target.invoiceId.value
        params.bookNumber = event.target.bookNumber.value
        params.slipNumber = event.target.slipNumber.value
        params.dateStart = event.target.dateStart.value
        params.dateEnd = event.target.dateEnd.value
        params.source = event.target.source.value
        params.name = event.target.name.value
        params.lorryNumber = event.target.lorryNumber.value
        params.paymentStatus = event.target.paymentStatus.value
        params.item = event.target.item.value
        params.customerAccountName = event.target.customerAccountName?.value || ''
        params.columns = columnList
        params.mode = props.mode || 'normal'
        setSearchParams(params)
        const fetchData = async () => {
            await axios.get('/data/find', {
                "params": params
            }).then(res => {
                let response = res.data.data
                props.onFind(response, columnList)
                setExportDisabled(false)
                notify('success', res.data.message)
            }).catch(err => {
                notify('error', err.response?.data?.message || 'Unable to search orders.')
            });
        }
        fetchData();
    }

    const importFileHandler = async (event) => {
        const file = event.target.files?.[0];
        if (!file) {
            return;
        }

        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

            const response = await axios.post('/data/import', {
                rows,
                createdBy: currentUser?.fullName || currentUser?.email || 'System',
                createdByUserId: currentUser?.id || null
            });

            notify('success', `${response.data.message} Imported ${response.data.data.count} rows.`);
        } catch (error) {
            notify('error', error.response?.data?.message || 'Unable to import the selected Excel file.');
        } finally {
            event.target.value = '';
        }
    }


    return (
        <section className='form-container'>
            <div className="page-heading">
                <div>
                    <span className="page-eyebrow">Insights</span>
                    <h2 className="mb-2">{isB2B ? 'Search B2B Orders' : 'Search Orders'}</h2>
                    <p className="page-subtitle mb-0">{isB2B ? 'Filter B2B orders by account, party, and payment details, then inspect and export the matching dataset.' : 'Filter by order details, inspect results quickly, and export the current dataset when needed.'}</p>
                </div>
                <div className="page-badge">{isB2B ? 'B2B search' : 'Search + export'}</div>
            </div>
            <form onSubmit={findClickHandler}>
                <div className="section-card fetch-filter-card">
                    <div className="section-card-header">
                        <div>
                            <h5 className="mb-1">Search Filters</h5>
                            <p className="section-subtitle mb-0">Use any combination of fields to narrow down matching orders.</p>
                        </div>
                    </div>
                    <div className="fetch-filter-grid">
                    <div className='row g-3'>
                        <div className="col-lg-3 col-md-6">
                            <div className="app-field">
                                <label className="form-label" htmlFor='invoiceId'>Invoice Id:</label>
                                <input className="form-control app-input" type="number" id="invoiceId" name="invoiceId" placeholder='System invoice id' />
                            </div>
                        </div>
                        <div className="col-lg-3 col-md-6">
                            <div className="app-field">
                                <label className="form-label" htmlFor='bookNumber'>Book Number: </label>
                                <input className="form-control app-input" type="number" id="bookNumber" name="bookNumber" placeholder='Book Number of Order' />
                            </div>
                        </div>
                        <div className="col-lg-3 col-md-6">
                            <div className="app-field">
                                <label className="form-label" htmlFor='slipNumber'>Serial Number:</label>
                                <input className="form-control app-input" type="number" id="slipNumber" name="slipNumber" placeholder='Slip / serial number' />
                            </div>
                        </div>
                        <div className="col-lg-3 col-md-6">
                            <div className="app-field">
                                <label className="form-label" htmlFor='dateStart'>Date Start:</label>
                                <input type="date" id="dateStart" name="dateStart" className="form-control app-input" />
                            </div>
                        </div>
                        <div className="col-lg-3 col-md-6">
                            <div className="app-field">
                                <label className="form-label" htmlFor='dateEnd'>Date End:</label>
                                <input type="date" id="dateEnd" name="dateEnd" className="form-control app-input" />
                            </div>
                        </div>
                        <div className="col-lg-3 col-md-6">
                            <div className="app-field">
                                <label className="form-label" htmlFor='name'>Name:</label>
                                <input type="text" className="form-control app-input" id="name" name="name" placeholder="Customer Name" />
                            </div>
                        </div>
                        {isB2B ? <div className="col-lg-3 col-md-6">
                            <div className="app-field">
                                <label className="form-label" htmlFor='customerAccountName'>Customer Account:</label>
                                <select id="customerAccountName" className="form-select app-input" name="customerAccountName" defaultValue="">
                                    <option value="">All B2B accounts</option>
                                    {accountOptions.map((accountName) => <option key={accountName} value={accountName}>{accountName}</option>)}
                                </select>
                            </div>
                        </div> : null}
                    </div>
                    <div className='row g-3 mt-1'>
                        <div className="col-lg-3 col-md-6">
                            <div className="app-field">
                                <label className="form-label" htmlFor='lorryNumber'>Lorry Number:</label>
                                <input type="text" className="form-control app-input" id="lorryNumber" name="lorryNumber" placeholder="Lorry Number" />
                            </div>
                        </div>
                        <div className="col-lg-3 col-md-6">
                            <div className="app-field">
                                <label className="form-label" htmlFor='source'>Source:</label>
                                <select id="source" className="form-select app-input" name="source">
                                    <option value=''></option>
                                    <option value="Plant">Plant</option>
                                    <option value="Rake">Rake</option>
                                </select>
                            </div>
                        </div>
                        <div className="col-lg-3 col-md-6">
                            <div className="app-field">
                                <label className="form-label" htmlFor='paymentStatus'>Payment Status:</label>
                                <select id="paymentStatus" className="form-select app-input" name="paymentStatus" defaultValue=''>
                                    <option value=''></option>
                                    <option value="Cash">Cash</option>
                                    <option value="Bank">Bank</option>
                                    <option value="CashBank">Cash & Bank</option>
                                    <option value="Due">Due</option>
                                </select>
                            </div>
                        </div>
                        <div className="col-lg-3 col-md-6">
                            <div className="app-field">
                                <label className="form-label" htmlFor='item'>Item:</label>
                                <select id="item" className="form-select app-input" name="item" value={item} onChange={itemChangeHandler}>
                                    <option value=''></option>
                                    {itemOptions.map((itemName) => <option key={itemName} value={itemName}>{itemName}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                    </div>
                </div>
                <div className="section-card mt-4">
                    <div className="section-card-header">
                        <div>
                            <h5 className="mb-1">Visible Columns</h5>
                            <p className="section-subtitle mb-0">Pick the extra fields you want to show in the result table and export.</p>
                        </div>
                    </div>
                    <div className='row pt-2 mt-2'>
                        <label className="form-label">Select Columns To Display:</label>
                        <SearchColumn SearchColumnChangeHandler={SearchColumnChangeHandler} columnList={columnList} />
                    </div>
                </div>
                <div className='action-row mt-4 fetch-action-bar'>
                    <label className="btn btn-outline-dark btn-lg mb-0">
                        Import from Excel
                        <input type="file" accept=".xlsx,.xls,.csv" className="d-none" onChange={importFileHandler} />
                    </label>
                    <button id="export" type="button" className="btn btn-outline-dark btn-lg" disabled={exportDisabled} onClick={exportClickHandler}>Export to Excel</button>
                    <button id="reset" type="reset" className="btn btn-outline-secondary btn-lg">Reset</button>
                    <button id="submit" type="submit" className="btn btn-success btn-lg">Find Orders</button>
                </div>
            </form>
        </section>
    )
}

export default SearchOptions;
