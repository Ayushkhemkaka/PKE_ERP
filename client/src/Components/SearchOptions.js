import React from 'react'
import { useState } from 'react';
import axios from 'axios';
import SearchColumn from './SearchColumn.js';
import csvDownload from 'json-to-csv-export'
import { useAppContext } from '../context/AppContext.js';
import * as XLSX from 'xlsx';

const SearchOptions = (props) => {
    const { notify, currentUser } = useAppContext();
    const [columnList, setColumnList] = useState(() => (
        props.mode === 'b2b'
            ? ["MeasurementUnit", "gross", "tare", "net", "remarks", "PaymentStatus", "DueAmount", "customerAccountName"]
            : ["MeasurementUnit", "gross", "tare", "net", "remarks", "PaymentStatus", "DueAmount"]
    ));
    const [isDisabledOtherItem, setIsDisabledOtherItem] = useState(true);
    const [item, setItem] = useState("")
    const [otherItem, setOtherItem] = useState("")
    const [searchParams, setSearchParams] = useState({})
    const [exportDisabled, setExportDisabled] = useState(true)
    const isB2B = props.mode === 'b2b';
    const modeLabel = isB2B ? 'B2B Orders' : 'General Orders';
    const modeSubtitle = isB2B
        ? 'Account-linked orders with the same running book/slip sequence as general entries.'
        : 'General orders sharing the same continuous book/slip sequence as B2B entries.';

    const itemChangeHandler = (event) => {
        let itemValue = event.target.value
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
    const SearchColumnChangeHandler = (updatedCloumnList) => {
        console.log(updatedCloumnList)
        console.log(columnList)
        setColumnList(updatedCloumnList)
    }

    const exportClickHandler = (event) => {
        event.preventDefault()
        let dataToConvert = {}
        const exportData = async () => {
            await axios.get('/data/find', {
                "params": { ...searchParams, mode: props.mode || 'normal' }
            }).then(res => {
                dataToConvert = {
                    data: res.data.data,
                    filename: 'export_data.csv',
                    delimiter: ',',
                    headers: ['Id', 'Date', 'Name', 'Lorry Number', 'Item', 'Quantity', ...columnList, "Id", 'Selected']
                }
                csvDownload(dataToConvert)
                setExportDisabled(true)
                notify('success', 'Export file prepared successfully.')
            }).catch(err => {
                notify('error', err.response?.data?.message || 'Unable to export orders.')
            });
        }
        exportData();
    }

    const findClickHandler = (event) => {
        event.preventDefault()
        const params = {}
        params.bookNumber = event.target.bookNumber.value
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
                createdBy: currentUser?.fullName || currentUser?.email || 'System'
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
            <div className="fetch-overview-grid">
                <div className="fetch-overview-card fetch-overview-card-primary">
                    <span>Current View</span>
                    <strong>{modeLabel}</strong>
                    <small>{modeSubtitle}</small>
                </div>
                <div className="fetch-overview-card">
                    <span>Numbering Rule</span>
                    <strong>Shared book and serial flow</strong>
                    <small>Book number and slip number continue across normal and B2B orders together.</small>
                </div>
                <div className="fetch-overview-card">
                    <span>Export Status</span>
                    <strong>{exportDisabled ? 'Run a search first' : 'Ready to export'}</strong>
                    <small>Exports always respect the currently selected order type and visible columns.</small>
                </div>
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
                                <label className="form-label" htmlFor='bookNumber'>Book Number: </label>
                                <input className="form-control app-input" type="number" id="bookNumber" name="bookNumber" placeholder='Book Number of Order' />
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
                                <input type="text" className="form-control app-input" id="customerAccountName" name="customerAccountName" placeholder="Account name" />
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
                        {!isDisabledOtherItem ? <div className="col-lg-3 col-md-6">
                            <div className="app-field">
                                <label className="form-label" htmlFor='otherItem'>Other Item:</label>
                                <input type="text" className="form-control app-input" id="otherItem" required name="otherItem" placeholder="Enter Other Item" value={otherItem} onChange={otherItemChangeHandler} />
                            </div>
                        </div> : null}
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
