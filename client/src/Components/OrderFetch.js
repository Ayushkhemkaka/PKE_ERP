import React,{useState} from 'react'
import SearchOptions from './SearchOptions.js';
import SearchResult from './SearchResult.js';

const OrderFetch = ({ mode = 'normal' }) => {
    const [tableData,setTableData] = useState([]);
    const [columnList,setColumnList] = useState([])
    const [isCalled,setIsCalled] = useState(false)

    const onFind =(response,columnList) =>{
        setIsCalled(true)
        setTableData(response);
        setColumnList(columnList)
    }
    return (
        <>
            <SearchOptions onFind = {onFind} mode={mode} />
            {isCalled ? <div>
            {tableData.length >0 ? <SearchResult tableData= {tableData} columnList= {columnList} mode={mode}/> :<section className='form-container empty-state-card'>
            <div className='empty-state-content'>
            <h4 className="mb-2">No orders matched this search.</h4>
            <p className="mb-0">Try broadening your date range or removing one of the filters to inspect more results.</p>
            </div>
            </section>  } </div>: <br/> }
        </>
        )
    }
    
export default OrderFetch;
