import React from 'react';
import './popups.css';

const AlertMessage = ({ message }) => {

    return (
        <div className="alert alert-danger" role="alert" style={{ textAlign: "center" }}>
            {message}
        </div>
    );
}

export default AlertMessage;