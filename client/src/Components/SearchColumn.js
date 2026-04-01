import React, { useState } from 'react'
import Checkbox from './CheckBox.js';

const SearchColumn = (props) => {
    const [columns,setColumns] = useState(props.columnList)

    const checkboxChangeHandler = (id,value) =>{

        console.log(value)
        let col = columns
        if(value === false){
            col.push(id)
        }else{
            let index = col.indexOf(id)            
            col.splice(index,1)
        }
        console.log("****" + col) 
        setColumns(col)
        props.SearchColumnChangeHandler(col)
    }

    return (<div className='mt-2 mb-2' >
        <div className="column-chip-grid">
            <Checkbox name={"Book Number"} id={"BookNumber"} default={false} checkboxChangeHandler= {checkboxChangeHandler}/>
            <Checkbox name={"Slip Number"} id={"SlipNumber"} default={false} checkboxChangeHandler= {checkboxChangeHandler}/>
            <Checkbox name={"Source"} id={"Source"} default={false} checkboxChangeHandler= {checkboxChangeHandler}/>
            {/* <Checkbox name={"Date"} id={"Date"} default={true} checkboxChangeHandler= {checkboxChangeHandler}/>
            <Checkbox name={"Name"} id={"Name"} default={true} checkboxChangeHandler= {checkboxChangeHandler}/> */}
            <Checkbox name={"Site"} id={"Site"} default={false} checkboxChangeHandler= {checkboxChangeHandler}/>
            {/* <Checkbox name={"Lorry Number"} id={"LorryNumber"} default={true} checkboxChangeHandler= {checkboxChangeHandler}/>
            <Checkbox name={"Item"} id={"Item"} default={true} checkboxChangeHandler= {checkboxChangeHandler}/> */}
            <Checkbox name={"Measurement Unit"} id={"MeasurementUnit"} default={true} checkboxChangeHandler= {checkboxChangeHandler}/>
            {/* <Checkbox name={"Quantity"} id={"Quantity"} default={true} checkboxChangeHandler= {checkboxChangeHandler}/> */}
            <Checkbox name={"Rate"} id={"Rate"} default={false} checkboxChangeHandler= {checkboxChangeHandler}/>
            <Checkbox name={"Amount"} id={"Amount"} default={false} checkboxChangeHandler= {checkboxChangeHandler}/>
            <Checkbox name={"Discount"} id={"Discount"} default={false} checkboxChangeHandler= {checkboxChangeHandler}/>
            <Checkbox name={"Freight"} id={"Freight"} default={false} checkboxChangeHandler= {checkboxChangeHandler}/>
            <Checkbox name={"Tax Percent"} id={"TaxPercent"} default={false} checkboxChangeHandler= {checkboxChangeHandler}/>
            <Checkbox name={"Tax Amount"} id={"TaxAmount"} default={false} checkboxChangeHandler= {checkboxChangeHandler}/>
            <Checkbox name={"Total Amount"} id={"TotalAmount"} default={false} checkboxChangeHandler= {checkboxChangeHandler}/>
            <Checkbox name={"Payment Status"} id={"PaymentStatus"} default={true} checkboxChangeHandler= {checkboxChangeHandler}/>
            <Checkbox name={"Order Status"} id={"orderStatus"} default={false} checkboxChangeHandler= {checkboxChangeHandler}/>
            <Checkbox name={"Is Printed"} id={"is_printed"} default={false} checkboxChangeHandler= {checkboxChangeHandler}/>
            <Checkbox name={"Printed By"} id={"printed_by"} default={false} checkboxChangeHandler= {checkboxChangeHandler}/>
            <Checkbox name={"Due Amount"} id={"DueAmount"} default={true} checkboxChangeHandler= {checkboxChangeHandler}/>
            <Checkbox name={"Due On Create"} id={"due_on_create"} default={false} checkboxChangeHandler= {checkboxChangeHandler}/>
            <Checkbox name={"Due Paid"} id={"due_paid"} default={false} checkboxChangeHandler= {checkboxChangeHandler}/>
            <Checkbox name={"Cash Credit"} id={"CashCredit"} default={true} checkboxChangeHandler= {checkboxChangeHandler}/>
            <Checkbox name={"Bank Credit"} id={"BankCredit"} default={true} checkboxChangeHandler= {checkboxChangeHandler}/>
            <Checkbox name={"Customer Account"} id={"customerAccountName"} default={false} checkboxChangeHandler= {checkboxChangeHandler}/>
        </div>
    </div>)
}

export default SearchColumn;
