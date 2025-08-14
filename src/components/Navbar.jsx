import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import './Navbar.css';
import Logo from '../assets/logo_notes.png';
import { LogOut } from 'lucide-react'; 

function Navbar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token'); 
    navigate('/login'); 
  };

  return (
    <nav className="navbar">
      <img src={Logo} alt="NoteEase Logo" className="navbar-logo" />
      <div className="navbar-links">
        <NavLink to="/">My Notes</NavLink>
        <NavLink to="/favourites">Favourites</NavLink>
        <NavLink to="/trash">Trash</NavLink>
      </div>


      <div className="navbar-footer">
        <button onClick={handleLogout} className="logout-btn">
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </nav>
  );
}

export default Navbar;