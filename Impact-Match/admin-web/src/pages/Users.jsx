import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { listUsers, setUserRole } from "../services/users";
import { friendlyError } from "../utils";

const ROLES = ["student", "sponsor", "admin"];

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
                (u.name ?? "").toLowerCase().includes(q) ||
                (u.email ?? "").toLowerCase().includes(q)
        );
    }, [users, query]);

    const changeRole = async (u, role) => {
        if (u.id === me?.uid) return; // never let an admin change their own role here
        if (role === "admin" && !window.confirm(`Give ${u.email || u.name || "this user"} admin access?`)) return;

        setBusyId(u.id);
        setError(null);
        try {
            await setUserRole(u.id, role);
            setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, role } : x)));
        } catch (e) {
            setError(friendlyError(e));
        } finally {
            setBusyId(null);
        }
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
                    placeholder="Search name or email"
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
                                <th>Current role</th>
                                <th style={{ width: 180 }}>Change role</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visible.length === 0 && (
                                <tr><td colSpan={3} className="empty">No users found.</td></tr>
                            )}
                            {visible.map((u) => {
                                const isMe = u.id === me?.uid;
                                const role = u.role ?? "none";
                                return (
                                    <tr key={u.id}>
                                        <td>
                                            <div className="name">
                                                {u.name || u.email || u.id}
                                                {isMe && <span className="meta"> (you)</span>}
                                            </div>
                                            {u.name && u.email && <div className="meta">{u.email}</div>}
                                        </td>
                                        <td><span className={`badge ${role}`}>{role}</span></td>
                                        <td>
                                            <select
                                                value={u.role ?? ""}
                                                disabled={isMe || busyId === u.id}
                                                onChange={(e) => changeRole(u, e.target.value)}
                                                title={isMe ? "You can't change your own role" : undefined}
                                            >
                                                {!u.role && <option value="" disabled>Not set</option>}
                                                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                                            </select>
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
