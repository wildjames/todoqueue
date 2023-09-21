import axios from "axios";
import { useState } from "react";

const apiUrl = process.env.REACT_APP_BACKEND_URL;

export const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const submit = async e => {
        e.preventDefault();

        console.log("Resetting password");

        const payload = {
            email: email
        };

        console.log("Sending reset password payload:", payload);

        try {
            const res = await axios.post(
                apiUrl + '/forgot_password/',
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
                console.log("Password reset email sent:", res.data);
                setErrorMessage("A password reset link has been sent to your email.");
            } else {
                console.log("Error during password reset:", res);
                setErrorMessage("Error during password reset.");
            }

        } catch (error) {
            console.log("Error during password reset:", error);
            setErrorMessage("Error during password reset.");
        }
    }

    return (
        <div className="Auth-form-container todoqueue-auth-form">
            <form className="Auth-form" onSubmit={submit}>
                <div className="Auth-form-content">
                    <h3 className="Auth-form-title">Forgot Password</h3>
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
                            className="btn btn-primary">Reset Password</button>
                    </div>
                    <div className="mt-3">
                        <a href="/login">Remembered your password? Log in</a>
                    </div>
                    <div className="mt-3" style={{ width: "" }}>
                        <h3>{errorMessage}</h3>
                    </div>
                </div>
            </form>
        </div>
    );
}
