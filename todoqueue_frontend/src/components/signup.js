import { useState, useEffect } from "react";

import { signUp } from "../api/users";
import Spinner from "./spinner/Spinner";
import AlertMessage from "./popups/AlertPopup";


export const SignUp = ({ setShowHouseholdSelector }) => {
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [showSpinner, setShowSpinner] = useState(false);
    const [feedbackMessage, setFeedbackMessage] = useState('');

    useEffect(() => {
        setShowHouseholdSelector(false);
    }, []);

    function getFirstErrorMessage(response) {
        for (let key in response) {
            if (response[key] instanceof Array && response[key].length > 0) {
                key = key[0].toUpperCase() + key.slice(1);
                return key + ": " + response[key][0];
            }
        }
        return "Error during signup"; // Default error message
    }

    const submit = async e => {
        e.preventDefault();

        if (password !== passwordConfirm) {
            setFeedbackMessage("Passwords do not match");
            return;
        }
        
        const promise = signUp(email, username, password);
        setShowSpinner(true);

        const data = await promise;
        
        setShowSpinner(false);
        if (data.success) {
            setFeedbackMessage(data.success);
        } else {
            console.log("Got error during signup:", data);
            setFeedbackMessage(getFirstErrorMessage(data.error));
        }

    }

    return (
        <div className="Auth-form-container todoqueue-auth-form">
            <form className="Auth-form" onSubmit={submit}>
                <div className="Auth-form-content">

                    { showSpinner && <Spinner /> }

                    { feedbackMessage !== "" && <AlertMessage message={feedbackMessage} /> }

                    <h3 className="Auth-form-title">Sign Up</h3>

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
                    
                    <div className="form-group mt-3">
                        <label>Display Name</label>
                        <input className="form-control mt-1"
                            placeholder="Enter username"
                            name='username'
                            type='text'
                            value={username}
                            required
                            onChange={e => setUsername(e.target.value)} />
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
                    
                    <div className="form-group mt-3">
                        <label>Confirm password</label>
                        <input name='password'
                            type="password"
                            className="form-control mt-1"
                            placeholder="Enter password"
                            value={passwordConfirm}
                            required
                            onChange={e => setPasswordConfirm(e.target.value)} />
                    </div>
                    
                    <div className="d-grid gap-2 mt-3">
                        <button type="submit"
                            className="btn btn-primary">Register</button>
                    </div>
                    
                    <div className="mt-3">
                        <a href="/login">Already have an account?</a>
                    </div>

                </div>
            </form>
        </div>
    );
}
