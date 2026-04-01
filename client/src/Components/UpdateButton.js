import React from 'react'

const UpdateButton = (props) => {
    const updateClickHandler = () =>{
        props.updateStatus(props.data);
    }

    return (
        <div className='action-row mt-4'>
            <button id="submit" type="button" className="btn btn-dark btn-lg" onClick={updateClickHandler}>Update Selected Row</button>
        </div>
    )
}

export default UpdateButton;
