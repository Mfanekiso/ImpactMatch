import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { friendlyError } from "../utils";

const FEATURES = [
    "Review and approve sponsors",
    "Track sponsorship payments",
    "Manage users and accounts",
];

function MailIcon() {
    return (
        <svg className="auth-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="m3 7 9 6 9-6" />
        </svg>
    );
}

function LockIcon() {
    return (
        <svg className="auth-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="4" y="11" width="16" height="10" rx="2" />
            <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </svg>
    );
}

function EyeIcon({ off }) {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
            <circle cx="12" cy="12" r="3" />
            {off && <path d="m3 3 18 18" />}
        </svg>
    );
}

export default function Login() {
    const { user, isAdmin, loading, login, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
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
        <main className="auth-page">
            <aside className="auth-brand">
                <div className="auth-brand-inner">
                    <div className="auth-wordmark">
                        IMPACT<span>MATCH</span>
                    </div>

                    <div className="auth-brand-copy">
                        <p className="auth-eyebrow">Admin Console</p>
                        <h2>Run the platform that connects sponsors with NGOs.</h2>
                        <ul className="auth-features">
                            {FEATURES.map((f) => (
                                <li key={f}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                        <path d="m5 12.5 4.5 4.5L19 7.5" />
                                    </svg>
                                    {f}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <p className="auth-brand-foot">Authorised administrators only.</p>
                </div>
            </aside>

            <section className="auth-panel">
                <form className="auth-form" onSubmit={handleSubmit} noValidate={false}>
                    <div className="auth-mobile-wordmark">
                        IMPACT<span>MATCH</span>
                    </div>

                    <h1>Welcome back</h1>
                    <p className="auth-sub">Sign in with your administrator account.</p>

                    {denied && (
                        <div className="auth-alert" role="alert">
                            This account doesn't have admin access.
                        </div>
                    )}
                    {error && (
                        <div className="auth-alert" role="alert">
                            {error}
                        </div>
                    )}

                    <label htmlFor="email">Email address</label>
                    <div className="auth-input-wrap">
                        <MailIcon />
                        <input
                            id="email"
                            className="auth-input"
                            type="email"
                            autoComplete="username"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            autoFocus
                            required
                        />
                    </div>

                    <label htmlFor="password">Password</label>
                    <div className="auth-input-wrap">
                        <LockIcon />
                        <input
                            id="password"
                            className="auth-input has-toggle"
                            type={showPassword ? "text" : "password"}
                            autoComplete="current-password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <button
                            type="button"
                            className="auth-toggle"
                            onClick={() => setShowPassword((v) => !v)}
                            aria-label={showPassword ? "Hide password" : "Show password"}
                            aria-pressed={showPassword}
                        >
                            <EyeIcon off={showPassword} />
                        </button>
                    </div>

                    <button className="auth-submit" disabled={busy}>
                        {busy ? <span className="auth-spinner" aria-hidden="true" /> : null}
                        {busy ? "Signing in…" : "Sign in"}
                    </button>
                </form>
            </section>
        </main>
    );
}