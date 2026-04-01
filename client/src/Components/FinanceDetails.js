import React, { useEffect, useState } from 'react'
import Input from './Input.js';

const FinanceDetails = (props) => {
    const normalizeNumber = (value, fallback = 0) => {
        const parsedValue = Number(value)
        return Number.isFinite(parsedValue) ? parsedValue : fallback
    }
    const [rate ,setRate] = useState(props.value.rate)
    const [discount,setDiscount] = useState(props.value.discount)
    const [quantity,setQuantity] = useState(props.value.quantity)
    const [amount,setAmount] = useState(props.value.amount)
    const [freight,setFreight] = useState(props.value.freight)
    const [taxPercent,setTaxPercent] = useState(props.value.taxPercent)
    const [taxAmount,setTaxAmount] = useState(props.value.taxAmount)
    const [totalAmount,setTotalAmount] = useState(props.value.totalAmount)
    const [dueAmount,setDueAmount] = useState(props.value.dueAmount)
    const [paymentStatus,setPaymentStatus] = useState(props.value.paymentStatus)
    const [cashCredit,setCashCredit] = useState(props.value.cashCredit)
    const [bankCredit,setBankCredit] = useState(props.value.bankCredit)
    const notify = (message) => {
        if (props.onNotify) {
            props.onNotify('error', message);
        }
    }

    const resetValues = () =>{
        if(props.reset > 0){
            setRate(props.value.rate)
            setDiscount(props.value.discount)
            setQuantity(props.value.quantity)
            setAmount(props.value.amount)
            setFreight(props.value.freight)
            setTaxPercent(props.value.taxPercent)
            setTaxAmount(props.value.taxAmount)
            setTotalAmount(props.value.totalAmount)
            setDueAmount(props.value.dueAmount)
            setPaymentStatus(props.value.paymentStatus)
            setCashCredit(props.value.cashCredit)
            setBankCredit(props.value.bankCredit)
        }
    }
    useEffect(()=>{
        resetValues()
    })
    const setAmountValue = (rate,quantity,discountVal)=>{
        let change = {}
        let amountValue = 0
        let taxAmountValue = taxAmount
        const normalizedRate = normalizeNumber(rate)
        const normalizedQuantity = normalizeNumber(quantity)
        const normalizedDiscount = normalizeNumber(discountVal)
        if (discountVal >0){
            amountValue = (normalizedRate * normalizedQuantity) - normalizedDiscount
            amountValue = amountValue === 0 ? "0" : amountValue
        }else if(discountVal === 0 || isNaN(discountVal)){
            amountValue = (normalizedRate * normalizedQuantity)
        }
        if(amountValue < 0){
            discountVal = discount
            setDiscount(discount)
            notify('Amount cannot be less than 0.')
        }else{
            change['discount'] =discountVal
            change['amount'] = amountValue
            change['taxAmount'] = taxAmountValue
            change['quantity'] = normalizedQuantity
            change['rate']  = normalizedRate
            setAmount(amountValue)
            taxAmountValue =  (normalizeNumber(taxPercent) * amountValue *0.01)
            setTaxAmount(taxAmountValue)
            setTotalAmountValue(taxAmountValue ,freight,amountValue,change)
            setQuantity(normalizedQuantity)
            setRate(normalizedRate)
            setDiscount(normalizedDiscount)
        }

    }

    
    const setTotalAmountValue =(taxAmount,freight,amount,change) =>{
        let totalAmountValue = normalizeNumber(taxAmount) + normalizeNumber(amount) + normalizeNumber(freight)
        totalAmountValue = totalAmountValue === 0 ? "0" : totalAmountValue
        setTotalAmount(totalAmountValue)
        if(paymentStatus === "Bank" ){
            setBankCredit(totalAmountValue)
            props.onChange({...props.value,...change,'totalAmount':totalAmountValue,'bankCredit':totalAmountValue})
        }else if(paymentStatus === "Cash"){
            setCashCredit(totalAmountValue)
            props.onChange({...props.value,...change,'totalAmount':totalAmountValue,'cashCredit':totalAmountValue})
        }else{
            props.onChange({...props.value,...change,'totalAmount':totalAmountValue})
        }
    }

    const quantityChangeHandler=(value)=>{
        let quantityValue = normalizeNumber(value)
        setAmountValue(rate , quantityValue ,discount)
    }

    const rateChangeHandler=(value)=>{   
        setAmountValue(normalizeNumber(value) , quantity ,discount)
    }
    const discountChangeHandler=(value)=>{
        let discountValue = normalizeNumber(value)
        setAmountValue(rate , quantity ,discountValue)      
    }

    const amountChangeHandler=(value)=>{
        let amountValue = normalizeNumber(value)
        if(normalizeNumber(quantity) === 0){
            setAmount(amountValue)
            let change = {'amount':amountValue}
            setTotalAmountValue(taxAmount,freight,amountValue,change)
        }else{
            setAmount(amountValue)
            let rateValue = (amountValue + normalizeNumber(discount)) / normalizeNumber(quantity)
            setRate(rateValue)
            let change = {'amount':amountValue,'rate':rateValue}
            setTotalAmountValue(taxAmount,freight,amountValue,change)
        }
    }

    const freightChangeHandler =(value) =>{
        let freightValue = normalizeNumber(value)
        setFreight(freightValue)
        let change = {'freight' : freightValue}
        setTotalAmountValue(taxAmount ,freightValue,amount,change) 
    }

    const taxPercentChangeHandler = (value) =>{
        let taxPercentValue = normalizeNumber(value)
        if(taxPercentValue > 100 || taxPercentValue < 0){
            notify("Please specify a correct tax percent value.")
        }else{
            let taxAmountValue =  (taxPercentValue * amount *0.01)
            setTaxAmount(taxAmountValue)
            setTaxPercent(taxPercentValue)
            let change = {'taxAmount':taxAmountValue ,'taxPercent':taxPercentValue}
            setTotalAmountValue(taxAmountValue ,freight,amount,change)                 
        }
    }   

    const dueAmountChangeHandler = (value) =>{
        const dueAmountValue = value
        if(paymentStatus !== "Due" ){
            setDueAmount(0)
            notify("Select payment status as Due to proceed.")
            props.onChange({...props.value,'dueAmount':0}) 
        }else if(normalizeNumber(dueAmountValue) > normalizeNumber(totalAmount)){
            notify("Due amount cannot be greater than total amount.")
        }else{
            setDueAmount(dueAmountValue)
            if(normalizeNumber(dueAmountValue) === normalizeNumber(totalAmount)){
                setBankCredit(0)
                setCashCredit(0)
                props.onChange({...props.value,'bankCredit':0,'cashCredit':0,'dueAmount':dueAmountValue}) 
            }else{
                props.onChange({...props.value,'dueAmount':dueAmountValue}) 
            }
        }
    }

    const paymentStatusChangeHandler = (event) =>{
        const paymentStatusValue = event.target.value
        console.log("Payment Status",  event.target)
        console.log("Payment Status",  paymentStatusValue)
        setPaymentStatus(paymentStatusValue)      

        if(paymentStatusValue === "Bank"){            
            setBankCredit(totalAmount)
            setDueAmount(0)
            setCashCredit(0)
            props.onChange({...props.value,'bankCredit':totalAmount,'cashCredit':0,'dueAmount':0,'paymentStatus' : paymentStatusValue}) 
        }else if(paymentStatusValue === "Cash"){
            setCashCredit(totalAmount)
            setBankCredit(0)
            setDueAmount(0)
            props.onChange({...props.value,'bankCredit':0,'cashCredit':totalAmount,'dueAmount':0,'paymentStatus' : paymentStatusValue}) 
        }else if(paymentStatusValue === "CashBank" ){
            setCashCredit("")
            setBankCredit("")
            setDueAmount("")
            props.onChange({...props.value,'bankCredit':'','cashCredit':'','dueAmount':'','paymentStatus' : paymentStatusValue})
        }else if(paymentStatusValue === "Due"){
            setCashCredit(0)
            setBankCredit(0)
            setDueAmount(totalAmount)
            props.onChange({...props.value,'bankCredit':0,'cashCredit':0,'dueAmount':totalAmount,'paymentStatus' : paymentStatusValue})
        }
    }

    const cashCreditChangeHandler = (value) =>{
        const cashCreditValue = value
        if(normalizeNumber(cashCreditValue) > normalizeNumber(totalAmount)){
            notify("Cash amount cannot be greater than total amount.")
        }
        else if(normalizeNumber(cashCreditValue) === normalizeNumber(totalAmount)){
            setDueAmount("0")
            setBankCredit("0")
            setPaymentStatus("Cash")
            setCashCredit(cashCreditValue)
            props.onChange({...props.value,'bankCredit':0,'cashCredit':cashCreditValue,'dueAmount':0,'paymentStatus':"Cash"}) 
            notify("Cash equals total amount, so payment status was changed to Cash and due was reset to 0.")
        }else if(paymentStatus === "CashBank"){
            let bankCreditValue = normalizeNumber(totalAmount) - normalizeNumber(cashCreditValue)
            setBankCredit(bankCreditValue)
            setCashCredit(cashCreditValue)
            props.onChange({...props.value,'bankCredit':bankCreditValue,'cashCredit':cashCreditValue}) 
        }else if(paymentStatus === "Due"){
            let bankCreditValue = bankCredit
            if(isNaN(parseInt(bankCreditValue))){
                bankCreditValue = 0
            }
            if(normalizeNumber(cashCreditValue) + normalizeNumber(dueAmount) + normalizeNumber(bankCreditValue) > normalizeNumber(totalAmount)){
                notify("Cash credit cannot be more than total minus due minus bank.")
            }else{
                setCashCredit(cashCreditValue) 
                props.onChange({...props.value,'cashCredit':cashCreditValue}) 
            }
        }else if(paymentStatus === "Bank"){
            notify('Change the payment status to Cash or Cash & Bank to edit cash credit.')
        }else if(paymentStatus === ""){
            notify('Select payment status first.')
        }
    }
    
    const bankCreditChangeHandler = (value) =>{

        const bankCreditValue = value
        if(normalizeNumber(bankCreditValue) > normalizeNumber(totalAmount)){
            notify("Bank amount cannot be greater than total amount.")
        }
        else if(normalizeNumber(bankCreditValue) === normalizeNumber(totalAmount)){
            setDueAmount("0")
            setBankCredit(bankCreditValue)
            setPaymentStatus("Bank")
            setCashCredit("0")
            props.onChange({...props.value,'bankCredit':bankCreditValue,'cashCredit':0,'dueAmount':0,'paymentStatus':"Bank"}) 
            notify("Bank equals total amount, so payment status was changed to Bank and due was reset to 0.")
        }else if(paymentStatus === "CashBank"){
            let cashCreditValue = normalizeNumber(totalAmount) - normalizeNumber(bankCreditValue)
            setBankCredit(bankCreditValue)
            setCashCredit(cashCreditValue)
            props.onChange({...props.value,'bankCredit':bankCreditValue,'cashCredit':cashCreditValue}) 
        }else if(paymentStatus === "Due"){
            let cashCreditValue = cashCredit
            if(isNaN(parseInt(cashCreditValue))){
                cashCreditValue = 0
            }
            if(normalizeNumber(cashCreditValue) + normalizeNumber(dueAmount) + normalizeNumber(bankCreditValue)  > normalizeNumber(totalAmount)){
                notify("Bank credit cannot be more than total minus due minus cash.")
            }else{
                setBankCredit(bankCreditValue)
                props.onChange({...props.value,'bankCredit':bankCreditValue}) 
            }
        }else if(paymentStatus === "Cash"){
            notify('Change the payment status to Bank or Cash & Bank to edit bank credit.')
        }else if(paymentStatus === ""){
            notify('Select payment status first.')
        }
    }

    return(
        <div className="section-card mt-4">
            <div className="section-card-header">
                <div>
                    <h5 className="mb-1">Financial Details</h5>
                    <p className="section-subtitle mb-0">Rates, taxes, credits, and due calculations update as you work.</p>
                </div>
            </div>
            <div className='row g-3'>
                <Input name={"Quantity"} id={"quantity"} placeholder={"Quantity Ordered"} isDisabled={props.isQuantityDisabled} value={quantity} onChange={quantityChangeHandler} isRequired={false}/>
                <Input name={"Rate"} id={"rate"} placeholder={"Rate of Product"} isDisabled={false} value={rate} onChange={rateChangeHandler} isRequired={false}/>
                <Input name={"Amount"} id={"amount"} placeholder={"Amount of Order"} isDisabled={false} value={amount} onChange={amountChangeHandler} isRequired={false}/>
            </div>
            <div className='row g-3 mt-1'>
                <Input name={"Discount"} id={"discount"} placeholder={"Total Discount on Order"} isDisabled={false} value={discount} onChange={discountChangeHandler} isRequired={false}/>
                <Input name={"Freight"} id={"freight"} placeholder={"Freight Charges"} isDisabled={false} value={freight} onChange={freightChangeHandler} isRequired={false}/>
                <Input name={"Tax Percent"} id={"taxPercent"} placeholder={"Tax Percent for Order"} isDisabled={false} value={taxPercent} onChange={taxPercentChangeHandler} isRequired={false}/>
            </div>
            <div className='row g-3 mt-1'>
                <Input name={"Tax Amount"} id={"taxAmount"} placeholder={"Tax Amount for Order"} isDisabled={true} value={taxAmount} isRequired={false}/>
                <Input name={"Total Amount"} id={"totalAmount"} placeholder={"Total Amount of Order"} isDisabled={true} value={totalAmount} isRequired={false}/>
            </div>
            <div className='row g-3 mt-1'>
                <div className="col-lg-4 col-md-6">
                    <div className="app-field">
                        <label className="form-label" htmlFor='paymentStatus'>Payment Status:</label>
                        <select id="paymentStatus" className="form-select app-input" name="paymentStatus" required value={paymentStatus} onChange={paymentStatusChangeHandler}>
                            <option value=''></option>
                            <option value="Cash">Cash</option>
                            <option value="Bank">Bank</option>
                            <option value="CashBank">Cash & Bank</option>
                            <option value="Due">Due</option>
                        </select>
                    </div>
                </div>
                <Input name={"Due Amount"} id={"dueAmount"} placeholder={"Due Amount for Order"} isDisabled={false} value={dueAmount} onChange={dueAmountChangeHandler} isRequired={false}/>
                <Input name={"Cash Credit"} id={"cashCredit"} placeholder={"Cash Credit for Order"} isDisabled={false} value={cashCredit} onChange={cashCreditChangeHandler} isRequired={false}/>
                <Input name={"Bank Credit"} id={"bankCredit"} placeholder={"Bank Credit for Order"} isDisabled={false} value={bankCredit} onChange={bankCreditChangeHandler} isRequired={false}/>
            </div>
        </div>
    )
}

export default FinanceDetails;
