import axios from "axios";
import { useState } from "react";

const apiUrl = process.env.REACT_APP_BACKEND_URL;

export const SignUp = () => {
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const submit = async e => {
        e.preventDefault();

        console.log("Signing up");

        const newUser = {
            email: email,
            username: username,
            password: password
        };

        console.log("Sending new user payload:", newUser);

        try {
            const res = await axios.post(
                apiUrl + '/register/',
                newUser,
                {
                    headers:
                    {
                        'Content-Type': 'application/json'
                    },
                    withCredentials: true
                },
            );
            if (res.status === 201) {
                console.log("New user created:", res.data);
                setErrorMessage("New user created. Please check your email for a verification link.");
            }
            else {
                console.log("Error during registration:", res);
                setErrorMessage("Error during registration.");
            }

        } catch (error) {
            console.log("Error during registration:", error);
            setErrorMessage("Error during registration.");
        }
    }

    return (
        <div className="Auth-form-container todoqueue-auth-form">
            <form className="Auth-form" onSubmit={submit}>
                <div className="Auth-form-content">
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
                        <label>Username</label>
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
                    <div className="d-grid gap-2 mt-3">
                        <button type="submit"
                            className="btn btn-primary">Register</button>
                    </div>
                    <div className="mt-3">
                        <a href="/login">Already have an account?</a>
                    </div>
                    <div className="mt-3" style={{ width: "" }}>
                        <h3>{errorMessage}</h3>
                    </div>
                </div>
            </form>
        </div>
    );
}
