import React, { useEffect, useMemo, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import StatCard from "../components/StatCard";
import PrimaryCharts from "../components/dashboard/PrimaryCharts";
import SecondaryCharts from "../components/dashboard/SecondaryCharts";
import { useAuth } from "../context/AuthContext";
import { deleteUserProfile, listUsers, setUserStatus } from "../services/users";
import { formatCurrencyShort, friendlyError } from "../utils";

const dateValue = (value) => value?.toDate?.() ?? (value ? new Date(value) : null);

function lastActive(user) {
    const date = dateValue(user.lastActiveAt ?? user.lastLoginAt ?? user.lastSeenAt);
    return date && !Number.isNaN(date.getTime())
        ? date.toLocaleString("en-ZA", { dateStyle: "medium", timeStyle: "short" })
        : "No activity recorded";
}

export default function Dashboard() {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [projects, setProjects] = useState([]);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [query, setQuery] = useState("");
    const [busyId, setBusyId] = useState(null);

    useEffect(() => {
        let mounted = true;
        Promise.all([
            listUsers(),
            getDocs(collection(db, "projects")),
            getDocs(collection(db, "payments")),
        ])
            .then(([nextUsers, projectSnapshot, paymentSnapshot]) => {
                if (!mounted) return;
                setUsers(nextUsers);
                setProjects(projectSnapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
                setPayments(paymentSnapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
            })
            .catch((e) => mounted && setError(friendlyError(e)))
            .finally(() => mounted && setLoading(false));
        return () => { mounted = false; };
    }, []);

    const stats = useMemo(() => ({
        sponsors: users.filter((user) => user.role === "sponsor").length,
        ngos: users.filter((user) => user.role === "ngo").length,
        sponsored: payments.filter((payment) => payment.status === "complete")
            .reduce((sum, payment) => sum + (Number(payment.sponsorshipAmount) || 0), 0),
        generated: payments.filter((payment) => payment.status === "complete")
            .reduce((sum, payment) => sum + (Number(payment.platformFeeAmount) || 0), 0),
    }), [users, payments]);

    const visibleUsers = useMemo(() => {
        const term = query.trim().toLowerCase();
        return [...users]
            .filter((user) => !term || [user.full_name, user.name, user.organisationName, user.email]
                .some((value) => String(value ?? "").toLowerCase().includes(term)))
            .sort((a, b) => (dateValue(b.lastActiveAt ?? b.lastLoginAt)?.getTime() || 0) - (dateValue(a.lastActiveAt ?? a.lastLoginAt)?.getTime() || 0));
    }, [users, query]);

    const updateStatus = async (user) => {
        const suspended = user.accountStatus === "suspended";
        const nextStatus = suspended ? "active" : "suspended";
        if (!window.confirm(`${suspended ? "Reactivate" : "Suspend"} ${user.email || user.full_name || "this account"}?`)) return;
        setBusyId(user.id);
        setError(null);
        try {
            await setUserStatus(user.id, nextStatus);
            setUsers((current) => current.map((item) => item.id === user.id ? { ...item, accountStatus: nextStatus } : item));
        } catch (e) { setError(friendlyError(e)); }
        finally { setBusyId(null); }
    };

    const removeUser = async (user) => {
        if (!window.confirm(`Delete the Firestore profile for ${user.email || user.full_name || "this user"}? This cannot be undone.`)) return;
        setBusyId(user.id);
        setError(null);
        try {
            await deleteUserProfile(user.id);
            setUsers((current) => current.filter((item) => item.id !== user.id));
        } catch (e) { setError(friendlyError(e)); }
        finally { setBusyId(null); }
    };

    if (loading) return <div className="loading">Loading dashboard…</div>;

    return (
        <div className="dashboard-page">
            <div className="page-head">
                <div><h1>Dashboard</h1><p className="sub">Live overview from your platform database</p></div>
                <input className="dashboard-search" type="search" placeholder="Search users" value={query} onChange={(event) => setQuery(event.target.value)} />
            </div>
            {error && <div className="notice error">{error}</div>}

            <div className="dashboard-stats">
                <StatCard title="Total Sponsors" value={stats.sponsors} />
                <StatCard title="Total NGOs" value={stats.ngos} />
                <StatCard title="Funds Sponsored" value={formatCurrencyShort(stats.sponsored, "R")} />
                <StatCard title="Platform Fees" value={formatCurrencyShort(stats.generated, "R")} />
            </div>

            <PrimaryCharts users={users} payments={payments} />
            <SecondaryCharts projects={projects} />

            <section className="card dashboard-users" style={{ marginBottom: 24 }}>
                <div className="section-heading">
                    <div><h2>Recent Sponsorship Payments</h2><p className="sub">Transactions recorded through the Sponsor Payment API</p></div>
                    <span className="user-count">{payments.length} Payments</span>
                </div>
                <div className="table-wrap dashboard-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Project</th>
                                <th>Sponsor</th>
                                <th>NGO</th>
                                <th>Amount</th>
                                <th>Gateway</th>
                                <th>Status</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payments.length === 0 && (
                                <tr><td colSpan={7} className="empty">No payments recorded yet.</td></tr>
                            )}
                            {payments.map((pmt) => {
                                const date = dateValue(pmt.paidAt ?? pmt.createdAt);
                                const dateStr = date ? date.toLocaleString("en-ZA", { dateStyle: "medium", timeStyle: "short" }) : "Recently";
                                return (
                                    <tr key={pmt.id}>
                                        <td><strong>{pmt.projectTitle || "Project sponsorship"}</strong></td>
                                        <td>{pmt.sponsorName || "Sponsor"}</td>
                                        <td>{pmt.ngoName || "NGO"}</td>
                                        <td><strong>R{Number(pmt.sponsorshipAmount || 0).toLocaleString("en-ZA")}</strong></td>
                                        <td><span className="meta">{pmt.provider || "PayFast API"}</span></td>
                                        <td>
                                            <span className={`account-status ${pmt.status === "complete" ? "active" : "suspended"}`}>
                                                {pmt.status === "complete" ? "Confirmed" : (pmt.status || "Pending")}
                                            </span>
                                        </td>
                                        <td><span className="meta">{dateStr}</span></td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="card dashboard-users">
                <div className="section-heading">
                    <div><h2>Platform users</h2><p className="sub">Accounts are active by default. Recent activity appears when the app records it.</p></div>
                    <span className="user-count">{visibleUsers.length} users</span>
                </div>
                <div className="table-wrap dashboard-table">
                    <table>
                        <thead><tr><th>User</th><th>Account type</th><th>Last active</th><th>Status</th><th>Contact</th><th>Actions</th></tr></thead>
                        <tbody>
                            {visibleUsers.length === 0 && <tr><td colSpan={6} className="empty">No users found.</td></tr>}
                            {visibleUsers.map((user) => {
                                const suspended = user.accountStatus === "suspended";
                                const isCurrentUser = user.id === currentUser?.uid;
                                const name = user.organisationName || user.full_name || user.name || user.email || user.id;
                                return <tr key={user.id}>
                                    <td><div className="name">{name}</div>{user.email && <div className="meta">{user.email}</div>}</td>
                                    <td>{user.role === "ngo" ? "NGO" : user.role === "sponsor" ? "Sponsor" : user.role || "Member"}</td>
                                    <td>{lastActive(user)}</td>
                                    <td><span className={`account-status ${suspended ? "suspended" : "active"}`}>{suspended ? "Suspended" : "Active"}</span></td>
                                    <td>{user.email ? <a className="email-link" href={`mailto:${encodeURIComponent(user.email)}`}>Send email</a> : <span className="meta">No email</span>}</td>
                                    <td><div className="actions">
                                        <button className={`btn sm ${suspended ? "success" : "ghost"}`} disabled={busyId === user.id || isCurrentUser} title={isCurrentUser ? "You cannot suspend your own account" : undefined} onClick={() => updateStatus(user)}>{suspended ? "Reactivate" : "Suspend"}</button>
                                        <button className="btn sm danger" disabled={busyId === user.id || isCurrentUser} title={isCurrentUser ? "You cannot delete your own profile" : undefined} onClick={() => removeUser(user)}>Delete</button>
                                    </div></td>
                                </tr>;
                            })}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}
