import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
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
            <aside className="sidebar">
                <div className="brand">Admin Console</div>
                <nav className="nav">
                    <NavLink to="/" end>Dashboard</NavLink>
                    <NavLink to="/sponsors">Sponsors</NavLink>
                    <NavLink to="/users">Users</NavLink>
                </nav>
                <div className="sidebar-foot">
                    <div className="who">{user?.email}</div>
                    <button className="btn outline sm" onClick={handleLogout}>
                        Sign out
                    </button>
                </div>
            </aside>
            <main className="main">
                <Outlet />
            </main>
        </div>
    );
}
