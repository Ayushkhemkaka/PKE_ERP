import React from 'react'
import SearchResult from './SearchResult.js';
import { useState } from 'react';
import axios from 'axios';
import SearchColumn from './SearchColumn.js';

function SearchOptions() {
    const [tableData,setTableData] = useState([]);
    const findClickHandler = (event) =>{
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
        
        console.log(params)
        const fetchData = async() =>{
            await axios.get('http://localhost:8000/data/find' ,{
                "params" : params
            }).then(res =>{
                let response = res.data
                console.log(response)
                response.key = response.bookNumber
                setTableData(response);
                console.log('Completed')
                event.target.bookNumber.value = null
                event.target.date.value = null
                event.target.name.value = null
                event.target.lorryNumber.value = null
                event.target.paymentStatus.value = null
                event.target.item.value= null
            }).catch(err =>{
                alert(err ,Error)
            });
        }
        fetchData();

    }
    return (
        <div className='bg-light'>
            <br/>
            <div className='container bg-info rounded p-4'> 
    `           <form onSubmit={findClickHandler}>
                    <div className='row pt-2'>
                        <div className="form-group col-sm">
                            <label htmlFor='bookNumber'>Book Number: </label>
                            <input className="form-control" type="number" id="bookNumber" name="bookNumber" placeholder='Book Number of Order'/>
                        </div>
                        <div className="form-group col-sm">
                            <label htmlFor='dateStart'>Date Start:</label>
                            <input type="date" id="dateStart" name="dateStart" className="form-control"/>
                        </div>
                        <div className="form-group col-sm">
                            <label htmlFor='dateEnd'>Date End:</label>
                            <input type="date" id="dateEnd" name="dateEnd" className="form-control"/>
                        </div>
                        <div className="form-group col-sm">
                            <label htmlFor='name'>Name:</label>
                            <input type="text" className="form-control" id="name" name="name" placeholder="Customer Name"/> 
                        </div>
                    </div>
                    <div className='row pt-2'>
                        <div className="form-group col-sm">
                            <label htmlFor='lorryNumber'>Lorry Number:</label>
                            <input type="text" className="form-control" id="lorryNumber" name="lorryNumber" placeholder = "Lorry Number" />
                        </div>
                        <div className="form-group col-sm">
                            <label htmlFor='source'>Source:</label>
                            <select id="source" className="form-control" name="source">
                                <option value=''></option>
                                <option value="Plant">Plant</option>
                                <option value="Rake">Rake</option>                                
                            </select>
                        </div>
                        <div className="form-group col-sm">
                            <label htmlFor='paymentStatus'>Payment Status:</label>
                            <select id="paymentStatus" className="form-control" name="paymentStatus" defaultValue=''>
                                <option value=''></option>
                                <option value="Cash">Cash</option>
                                <option value="Credit">Credit</option>
                                <option value="Due">Due</option>
                            </select> 
                        </div>
                        <div className="form-group col-sm">
                            <label htmlFor='item'>Item:</label>
                            <select id="item" className="form-control" name="item" defaultValue=''>
                                <option value=''></option>
                                <option value="10mm">10 mm Chips</option>
                                <option value="20mm">20 mm Chips</option>
                                <option value="dust">Dust</option>
                                <option value="sand">Sand</option>
                                <option value="localsand">Local Sand</option>
                                <option value="metal">Metal</option>
                                <option value="gsb">GSB</option>
                            </select> 
                        </div>
                    </div>
                    <div className='row pt-2 mt-2'>
                    <label>Select Columns To Display:</label>
                        <SearchColumn />
                    </div>
                    <div className='mt-3 row'>
                        <div className='col-3'>
                            <button id="submit" type="button" className="btn btn-dark" style={{width:"150px", height:"45px"}}>Export to Excel</button>
                        </div>
                        <div className='col-9 d-flex flex-row-reverse'>
                            <div className='d-inline-flex'>
                                <button id="submit" type="submit" className="btn btn-success" style={{width:"120px", height:"45px"}}>Find</button>
                            </div>
                            <div className='d-inline-flex mx-4'>
                                <button id="reset" type="reset" className="btn btn-danger" style={{width:"120px", height:"45px"}}>Reset</button>
                            </div>
                        </div>
                        
                    </div>
                </form>
            </div>
            <br/>
            {tableData.length >0 ? <SearchResult tableData= {tableData}/> : <br/>}
        </div>
        )
    }
    
export default SearchOptions;