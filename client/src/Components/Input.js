import React, { useEffect, useState } from 'react'

const Input = (props) => {
    const [input,setInput] = useState(props.value || 0)

    const InputChangeHandler = (event) =>{
        const inputValue = event.target.value
        setInput(inputValue)
        if(!(props.onChange === null)){
            props.onChange(event.target.value)
        }
    }

    const changeValue = () =>{
        setInput(props.value)
    }

    useEffect(()=>{
        changeValue()
    })

    return (
        <div className="col-lg-4 col-md-6">
            <div className="app-field">
                <label className="form-label" htmlFor={props.id}>{props.name + ":"}</label>
                <input type="number" className="form-control app-input" id={props.id} name={props.id} placeholder={props.placeholder} step="any" min="0" disabled={props.isDisabled} value={input || ""} onChange={InputChangeHandler} required={props.isRequired}/>
            </div>
        </div>
    )
}

export default Input;
