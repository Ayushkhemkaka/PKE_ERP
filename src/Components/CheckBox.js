import React, { useState } from 'react'

const Checkbox = (props)=> {
    const [isChecked,setIsChecked] = useState(props.default)

    const checkboxCheckHandler = (event)=>{        
        setIsChecked(!isChecked)
        props.checkboxChangeHandler(event.target.id,isChecked)  
    }

    return (
        <div className="form-check app-checkbox-chip">
            <input className="form-check-input" type="checkbox" id={props.id} value={props.isChecked} onChange={checkboxCheckHandler} checked={isChecked}/>
            <label className="form-check-label" htmlFor={props.id}>{props.name}</label>
        </div>
    )
}

export default Checkbox;
