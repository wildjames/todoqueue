import axios from "axios";
import { useState } from "react"; // Define the Login function.


export const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Create the submit method.
    const submit = async e => {
        e.preventDefault();

        console.log("Logging in");

        const user = {
            email: email,
            password: password
        };

        // Create the POST requuest
        const res = await axios.post(
            'http://localhost:3936/api/token/',
            user,
            {
                headers:
                {
                    'Content-Type': 'application/json'
                },
                withCredentials: true
            },
        );
        console.log(res.data);

        // Initialize the access & refresh token in localstorage.      
        localStorage.clear();
        localStorage.setItem('access_token', res.data.access);
        localStorage.setItem('refresh_token', res.data.refresh);

        axios.defaults.headers.common['Authorization'] = `Bearer ${res.data['access']}`;
        window.location.href = '/'
    }

    return (
        <div className="Auth-form-container todoqueue-auth-form">
            <form className="Auth-form" onSubmit={submit}>
                <div className="Auth-form-content">
                    <h3 className="Auth-form-title">Sign In</h3>
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
                            className="btn btn-primary">Submit</button>
                    </div>
                </div>
            </form>
        </div>
    )
}