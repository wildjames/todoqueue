import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import React, { useState, useEffect } from 'react';

// My component CSS
import './navigation.css';

export function Navigation({ households, selectedHousehold, setSelectedHousehold, showHouseholdSelector }) {
    const [isAuth, setIsAuth] = useState(false);

    useEffect(() => {
        if (localStorage.getItem('access_token') !== null) {
            console.log("Navbar detected an access token");
            setIsAuth(true);
        }
    }, [isAuth]);


    function toggleFullScreen() {
        if (!document.fullscreenElement) {
            if (document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen();
            } else if (document.documentElement.mozRequestFullScreen) { /* Firefox */
                document.documentElement.mozRequestFullScreen();
            } else if (document.documentElement.webkitRequestFullscreen) { /* Chrome, Safari & Opera */
                document.documentElement.webkitRequestFullscreen();
            } else if (document.documentElement.msRequestFullscreen) { /* IE/Edge */
                document.documentElement.msRequestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.mozCancelFullScreen) { /* Firefox */
                document.mozCancelFullScreen();
            } else if (document.webkitExitFullscreen) { /* Chrome, Safari & Opera */
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) { /* IE/Edge */
                document.msExitFullscreen();
            }
        }
    }

    return (
        <div>
            <Navbar className="navbar" bg="dark" variant="dark" sticky="left" expand="lg">
                <div className="navbar-logo-fullscreen-container">
                    <Navbar.Brand href="/" style={{ paddingLeft: '1rem' }}>ToDoQu</Navbar.Brand>

                    <button
                        onClick={toggleFullScreen}
                        className="fullscreen-icon"
                    >
                        <svg fill="#ffffff" height="20px" width="20px" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" viewBox="0 0 384.97 384.97" xmlSpace="preserve" stroke="#ffffff"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g> <g id="Fullscreen_1_"> <path d="M372.939,216.545c-6.123,0-12.03,5.269-12.03,12.03v132.333H24.061V24.061h132.333c6.388,0,12.03-5.642,12.03-12.03 S162.409,0,156.394,0H24.061C10.767,0,0,10.767,0,24.061v336.848c0,13.293,10.767,24.061,24.061,24.061h336.848 c13.293,0,24.061-10.767,24.061-24.061V228.395C384.97,221.731,380.085,216.545,372.939,216.545z"></path> <path d="M372.939,0H252.636c-6.641,0-12.03,5.39-12.03,12.03s5.39,12.03,12.03,12.03h91.382L99.635,268.432 c-4.668,4.668-4.668,12.235,0,16.903c4.668,4.668,12.235,4.668,16.891,0L360.909,40.951v91.382c0,6.641,5.39,12.03,12.03,12.03 s12.03-5.39,12.03-12.03V12.03l0,0C384.97,5.558,379.412,0,372.939,0z"></path> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> </g> </g></svg>
                    </button>
                </div>

                <Navbar.Toggle aria-controls="responsive-navbar-nav" className="burger-button" />

                <Navbar.Collapse id="responsive-navbar-nav">
                    <Nav className="me-auto navbar-links-container">
                        {isAuth && (
                            <>
                                <Nav.Link href="/" style={{ paddingLeft: '2vw', paddingRight: '2vw' }}>Tasks</Nav.Link>
                                <Nav.Link href="/manage_households" style={{ paddingLeft: '2vw', paddingRight: '2vw' }}>Manage Households</Nav.Link>

                                {showHouseholdSelector && (
                                    <a className="navbar-center-panel">
                                        <select className="household-select" onChange={e => setSelectedHousehold(e.target.value === "Select a household" ? null : e.target.value)} value={selectedHousehold}>
                                            <option value={null}>Select a household</option>
                                            {households.map(household => (
                                                <option key={household.id} value={household.id}>{household.name}</option>
                                            ))}
                                        </select>
                                    </a>
                                )}
                            </>
                        )}
                    </Nav>

                    <Nav className="me-right navbar-links-container">
                        {!isAuth && <Nav.Link href="/signup" className="navbar-link">Sign Up</Nav.Link>}
                        {isAuth ?
                            <Nav.Link href="/logout" className="navbar-link logout-link">Log Out</Nav.Link> :
                            <Nav.Link href="/login" className="navbar-link">Login</Nav.Link>
                        }
                    </Nav>
                </Navbar.Collapse>
            </Navbar>
        </div>
    );
}