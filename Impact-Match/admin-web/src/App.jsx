import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Sponsors from "./pages/Sponsors";
import SponsorForm from "./pages/SponsorForm";
import Users from "./pages/Users";
import { isFirebaseConfigured } from "./firebase";

export default function App() {
    if (!isFirebaseConfigured) {
        return (
            <div className="center-screen">
                <div className="card" style={{ maxWidth: 520 }}>
                    <h2>Firebase isn't configured</h2>
                    <p className="hint" style={{ fontSize: 14, lineHeight: 1.6 }}>
                        Copy <code>.env.example</code> to <code>.env</code>, fill in the values from
                        Firebase console → Project settings → Your apps → Web app, then restart{" "}
                        <code>npm run dev</code>.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route
                element={
                    <ProtectedRoute>
                        <Layout />
                    </ProtectedRoute>
                }
            >
                <Route path="/" element={<Dashboard />} />
                <Route path="/sponsors" element={<Sponsors />} />
                <Route path="/sponsors/new" element={<SponsorForm />} />
                <Route path="/sponsors/:id" element={<SponsorForm />} />
                <Route path="/users" element={<Users />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}
