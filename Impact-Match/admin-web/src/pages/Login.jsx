import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { friendlyError } from "../utils";

export default function Login() {
    const { user, isAdmin, loading, login, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);
    const [denied, setDenied] = useState(Boolean(location.state?.denied));

    const redirectTo = location.state?.from?.pathname ?? "/";

    useEffect(() => {
        if (loading || !user) return;
        if (isAdmin) {
            navigate(redirectTo, { replace: true });
        } else {
            // Signed in, but not an admin: sign them straight back out.
            setDenied(true);
            logout();
        }
    }, [loading, user, isAdmin]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setDenied(false);
        setBusy(true);
        try {
            await login(email.trim(), password);
        } catch (err) {
            setError(friendlyError(err));
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="center-screen">
            <form className="card login-card" onSubmit={handleSubmit}>
                <h1>Admin Console</h1>
                <p className="sub">Sign in with your administrator account.</p>

                {denied && (
                    <div className="notice error">
                        This account doesn't have admin access.
                    </div>
                )}
                {error && <div className="notice error">{error}</div>}

                <div className="field">
                    <label htmlFor="email">Email</label>
                    <input
                        id="email"
                        type="email"
                        autoComplete="username"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>

                <div className="field">
                    <label htmlFor="password">Password</label>
                    <input
                        id="password"
                        type="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>

                <button className="btn" style={{ width: "100%" }} disabled={busy}>
                    {busy ? "Signing in…" : "Sign in"}
                </button>
            </form>
        </div>
    );
}
