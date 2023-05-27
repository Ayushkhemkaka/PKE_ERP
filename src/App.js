import React from 'react'
import OrderEntry from './Components/OrderEntry.js';
import NavBar from './Components/NavBar.js';
import OrderFetch from './Components/OrderFetch.js';


function App() {
  return (
    <div>
        <NavBar/>
        <OrderEntry/><div className='bg-dark'>&nbsp; </div>
        <OrderFetch/><br/>
    </div>
  );
}

export default App; 
