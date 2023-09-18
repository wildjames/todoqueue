import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import React, { useState, useEffect } from 'react';

export function Navigation() {
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
                                <Nav.Link href="/" style={{ paddingLeft: '10px', paddingRight: '10px' }}>Home</Nav.Link>
                                <Nav.Link href="/user_statistics" style={{ paddingLeft: '10px', paddingRight: '10px' }}>User Statistics</Nav.Link>
                            </> :
                            null
                    }
                </Nav>
                <Nav>
                    {
                        isAuth ?
                            <Nav.Link href="/logout">Logout</Nav.Link> :
                            <Nav.Link href="/login">Login</Nav.Link>
                    }
                </Nav>
            </Navbar>
        </div>

    );
}