import React from 'react';


const FailedRegistration = () => {


    return (
        <div className="FailedRegistration">

            <div className="failed-registration-container">
                <h1 style={{ marginLeft: "0px", textAlign: "center" }}>Account activation failed!</h1>
                <h3>Please retry account creation, or double-check you've used the correct email.</h3>
            </div>

        </div>
    );
}

export default FailedRegistration;