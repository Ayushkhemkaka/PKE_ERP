import React from 'react'

function NavBar() {
    return(<div>
       <nav className="navbar navbar-light bg-light font-weight-bold">
  <span className="navbar-brand mb-0 h1 d-block w-100 "><p className="text-center" style={{fontSize: "40px"}}>P. K. ENTERPRISES</p></span>
</nav>
<div className="collapse navbar-collapse" id="navbarNav">
    <ul className="navbar-nav">
      <li className="nav-item active">
        {/* <a className="nav-link" href="#">Home <span className="sr-only">(current)</span></a> */}
      </li>
      <li className="nav-item">
        {/* <a className="nav-link" href="#">Features</a> */}
      </li>
      <li className="nav-item">
        <p>Enter</p>
        {/* <a className="nav-link" href="#">Pricing</a> */}
      </li>
      <li className="nav-item">
        <p>Retrieve</p>
        {/* <a className="nav-link disabled" href="#">Disabled</a> */}
      </li>
    </ul>
  </div>
    </div>)
}

export default NavBar;