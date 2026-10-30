import React from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Layout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate("/login");
    };

    return (
        <div className="shell">
            <main className="main">
                <header className="topbar">
                    <span className="brand">ImpactMatch Admin</span>
                    <div className="topbar-account">
                        <span className="who">{user?.email}</span>
                        <button className="btn outline sm" onClick={handleLogout}>Sign out</button>
                    </div>
                </header>
                <Outlet />
            </main>
        </div>
    );
}
