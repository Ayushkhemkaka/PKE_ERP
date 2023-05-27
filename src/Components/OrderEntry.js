import axios from 'axios'
import moment from 'moment'
import React, { useState } from 'react'

function OrderEntry() {

    let [isDisabledOtherItem,setIsDisabledOtherItem] = useState(true);
    let [isDisabledOtherMeasurnmentUnit,setIsDisabledOtherMeasurnmentUnit] = useState(true);
    const [rate ,setRate] = useState(0)
    const [discount,setDiscount] = useState(0)
    const [quantity,setQuantity] = useState(0)
    const [amount,setAmount] = useState(0)
    const [freight,setFreight] = useState(0)
    const [taxPercent,setTaxPercent] = useState(0)
    const [taxAmount,setTaxAmount] = useState(0)
    const [totalAmount,setTotalAmount] = useState(0)
    const [dueAmount,setDueAmount] = useState(0)
    const [paymentStatus,setPaymentStatus] = useState("")
    const [cashCredit,setCashCredit] = useState(0)
    const [bankCredit,setBankCredit] = useState(0)
    const [item,setItem] = useState("")
    const [measurementUnit,setmeasurementUnit] = useState("")

    const setAmountValue = (rate,quantity,discount)=>{
        let amountValue = ""
        if (discount >0){
            amountValue = (rate * quantity) - discount
        }else if(discount === 0 || isNaN(discount)){
            amountValue = (rate * quantity)
        }
        if(amountValue < 0){
            alert('Amount Cannot be less than 0')            
        }else{
            setAmount(amountValue)
            let taxAmountValue =  (taxPercent * amountValue *0.01)            
            setTaxAmount(taxAmountValue)
            setTotalAmountValue(taxAmountValue ,freight,amountValue)
            setQuantity(quantity)
            setRate(rate)
            setDiscount(discount)
        }
    }

    const setTotalAmountValue =(taxAmount,freight,amount) =>{
        let totalAmountValue = taxAmount + amount +freight
        setTotalAmount(totalAmountValue)
        if(paymentStatus === "Bank" ){
            setBankCredit(totalAmountValue)
        }if(paymentStatus === "Cash"){
            setCashCredit(totalAmountValue)
        }
    }

    const measurementUnitChangeHandler = (event) =>{
        let measurementUnitValue = event.target.value
        setmeasurementUnit(measurementUnitValue)
        if(measurementUnitValue === "Other"){
            setIsDisabledOtherMeasurnmentUnit(false)
        }else{
            setIsDisabledOtherMeasurnmentUnit(true)
        }
    }

    const itemChangeHandler = (event) =>{
        let itemValue = event.target.value
        setItem(itemValue)
        if(itemValue === "Other"){
            setIsDisabledOtherItem(false)
        }else{
            setIsDisabledOtherItem(true)
        }
    }
    const quantityChangeHandler=(event)=>{
        let quantityValue = parseFloat(event.target.value)
        // if(isNaN(quantityValue)){
        //     alert("Enter Correct Value in Quantity")
        // }else{
        //     setAmountValue(rate , quantityValue ,discount)
        //}
        setAmountValue(rate , quantityValue ,discount)
    }
    const rateChangeHandler=(event)=>{
        console.log(event.target)
        let rateValue = parseFloat(event.target.value)
        setAmountValue(rateValue , quantity ,discount)
    }
    const discountChangeHandler=(event)=>{
        let discountValue = parseFloat(event.target.value)
        setAmountValue(rate , quantity ,discountValue)      
    }

    const amountChangeHandler=(event)=>{
        let amountValue = parseFloat(event.target.value)
        if(quantity === 0){
            alert("Please specify Quantity First")
        }else{
            setAmount(amountValue)
            setTotalAmountValue(taxAmount,freight,amountValue)
            let rateValue = (amountValue + discount) / quantity
            setRate(rateValue)
        }
    }

    const freightChangeHandler =(event) =>{
        let freightValue = parseFloat(event.target.value)
        setFreight(freightValue)
        setTotalAmountValue(taxAmount ,freightValue,amount)   
    }

    const taxPercentChangeHandler = (event) =>{
        let taxPercentValue = parseFloat(event.target.value)
        if(taxPercentValue > 100 || taxPercentValue < 0){
            alert("Please specify correct taxpercent value")
        }else{
            let taxAmountValue =  (taxPercentValue * amount *0.01)
            setTaxAmount(taxAmountValue)
            setTaxPercent(taxPercentValue)
            setTotalAmountValue(taxAmountValue ,freight,amount)        
        }
    }   

    const dueAmountChangeHandler = (event) =>{
        const dueAmountValue = event.target.value
        console.log(dueAmountValue)
        if(paymentStatus !== "Due" ){
            setDueAmount("")
            alert("Select Payment Status as DUE to Proceed.")
        }else if(dueAmountValue > totalAmount){
            alert("Due Amount Cannot be greater than Total Amount.")
        }else{
            setDueAmount(dueAmountValue)
            if(dueAmountValue === totalAmount){
                setBankCredit("")
                setCashCredit("")
            }
        }
    }

    const paymentStatusChangeHandler = (event) =>{
        const paymentStatusValue = event.target.value
        setPaymentStatus(paymentStatusValue)
        if(paymentStatusValue === "Bank"){
            setBankCredit(totalAmount)
            setDueAmount("")
            setCashCredit("")
        }else if(paymentStatusValue === "Cash"){
            setCashCredit(totalAmount)
            setBankCredit("")
            setDueAmount("")
        }else if(paymentStatusValue === "CashBank" ||paymentStatusValue === "Due" ){
            setCashCredit("")
            setBankCredit("")
            setDueAmount("")
        }
    }

    const cashCreditChangeHandler = (event) =>{
        const cashCreditValue = event.target.value
        if(cashCreditValue > totalAmount){
            alert("Cash Amount Cannot be greater than Total Amount")
        }
        else if(parseFloat(cashCreditValue) === parseFloat(totalAmount)){
            setDueAmount("0")
            setBankCredit("0")
            setPaymentStatus("Cash")
            setCashCredit(cashCreditValue)
            alert("Since Cash Amount Equals Total Amount Changing Payment Status to Cash and making due as 0")
        }else if(paymentStatus === "CashBank"){
            let bankCreditValue = totalAmount - cashCreditValue
            setBankCredit(bankCreditValue)
            setCashCredit(cashCreditValue)
        }else if(paymentStatus === "Due"){
            let bankCreditValue = bankCredit
            if(isNaN(parseInt(bankCreditValue))){
                bankCreditValue = 0
            }            
            if(parseInt(cashCreditValue) + parseInt(dueAmount) + parseInt(bankCreditValue) > totalAmount){
                alert("Cash Credit cannot be max than (Total - Due - Bank)")
            }else{
                setCashCredit(cashCreditValue) 
            }
        }else if(paymentStatus === "Bank"){
            alert('Change the Payment Status to Cash or CashBank to make changes in Bank')
        }
    }
    
    const bankCreditChangeHandler = (event) =>{
        const bankCreditValue = event.target.value
        if(bankCreditValue > totalAmount){
            alert("Cash Amount Cannot be greater than Total Amount")
        }
        else if(parseFloat(bankCreditValue) === parseFloat(totalAmount)){
            setDueAmount("0")
            setBankCredit(bankCreditValue)
            setPaymentStatus("Bank")
            setCashCredit("0")
            alert("Since Bank Amount Equals Total Amount Changing Payment Status to Bank and making due as 0")
        }else if(paymentStatus === "CashBank"){
            let cashCreditValue = totalAmount - bankCreditValue
            setBankCredit(bankCreditValue)
            setCashCredit(cashCreditValue)
        }else if(paymentStatus === "Due"){
            let cashCreditValue = cashCredit
            if(isNaN(parseInt(cashCreditValue))){
                cashCreditValue = 0
            }
            console.log(cashCreditValue + " "+ dueAmount + " " + bankCreditValue + " "+ totalAmount +" "+ cashCreditValue + dueAmount + bankCreditValue > totalAmount)
            if(parseInt(cashCreditValue) + parseInt(dueAmount) + parseInt(bankCreditValue)  > totalAmount){
                alert("Bank Credit cannot be max than (Total - Due - Cash)")
            }else{
                setBankCredit(bankCreditValue)
            }
        }else if(paymentStatus === "Cash"){
            alert('Change the Payment Status to Bank or CashBank to make changes in Bank')
        }
    }

    const resetButtonHandler = (event) =>{
        setRate(0)
        setDiscount(0)
        setQuantity(0)
        setAmount(0)
        setFreight(0)
        setTaxPercent(0)
        setTaxAmount(0)
        setTotalAmount(0)
        setBankCredit(0)
        setCashCredit(0)
        setDueAmount(0)
        setPaymentStatus("")
    }
    const formSubmitHandler = (event) =>{
        event.preventDefault()
        const input = {}
        input.bookNumber = event.target.bookNumber.value
        input.date = event.target.date.value
        input.name = event.target.name.value
        input.site = event.target.site.value
        input.lorryNumber = event.target.lorryNumber.value
        input.item = event.target.item.value
        input.measurementUnit = event.target.measurementUnit.value
        input.quantity = parseFloat(event.target.quantity.value)
        input.rate = parseFloat(event.target.rate.value)
        input.amount = parseFloat(event.target.amount.value)
        input.discount = parseFloat(event.target.discount.value)
        input.freight = parseFloat(event.target.freight.value)
        input.taxPercent = parseFloat(event.target.taxPercent.value)
        input.taxAmount = parseFloat(event.target.taxAmount.value)
        input.totalAmount = parseFloat(event.target.totalAmount.value)
        input.paymentStatus = event.target.paymentStatus.value
        input.dueAmount = parseFloat(event.target.dueAmount.value)
        input.cashCredit = parseFloat(event.target.cashCredit.value)
        input.bankCredit = parseFloat(event.target.bankCredit.value)
        input.source = event.target.source.value
        input.slipNumber = parseInt(event.target.slipNumber.value)
        input.othermeasurementUnit = event.target.othermeasurementUnit.value
        input.otherItem = event.target.otherItem.value

        const insertData = async() =>{
            await axios.post('http://localhost:8000/data/insert' ,{
                "headers" : {
                    'Content-Type': 'application/json'
                },
                "body" : input
            }).then(res =>{
                console.log(res)
                alert(res.data)
            }).catch(err =>{
                alert(err ,Error)
            });
    
        }

        if(paymentStatus === "Due" && parseInt(bankCredit) + parseInt(cashCredit) + parseInt(dueAmount) !== parseInt(totalAmount)){
            alert("Some Error in the calculation as sum of Due, Cash Credit, Bank Credit not equal to Total Amount.")
        }else if(item === "Other" && input.otherItem === null){
            alert("Please First Enter the Other Item")
        }else if(measurementUnit === "Other" && input.othermeasurementUnit === null){
            alert("Please First Enter the Other Measurement Unit")
        }
        else{ 
            insertData();
            event.target.bookNumber.value = null
            event.target.date.value= null
            event.target.name.value= null
            event.target.site.value= null
            event.target.lorryNumber.value= null
            event.target.item.value= null
            event.target.measurementUnit.value= null
            event.target.quantity.value= null
            event.target.rate.value= null
            event.target.amount.value= null
            event.target.discount.value= null
            event.target.freight.value= null
            event.target.taxPercent.value= null
            event.target.taxAmount.value= null
            event.target.totalAmount.value= null
            event.target.paymentStatus.value= null
            event.target.dueAmount.value= null
            event.target.source.value= null
            event.target.slipNumber.value = null
            event.target.bankCredit.value = null
            event.target.cashCredit.value = null            
        }
    }
    return (
        <div className='bg-light'>
            <div className='container bg-info rounded p-4'> 
                <form onSubmit={formSubmitHandler} >
                    <div className='row pt-2'>
                        <div className="form-group col-sm">
                            <label htmlFor='bookNumber'>Book Number: </label>
                            <input className="form-control" type="text" id="bookNumber" required name="bookNumber" placeholder='Book Number of Order'/>
                        </div>
                        <div className="form-group col-sm">
                            <label htmlFor='slipNumber'>Slip Number: </label>
                            <input className="form-control" type="number" id="slipNumber" required name="slipNumber" placeholder='Book Number of Order'/>
                        </div>
                        <div className="form-group col-sm">
                            <label htmlFor='source'>Source:</label>
                            <select id="source" className="form-control" name="source" required>
                                <option value=''></option>
                                <option value="Plant">Plant</option>
                                <option value="Rake">Rake</option>                                
                            </select> 
                        </div>
                        <div className="form-group col-sm">
                            <label htmlFor='date'>Date:</label>
                            <input type="date" id="date" name="date" required className="form-control" max={moment().format("YYYY-MM-DD")} />
                        </div>
                    </div>
                    <div className='row pt-2'>
                        <div className="form-group col-sm">
                            <label htmlFor='name'>Name:</label>
                            <input type="text" className="form-control" id="name" required name="name" placeholder="Customer Name"/> 
                        </div>
                        <div className="form-group col-sm">
                            <label htmlFor='site'>Site: </label>
                            <input type="text" id="site" className="form-control" required name="site" placeholder = "Customer Site" />
                        </div>
                    </div>
                    <div className='row pt-2'>
                        <div className="form-group col-sm">
                            <label htmlFor='lorryNumber'>Lorry Number:</label>
                            <input type="text" className="form-control" id="lorryNumber" required name="lorryNumber" placeholder = "Lorry Number" />
                        </div>
                        <div className="form-group col-sm">
                            <label htmlFor='item'>Item:</label>
                            <select id="item" className="form-control" name="item" required value={item} onChange={itemChangeHandler}>
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
                        <div className="form-group col-sm">
                            <label htmlFor='otherItem'>Other Item:</label>
                            <input type="text" className="form-control" id="otherItem" required name="otherItem" placeholder = "Enter Other Item" disabled = {isDisabledOtherItem} />
                        </div>
                        <div className="form-group col-sm">
                            <label htmlFor='measurementUnit'>Measurement Unit:</label>
                            <select id="measurementUnit" className="form-control" name="measurementUnit" value ={measurementUnit} onChange={measurementUnitChangeHandler} required>
                                <option value=''></option>
                                <option value="Cft">Cft</option>
                                <option value="Tons">Tons</option>
                                <option value="Other">Others</option>
                            </select> 
                        </div>
                        <div className="form-group col-sm">
                            <label htmlFor='othermeasurementUnit'>Other Measurement Unit:</label> 
                            <input type="text" className="form-control" id="othermeasurementUnit" required name="othermeasurementUnit" placeholder = "Enter Other Item" disabled = {isDisabledOtherMeasurnmentUnit}/>
                        </div>
                    </div>
                    <div className='row pt-2'>
                        <div className="form-group col-sm">
                            <label htmlFor='quantity'>Quantity:</label>
                            <input type="number" className="form-control" id="quantity" name="quantity" required placeholder = "Quantity Orderd" step ="any" min="0" value={quantity || ''} onChange={quantityChangeHandler}/> 
                        </div>
                        <div className="form-group col-sm">
                            <label htmlFor='rate'>Rate:</label>
                            <input type="number" id="rate" name="rate" className="form-control" placeholder = "Rate of Product" min="0" step ="any" value={rate || ""} onChange={rateChangeHandler}/> 
                        </div>
                        <div className="form-group col-sm">
                            <label htmlFor='amount'>Amount:</label>
                            <input type="number" id="amount" className="form-control" name="amount" placeholder = "Amount of Order" step ="any" min="0" value={amount || ""} onChange={amountChangeHandler}/> 
                        </div>
                    </div>
                    <div className='row pt-2'>
                        <div className="form-group col-sm">
                            <label htmlFor='discount'>Discount:</label>
                            <input type="number" id="discount" className="form-control" name="discount" step ="any" placeholder = "Total Discount on Order" min="0" value={discount || ""} onChange={discountChangeHandler} /> 
                        </div>
                        <div className="form-group col-sm">
                            <label htmlFor='freight'>Freight:</label>
                            <input type="number" id="freight" className="form-control" step ="any" name="freight" placeholder = " Freight Charges" value={freight || ""} onChange={freightChangeHandler} /> 
                        </div>
                    <div className="form-group col-sm">
                            <label htmlFor='taxPercent'>Tax Percent:</label>
                            <input type="number" id="taxPercent" className="form-control" step ="any" name="taxPercent" placeholder = "Tax Percent for Order" value={taxPercent || ""} onChange={taxPercentChangeHandler}/> 
                        </div>
                    </div>
                    <div className='row pt-2'>
                        <div className="form-group col-sm">
                            <label htmlFor='taxAmount'>Tax Amount:</label>
                            <input type="number" id="taxAmount" className="form-control" step ="any" name="taxAmount" placeholder = "Tax Amount for Order" disabled min="0" value={taxAmount || ""}/> 
                        </div>
                        <div className="form-group col-sm">
                            <label htmlFor='totalAmount'>Total Amount:</label>
                            <input type="number" id="totalAmount" className="form-control" step ="any" name="totalAmount" placeholder = "Total Amount of Order" min="0" disabled value={totalAmount || ""} /> 
                        </div>
                    </div>
                    <div className='row pt-2'>
                        <div className="form-group col-sm">
                            <label htmlFor='paymentStatus'>Payment Status:</label>
                            <select id="paymentStatus" className="form-control" name="paymentStatus" required value={paymentStatus} onChange={paymentStatusChangeHandler}>
                                <option value=''></option>
                                <option value="Cash">Cash</option>
                                <option value="Bank">Bank</option>
                                <option value="CashBank">Cash & Bank</option>
                                <option value="Due">Due</option>
                            </select> 
                        </div>
                        <div className="form-group col-sm">
                            <label htmlFor='dueAmount'>Due Amount:</label>
                            <input type="number" id="dueAmount" className="form-control" step ="any" name="dueAmount" placeholder = "Due Amount of Order" min="0" value={dueAmount ||""} onChange={dueAmountChangeHandler}/> 
                        </div>
                        <div className="form-group col-sm">
                            <label htmlFor='cashCredit'>Cash Credit:</label>
                            <input type="number" id="cashCredit" className="form-control" step ="any" name="cashCredit" placeholder = "Amount paid for Order" min="0" value={cashCredit || ""} onChange={cashCreditChangeHandler}/> 
                        </div>
                        <div className="form-group col-sm">
                            <label htmlFor='bankCredit'>Bank Credit:</label>
                            <input type="number" id="bankCredit" className="form-control" step ="any" name="bankCredit" placeholder = "Amount paid for Order" min="0" value={bankCredit || ""} onChange={bankCreditChangeHandler}/> 
                        </div>

                    </div>
                    <div className='mt-3 d-flex flex-row-reverse'>
                        <div className='d-inline-flex'>
                        <button id="submit" type="submit" className="btn btn-success" style={{width:"120px", height:"45px"}}>Submit</button>
                        </div>
                        <div className=' d-inline-flex mx-4'>
                            <button id="reset" type="reset" className="btn btn-danger" style={{width:"120px", height:"45px"}} onClick={resetButtonHandler}>Reset</button>
                        </div>
                    </div>
                </form>
            </div>
            <br/>
        </div>
    )
}

export default OrderEntry;