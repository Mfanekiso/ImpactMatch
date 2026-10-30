import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
    const { user, isAdmin, loading } = useAuth();
    const location = useLocation();

    if (loading) return <div className="loading">Loading…</div>;
    if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
    if (!isAdmin) return <Navigate to="/login" state={{ denied: true }} replace />;

    return children;
}
