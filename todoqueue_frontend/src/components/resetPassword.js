import { useParams } from "react-router-dom";
import { React, useState, useEffect } from "react";
import { resetPassword } from "../api/users";
import Spinner from "./spinner/Spinner";
import AlertMessage from "./popups/AlertPopup";


export const ResetPassword = ({ setShowHouseholdSelector }) => {
    const { uid, token } = useParams();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [showSpinner, setShowSpinner] = useState(false);


    useEffect(() => {
        setShowHouseholdSelector(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


    const submit = async e => {
        e.preventDefault();
        setShowSpinner(true);

        if (newPassword !== confirmPassword) {
            setErrorMessage("Passwords do not match.");
            setShowSpinner(false);
            return;
        }

        console.log("Resetting password");

        try {
            const response = await resetPassword(uid, token, newPassword, confirmPassword);
            console.log("Password successfully reset:", response);
            setErrorMessage("Password successfully reset. You can now log in.");
            setShowSpinner(false);
            // Redirect to login page after 5 seconds.
            setTimeout(() => {
                window.location.href = '/login';
            }, 5000);
        } catch (error) {
            console.log("Error during password reset:", error);
            setErrorMessage("Error during password reset.");
            setShowSpinner(false);
        }
    };

    return (
        <div className="Auth-form-container todoqueue-auth-form">

            <form className="Auth-form" onSubmit={submit}>
                <div className="Auth-form-content">
                    {errorMessage !== '' && <AlertMessage message={errorMessage} />}

                    <h3 className="Auth-form-title">Reset Password</h3>
                    <div className="form-group mt-3">
                        <label>New Password</label>
                        <input className="form-control mt-1"
                            placeholder="Enter new password"
                            name='newPassword'
                            type='password'
                            value={newPassword}
                            required
                            onChange={e => setNewPassword(e.target.value)} />
                    </div>

                    <div className="form-group mt-3">
                        <label>Confirm New Password</label>
                        <input className="form-control mt-1"
                            placeholder="Confirm new password"
                            name='confirmPassword'
                            type='password'
                            value={confirmPassword}
                            required
                            onChange={e => setConfirmPassword(e.target.value)} />
                    </div>

                    <div className="d-grid gap-2 mt-3">
                        <button type="submit"
                            className="button">Reset Password</button>
                    </div>

                    {showSpinner && <Spinner />}
                </div>
            </form>
        </div>
    );
};
