import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom';
import logo from "../assets/notemania-logo.png";

export default function Signup(props) {
    const [credentials, setCredentials] = useState({ name: "", email: "", password: "", cpassword: "" })
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const { name, email, password } = credentials;
        const response = await fetch("http://localhost:8080/api/auth/createuser", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, password })
        });
        const json = await response.json()
        // console.log(json);
        if (json.success) {
            localStorage.setItem('token', json.authToken);
            localStorage.setItem('userEmail', email);
            navigate('/')
            props.showAlert("account created Successfully", "teal")
        }
        else {
            props.showAlert("Invalid Details", "red")
        }
    }

    const onChange = (e) => {
        setCredentials({ ...credentials, [e.target.name]: e.target.value })
    }
    return (
        <main className="bg-gray-50 min-h-screen flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                <div className="mb-6 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white border border-gray-200 overflow-hidden">
                        <img
                            src={logo}
                            alt="NoteMania logo"
                            className="w-full h-full object-contain"
                        />
                    </div>
                    <h1 className="mt-3 text-2xl font-bold text-gray-900">Create your NoteMania account</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Organize your notes securely in one place.
                    </p>
                </div>
                <div className="bg-white rounded-2xl shadow-md border border-gray-100 px-6 py-6">
                    <form className="space-y-4" onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                Name
                            </label>
                            <input
                                value={credentials.name}
                                onChange={onChange}
                                id="name"
                                name="name"
                                type="text"
                                className="mt-1 block w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                Email
                            </label>
                            <input
                                value={credentials.email}
                                onChange={onChange}
                                id="email"
                                name="email"
                                type="email"
                                className="mt-1 block w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                Password
                            </label>
                            <input
                                value={credentials.password}
                                onChange={onChange}
                                id="password"
                                name="password"
                                type="password"
                                className="mt-1 block w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                minLength={5}
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="cpassword" className="block text-sm font-medium text-gray-700">
                                Confirm Password
                            </label>
                            <input
                                value={credentials.cpassword}
                                onChange={onChange}
                                id="cpassword"
                                name="cpassword"
                                type="password"
                                className="mt-1 block w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full inline-flex justify-center items-center px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            Create account
                        </button>
                    </form>
                </div>
                <p className="mt-4 text-xs text-center text-gray-500">
                    Already have an account?{" "}
                    <Link to="/login" className="font-medium text-blue-600 hover:underline">
                        Log in
                    </Link>
                </p>
            </div>
        </main>
    )
}
