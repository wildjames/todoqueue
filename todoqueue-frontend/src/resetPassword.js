import axios from "axios";
import { useState } from "react";
import { useParams } from "react-router-dom";

const apiUrl = process.env.REACT_APP_BACKEND_URL;

export const ResetPassword = () => {
    const { uid, token } = useParams();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const submit = async e => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            setErrorMessage("Passwords do not match.");
            return;
        }

        console.log("Resetting password");

        const payload = {
            new_password: newPassword,
            confirm_new_password: confirmPassword,
        };

        console.log("Sending new password payload:", payload);

        try {
            const res = await axios.post(
                `${apiUrl}/complete_forgot_password/${uid}/${token}/`,
                payload,
                {
                    headers:
                    {
                        'Content-Type': 'application/json'
                    },
                    withCredentials: true
                },
            );
            if (res.status === 200) {
                console.log("Password successfully reset:", res.data);
                setErrorMessage("Password successfully reset. You can now log in.");
                // Redirect to login page after 5 seconds.
                setTimeout(() => {
                    window.location.href = '/login';
                }, 5000);
            } else {
                console.log("Error during password reset:", res);
                setErrorMessage("Error during password reset.");
            }
        } catch (error) {
            console.log("Error during password reset:", error);
            setErrorMessage("Error during password reset.");
        }
    };

    return (
        <div className="Auth-form-container todoqueue-auth-form">
            <form className="Auth-form" onSubmit={submit}>
                <div className="Auth-form-content">
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
                            className="btn btn-primary">Reset Password</button>
                    </div>
                    <div className="mt-3" style={{ width: "" }}>
                        <h3>{errorMessage}</h3>
                    </div>
                </div>
            </form>
        </div>
    );
};
