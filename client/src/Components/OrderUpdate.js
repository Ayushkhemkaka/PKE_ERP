import React, {useState} from 'react'
import FinanceDetails from './FinanceDetails.js';
import axios from 'axios';
import { useAppContext } from '../context/AppContext.js';

const OrderUpdate = (props)=> {
    const { currentUser, notify } = useAppContext();
    const [isSaving, setIsSaving] = useState(false);
    const [localNotice, setLocalNotice] = useState(null);
    const isB2B = props.mode === 'b2b';
    
    const [finaceDetails , setFinanceDetails] = useState({'quantity' : props.initialData.quantity,'gross': props.initialData.gross,'tare': props.initialData.tare,'net': props.initialData.net,'rate' : props.initialData.rate ,'amount' :props.initialData.amount,'discount':props.initialData.discount,'freight':props.initialData.freight,'taxPercent':props.initialData.taxPercent,'taxAmount':props.initialData.taxAmount , 'totalAmount' :props.initialData.totalAmount, 'paymentStatus' :props.initialData.paymentStatus, 'dueAmount':props.initialData.dueAmount, 'cashCredit':props.initialData.cashCredit,'bankCredit' :props.initialData.bankCredit, 'needToCollectCash': props.initialData.needToCollectCash, 'isCollectedCashFromOnsite': props.initialData.isCollectedCashFromOnsite})

    const financeDetailsChangeHandler = (value) =>{
        setFinanceDetails(value)
    }

    const cancelClickHandler = () =>{
        props.updateSuccessful(null)
    }

    const cancelOrderHandler = async () => {
        if (props.initialData.orderStatus === 'Cancelled') {
            setLocalNotice({ type: 'error', message: 'This order has already been cancelled and cannot be cancelled again.' });
            return;
        }

        setIsSaving(true);
        setLocalNotice(null);
        try {
            const response = await axios.post('/data/update', {
                body: {
                    id: props.data.id,
                    mode: props.mode || props.data.ordermode || 'normal',
                    quantity: parseFloat(finaceDetails.quantity || 0),
                    gross: parseFloat(finaceDetails.gross || 0),
                    tare: parseFloat(finaceDetails.tare || 0),
                    net: parseFloat(finaceDetails.net || 0),
                    rate: parseFloat(finaceDetails.rate || 0),
                    amount: parseFloat(finaceDetails.amount || 0),
                    discount: parseFloat(finaceDetails.discount || 0),
                    freight: parseFloat(finaceDetails.freight || 0),
                    taxpercent: parseFloat(finaceDetails.taxPercent || 0),
                    taxamount: parseFloat(finaceDetails.taxAmount || 0),
                    totalamount: parseFloat(finaceDetails.totalAmount || 0),
                    paymentstatus: finaceDetails.paymentStatus,
                    dueamount: parseFloat(finaceDetails.dueAmount || 0),
                    cashcredit: parseFloat(finaceDetails.cashCredit || 0),
                    bankcredit: parseFloat(finaceDetails.bankCredit || 0),
                    updatedBy: currentUser?.fullName || currentUser?.email || 'System',
                    updatedByUserId: currentUser?.id || null,
                    action: 'cancel'
                }
            });
            notify('success', response.data.message);
            props.updateSuccessful({ cancelled: true });
        } catch (err) {
            setLocalNotice({ type: 'error', message: err.response?.data?.message || 'The order could not be cancelled at this time. Please try again.' });
        } finally {
            setIsSaving(false);
        }
    }

    const updateClickHandler = (event) =>{
        event.preventDefault()
        setLocalNotice(null)
        const input = {}
        input.id = props.data.id
        input.mode = props.mode || props.data.ordermode || 'normal'
        input.quantity = parseFloat(finaceDetails.quantity || 0)
        input.gross = parseFloat(finaceDetails.gross || 0)
        input.tare = parseFloat(finaceDetails.tare || 0)
        input.net = parseFloat(finaceDetails.net || 0)
        input.rate = parseFloat(finaceDetails.rate)
        input.amount = parseFloat(finaceDetails.amount)
        input.discount = parseFloat(finaceDetails.discount)
        input.freight = parseFloat(finaceDetails.freight)
        input.taxpercent = parseFloat(finaceDetails.taxPercent)
        input.taxamount = parseFloat(finaceDetails.taxAmount)
        input.totalamount = parseFloat(finaceDetails.totalAmount)
        input.paymentstatus = finaceDetails.paymentStatus
        input.dueamount = parseFloat(finaceDetails.dueAmount)
        input.cashcredit = parseFloat(finaceDetails.cashCredit)
        input.bankcredit = parseFloat(finaceDetails.bankCredit)
        input.needtocollectcash = Boolean(finaceDetails.needToCollectCash)
        input.iscollectedcashfromonsite = Boolean(finaceDetails.isCollectedCashFromOnsite)
        input.updatedBy = currentUser?.fullName || currentUser?.email || 'System'
        input.updatedByUserId = currentUser?.id || null
                
        const updateData = async() =>{
            setIsSaving(true);
            await axios.post('/data/update' ,{
                body : input
            }).then(res =>{
                notify('success', res.data.message)
                setLocalNotice(null)
                props.updateSuccessful(finaceDetails)
            }).catch(err =>{
                setLocalNotice({ type: 'error', message: err.response?.data?.message || 'The order update could not be saved. Please review the values and try again.' })
            }).finally(() => {
                setIsSaving(false);
            });
    
        }

        if(finaceDetails.paymentStatus === "Due" && parseInt(finaceDetails.bankCredit) + parseInt(finaceDetails.cashCredit) + parseInt(finaceDetails.dueAmount) !== parseInt(finaceDetails.totalAmount)){
            setLocalNotice({ type: 'error', message: 'For due payments, cash credit, bank credit, and due amount must together match the total amount.' })
        }
        else{ 
            updateData();
        }
    }

    return (
        <div className='section-card mt-4'>
            <div className='section-card-header'>
                <div>
                    <h5 className="mb-1">Update Selected Order</h5>
                    <p className="section-subtitle mb-0">Adjust financial values for the selected row and save the revised totals.</p>
                </div>
            </div>
            {localNotice ? <div className={`app-alert app-alert-${localNotice.type} app-alert-inline`}>
                <div>
                    <strong>{localNotice.type === 'error' ? 'Please Review' : 'Notice'}</strong>
                    <p className="mb-0">{localNotice.message}</p>
                </div>
                <button type="button" className="btn-close" aria-label="Close" onClick={() => setLocalNotice(null)}></button>
            </div> : null}
            <div className='update-panel'>
                <form>
                    <div className="row g-3 mb-3">
                        <div className="col-lg-4 col-md-6">
                            <div className="app-field app-display-field">
                                <span className="form-label">Name</span>
                                <div className="app-display-value">{props.initialData.name || '-'}</div>
                            </div>
                        </div>
                        <div className="col-lg-4 col-md-6">
                            <div className="app-field app-display-field">
                                <span className="form-label">Site</span>
                                <div className="app-display-value">{props.initialData.site || '-'}</div>
                            </div>
                        </div>
                        <div className="col-lg-4 col-md-6">
                            <div className="app-field app-display-field">
                                <span className="form-label">Source</span>
                                <div className="app-display-value">{props.initialData.source || '-'}</div>
                            </div>
                        </div>
                    </div>
                    <div className="row g-3 mb-2">
                        <div className="col-lg-4 col-md-6">
                            <div className="app-field app-display-field">
                                <span className="form-label">Order Status</span>
                                <div className="app-display-value">{props.initialData.orderStatus || 'Active'}</div>
                            </div>
                        </div>
                        {props.initialData.item ? <div className="col-lg-4 col-md-6">
                            <div className="app-field app-display-field">
                                <span className="form-label">Item</span>
                                <div className="app-display-value">{props.initialData.item}</div>
                            </div>
                        </div> : null}
                        {props.initialData.measurementUnit ? <div className="col-lg-4 col-md-6">
                            <div className="app-field app-display-field">
                                <span className="form-label">Measurement Unit</span>
                                <div className="app-display-value">{props.initialData.measurementUnit}</div>
                            </div>
                        </div> : null}
                    </div>
                    <FinanceDetails
                        isQuantityDisabled={false}
                        onChange={financeDetailsChangeHandler}
                        onNotify={(type, message) => setLocalNotice({ type, message })}
                        value={finaceDetails}
                        reset={0}
                        hideRateField={false}
                        showRateAsText={!isB2B}
                        showTaxFields={isB2B}
                        requirePaymentStatus={isB2B}
                        allowCashOnsite={true}
                    />
                    <div className='action-row mt-4'>
                        <button id="reset" type="reset" className="btn btn-outline-secondary btn-lg" onClick={cancelClickHandler} disabled={isSaving}>Close</button>
                        <button type="button" className="btn btn-outline-dark btn-lg" onClick={cancelOrderHandler} disabled={isSaving || props.initialData.orderStatus === 'Cancelled'}>{props.initialData.orderStatus === 'Cancelled' ? 'Order Cancelled' : 'Cancel Order'}</button>
                        <button id="submit" type="submit" className="btn btn-success btn-lg" onClick={updateClickHandler} disabled={isSaving || props.initialData.orderStatus === 'Cancelled'}>{isSaving ? 'Saving...' : 'Save Update'}</button>
                    </div>
                </form>
            </div>
        </div>
    )
}
    
export default OrderUpdate;
