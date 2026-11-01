import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { deleteUserProfile, listUsers, setUserRole, setUserStatus } from "../services/users";
import { friendlyError } from "../utils";

// Roles used by the mobile app: NGOs and sponsors sign up themselves; "admin" is web-only.
const ROLES = ["ngo", "sponsor", "admin"];

// The mobile app stores "suspended" in accountStatus. A missing value counts as active.
const statusOf = (u) => (u.accountStatus === "suspended" ? "suspended" : "active");
// Mobile sign-up stores full_name; NGO/sponsor setup adds organisationName.
const nameOf = (u) => u.full_name || u.name || u.organisationName || u.email || u.id;

export default function Users() {
    const { user: me } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [query, setQuery] = useState("");
    const [busyId, setBusyId] = useState(null);

    useEffect(() => {
        let active = true;
        listUsers()
            .then((u) => active && setUsers(u))
            .catch((e) => active && setError(friendlyError(e)))
            .finally(() => active && setLoading(false));
        return () => { active = false; };
    }, []);

    const visible = useMemo(() => {
        const q = query.trim().toLowerCase();
        return users.filter(
            (u) =>
                q === "" ||
                [u.full_name, u.name, u.organisationName, u.email]
                    .some((v) => (v ?? "").toLowerCase().includes(q))
        );
    }, [users, query]);

    // Runs one admin action on one user, with shared busy/error handling.
    const run = async (u, action, onSuccess) => {
        setBusyId(u.id);
        setError(null);
        try {
            await action();
            onSuccess();
        } catch (e) {
            setError(friendlyError(e));
        } finally {
            setBusyId(null);
        }
    };

    const changeRole = (u, role) => {
        if (u.id === me?.uid) return; // never let an admin change their own role here
        if (role === "admin" && !window.confirm(`Give ${nameOf(u)} admin access?`)) return;
        run(
            u,
            () => setUserRole(u.id, role),
            () => setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, role } : x)))
        );
    };

    const toggleStatus = (u) => {
        if (u.id === me?.uid) return; // an admin can't deactivate themselves
        const next = statusOf(u) === "active" ? "suspended" : "active";
        const msg =
            next === "suspended"
                ? `Deactivate ${nameOf(u)}? They will be blocked from using the app until you reactivate them.`
                : `Reactivate ${nameOf(u)}?`;
        if (!window.confirm(msg)) return;
        run(
            u,
            () => setUserStatus(u.id, next),
            () => setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, accountStatus: next } : x)))
        );
    };

    const removeUser = (u) => {
        if (u.id === me?.uid) return; // an admin can't delete themselves
        const msg =
            `Permanently delete the profile for ${nameOf(u)}?` +
            (u.role === "admin" ? "\n\nThis user is an ADMIN." : "") +
            `\n\nThis removes their user record and cannot be undone. ` +
            `It does NOT remove their login from Firebase Authentication, and it does not ` +
            `remove their projects, payments or sponsorships. To block someone, use Deactivate instead.`;
        if (!window.confirm(msg)) return;
        run(
            u,
            () => deleteUserProfile(u.id),
            () => setUsers((prev) => prev.filter((x) => x.id !== u.id))
        );
    };

    return (
        <>
            <div className="page-head">
                <div>
                    <h1>Users</h1>
                    <p className="sub">{users.length} total</p>
                </div>
            </div>

            {error && <div className="notice error">{error}</div>}

            <div className="toolbar">
                <input
                    type="search"
                    placeholder="Search name, organisation or email"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
            </div>

            {loading ? (
                <div className="loading">Loading users…</div>
            ) : (
                <div className="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th style={{ width: 150 }}>Change role</th>
                                <th style={{ textAlign: "right" }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visible.length === 0 && (
                                <tr><td colSpan={5} className="empty">No users found.</td></tr>
                            )}
                            {visible.map((u) => {
                                const isMe = u.id === me?.uid;
                                const role = u.role ?? "none";
                                const status = statusOf(u);
                                const busy = busyId === u.id;
                                const meta = [u.email, u.organisationName]
                                    .filter((v) => v && v !== nameOf(u))
                                    .join(" · ");
                                return (
                                    <tr key={u.id} style={status === "suspended" ? { opacity: 0.65 } : undefined}>
                                        <td>
                                            <div className="name">
                                                {nameOf(u)}
                                                {isMe && <span className="meta"> (you)</span>}
                                            </div>
                                            {meta && <div className="meta">{meta}</div>}
                                        </td>
                                        <td><span className={`badge ${role}`}>{role}</span></td>
                                        <td>
                                            <span className={`badge ${status}`}>
                                                {status === "active" ? "Active" : "Deactivated"}
                                            </span>
                                        </td>
                                        <td>
                                            <select
                                                value={u.role ?? ""}
                                                disabled={isMe || busy}
                                                onChange={(e) => changeRole(u, e.target.value)}
                                                title={isMe ? "You can't change your own role" : undefined}
                                            >
                                                {!ROLES.includes(u.role) && (
                                                    <option value="" disabled>{u.role ?? "Not set"}</option>
                                                )}
                                                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                                            </select>
                                        </td>
                                        <td>
                                            <div className="actions" style={{ justifyContent: "flex-end" }}>
                                                <button
                                                    className={`btn sm ${status === "active" ? "ghost" : "success"}`}
                                                    disabled={isMe || busy}
                                                    onClick={() => toggleStatus(u)}
                                                    title={isMe ? "You can't deactivate your own account" : undefined}
                                                >
                                                    {status === "active" ? "Deactivate" : "Reactivate"}
                                                </button>
                                                <button
                                                    className="btn sm danger"
                                                    disabled={isMe || busy}
                                                    onClick={() => removeUser(u)}
                                                    title={isMe ? "You can't delete your own account" : undefined}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </>
    );
}