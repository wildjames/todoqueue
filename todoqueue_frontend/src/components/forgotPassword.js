import { React, useState, useEffect } from "react";

import { forgotPassword } from "../api/users";
import AlertMessage from "./popups/AlertPopup";
import Spinner from "./spinner/Spinner";

const ForgotPassword = ({ setShowHouseholdSelector }) => {
    const [email, setEmail] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [showSpinner, setShowSpinner] = useState(false);

    useEffect(() => {
        setShowHouseholdSelector(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const submit = async e => {
        e.preventDefault();
        setErrorMessage('');
        const result = forgotPassword(email);

        // Show loading spinner
        setShowSpinner(true);

        // Wait for the result promise to resolve
        const data = await result;

        if (data.error) {
            setErrorMessage(data.error);
        } else if (data.success) {
            setErrorMessage(data.success);
        } else {
            setErrorMessage("Error during password reset.");
        }

        // Hide loading spinner
        setShowSpinner(false);
    }

    return (
        <div className="Auth-form-container todoqueue-auth-form">
            <form className="Auth-form" onSubmit={submit}>
                <div className="Auth-form-content">
                    <h3 className="Auth-form-title">Forgot Password</h3>

                    {
                        errorMessage !== '' &&
                        <AlertMessage message={errorMessage} />
                    }

                    {showSpinner && <Spinner />}

                    <div className="form-group mt-3">
                        <label>Email</label>
                        <input className="form-control mt-1"
                            placeholder="Enter email"
                            name='email'
                            type='text'
                            value={email}
                            required
                            onChange={e => setEmail(e.target.value)} />
                    </div>
                    <div className="d-grid gap-2 mt-3">
                        <button type="submit"
                            className="button">Reset Password</button>
                    </div>
                    <div className="mt-3">
                        <a href="/login">Remembered your password? Log in</a>
                    </div>

                </div>
            </form>
        </div>
    );
}


export default ForgotPassword;
