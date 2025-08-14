import React from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Notes from './pages/Notes.jsx';
import Favourites from './pages/Favourites.jsx';
import Trash from './pages/Trash.jsx';
import Register from './pages/Register.jsx';
import Login from './pages/Login.jsx';
import ToastProvider from './components/ToastProvider';


function AppContent() {
    const location = useLocation();

    
    const hideNavbarRoutes = ["/login", "/register", "/welcome"];

    return (
        <div className='App'>
            {!hideNavbarRoutes.includes(location.pathname) && <Navbar />}
            <Routes>
                <Route path="/" element={<Notes />} />
                <Route path="/favourites" element={<Favourites />} />
                <Route path="/trash" element={<Trash />} />
                <Route path="/register" element={<Register />} />
                <Route path="/login" element={<Login />} />
            </Routes>
            <ToastProvider />
        </div>
    );
}

function App() {
    return (
        <Router>
            <AppContent />
        </Router>
    );
}

export default App;
