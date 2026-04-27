import React from 'react';

const SideNav = () => {
  return (
    <nav className="sidenav">
      <div className="nav-profile">
        <div className="nav-logo">
          <div className="nav-logo-circle">C</div>
          <span className="nav-logo-text">CAGED Master</span>
        </div>
      </div>
      <div className="nav-links">
        <a className="nav-item active" href="#" title="CAGED Master">
          <span className="material-symbols-outlined">dashboard</span>
          <span className="nav-label">CAGED Master</span>
        </a>
      </div>
    </nav>
  );
};

export default SideNav;
