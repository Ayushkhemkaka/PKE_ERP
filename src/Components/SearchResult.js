import React from 'react'

function searchResult(props) {

    return (
        <div className='bg-light'>
            <div className='container bg-info rounded p-4 overflow-scroll' style={{height :"auto" ,maxHeight: "500px" }}> 
    `           <table className="table table-hover table-bordered border rounded">
                    <thead style={{"position": "sticky"}}>
                        <tr>
                        <th scope="col">Book No</th>
                        <th scope="col">Date</th>
                        <th scope="col">Name</th>
                        <th scope="col">Lorry Number</th>
                        <th scope="col">Item</th>
                        <th scope="col">Payment Status</th>
                        <th scope="col">Total Amount</th>
                        <th scope="col">Due Amount</th>
                        <th scope="col">Paid Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {props.tableData.map(data =>
                            <tr key= {data.key}>
                                <th scope="col">{data.booknumber}</th>
                                <th scope="col">{data.date?.split("T")[0]}</th>
                                <th scope="col">{data.name}</th>
                                <th scope="col">{data.lorrynumber}</th>
                                <th scope="col">{data.item}</th>
                                <th scope="col">{data.paymentstatus}</th>
                                <th scope="col">{"₹ " + data.totalamount}</th>
                                <th scope="col">{"₹ " + data.dueamount}</th>
                                <th scope="col">{"₹ " + data.paidamount}</th>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>)
    }
    
export default searchResult;