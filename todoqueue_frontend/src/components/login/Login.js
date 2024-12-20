import { React, useState, useEffect } from "react";

import "./Login.css";
import "../../utils/buttons.css";

import { loginUser, fetchUserData } from "../../api/users";
import AlertMessage from "../popups/AlertPopup";
import Spinner from "../spinner/Spinner";


const Login = ({ setShowHouseholdSelector }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState(false);
    const [showSpinner, setShowSpinner] = useState(false);

    useEffect(() => {
        setShowHouseholdSelector(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Create the submit method.
    const submit = async e => {
        e.preventDefault();

        const response = loginUser(email, password);

        setShowSpinner(true);
        const data = await response;

        if (data.error) {
            setShowSpinner(false);
            setLoginError(data.error);
        } else if (data.success) {
            const res = await fetchUserData();

            if (res === null) {
                setShowSpinner(false);
                setLoginError("");
            }

            if (res.has_logged_in) {
                setShowSpinner(false);
                console.log("Login successful. Redirecting to /");
                window.location.href = "/tasks";
            } else {
                setShowSpinner(false);
                console.log("This is my first login. Redirecting to help page.");
                window.location.href = "/help";
            }
        }
    }

    const signup = async (e) => {
        e.preventDefault();
        window.location.href = "/signup";
    }

    return (
        <div className="Auth-form-container todoqueue-auth-form">
            <form className="Auth-form" onSubmit={submit}>
                <div className="Auth-form-content">
                    <h3 className="Auth-form-title">Sign In</h3>

                    {loginError && <AlertMessage message={"Login failed. Please check your credentials."} />}

                    {showSpinner && <Spinner />}

                    <div className="form-group mt-3">
                        <label>Email</label>
                        <input className="form-control mt-1"
                            placeholder="Enter email"
                            name='email'
                            type='text' value={email}
                            required
                            onChange={e => setEmail(e.target.value)} />
                    </div>

                    <div className="form-group mt-3">
                        <label>Password</label>
                        <input name='password'
                            type="password"
                            className="form-control mt-1"
                            placeholder="Enter password"
                            value={password}
                            required
                            onChange={e => setPassword(e.target.value)} />
                    </div>

                    <div className="d-grid gap-2 mt-3">
                        <button type="submit"
                            className="button"
                            style={{ margin: "0" }}
                        >
                            Log In
                        </button>
                    </div>

                    <div className="d-grid gap-3 mt-3">
                        <button
                            type="button"
                            onClick={signup}
                            className="button button-secondary"
                            style={{ margin: "0" }}
                        >
                            Sign Up
                        </button>
                    </div>

                    <div>
                        <a href="/forgot_password">Forgot your password?</a>
                    </div>
                </div>
            </form>
        </div>
    )
}

export default Login;
