import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import React, { useState, useEffect } from 'react';
import './App.css';

export function Navigation({ households, selectedHousehold, setSelectedHousehold }) {
    const [isAuth, setIsAuth] = useState(false); useEffect(() => {
        if (localStorage.getItem('access_token') !== null) {
            setIsAuth(true);
        }
    }, [isAuth]);

    return (
        <div>
            <Navbar className="navbar" bg="dark" variant="dark" sticky="left">
                <Navbar.Brand href="/" style={{ paddingRight: '20px', paddingLeft: '20px' }}>ToDo Queue</Navbar.Brand>
                <Nav className="me-auto">
                    {
                        isAuth ?
                            <>
                                <Nav.Link href="/" style={{ paddingLeft: '10px', paddingRight: '10px' }}>Tasks</Nav.Link>
                                <Nav.Link href="/user_statistics" style={{ paddingLeft: '10px', paddingRight: '10px' }}>User Statistics</Nav.Link>
                            </> :
                            null
                    }
                </Nav>
                <Nav className="me-auto">
                    {
                        isAuth ?
                            <>
                                <select className="household-select" onChange={e => setSelectedHousehold(e.target.value === "Select a household" ? null : e.target.value)} value={selectedHousehold}>
                                    <option value={null}>Select a household</option>
                                    {households.map(household => (
                                        <option key={household.id} value={household.id}>{household.name}</option>
                                    ))}
                                </select>
                            </> :
                            null
                    }
                </Nav>
                <Nav>
                    {
                        isAuth ?
                            <Nav.Link href="/logout" style={{ paddingLeft: '10px', paddingRight: '10px' }}>Logout</Nav.Link> :
                            <Nav.Link href="/login" style={{ paddingLeft: '10px', paddingRight: '10px' }}>Login</Nav.Link>
                    }
                </Nav>
            </Navbar>
        </div>

    );
}