import React, { useEffect, useMemo, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import StatCard from "../components/StatCard";
import PrimaryCharts from "../components/dashboard/PrimaryCharts";
import SecondaryCharts from "../components/dashboard/SecondaryCharts";
import { useAuth } from "../context/AuthContext";
import { deleteUserProfile, listUsers, setUserStatus } from "../services/users";
import { friendlyError } from "../utils";

const dateValue = (value) => value?.toDate?.() ?? (value ? new Date(value) : null);

// ---------- Settings ----------
// Platform fee taken from each sponsorship (3%). The records only store the amount, so the fee is worked out here.
// If a record ever has its own platformFeeAmount, that stored value is used instead.
const PLATFORM_FEE_RATE = 0.03;
// Every sponsorship counts as money sponsored EXCEPT ones with these statuses.
// To count only sponsorships your PayFast function has marked as paid, see the note on isCounted below.
const NOT_COUNTED = ["failed", "cancelled", "canceled", "rejected", "declined", "refunded", "expired"];
// Stricter alternative: replace the body with
//   ["paid", "complete", "completed"].includes(String(s?.status ?? "").trim().toLowerCase())
const isCounted = (s) => !NOT_COUNTED.includes(String(s?.status ?? "").trim().toLowerCase());

// Amounts may be stored as numbers or as text like "1500.00" or "R1,500.00".
const toNumber = (value) => {
    const n = Number(typeof value === "string" ? value.replace(/[^0-9.-]/g, "") : value);
    return Number.isFinite(n) ? n : 0;
};

// Exact rand amount for the cards, e.g. R12 450,00
const rand = (amount) =>
    `R${amount.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

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
    const [sponsorships, setSponsorships] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [query, setQuery] = useState("");
    const [busyId, setBusyId] = useState(null);
    const [showAllPayments, setShowAllPayments] = useState(false);

    useEffect(() => {
        let mounted = true;
        Promise.all([
            listUsers(),
            getDocs(collection(db, "projects")),
            getDocs(collection(db, "sponsorships")),
        ])
            .then(([nextUsers, projectSnapshot, sponsorshipSnapshot]) => {
                if (!mounted) return;
                setUsers(nextUsers);
                setProjects(projectSnapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
                setSponsorships(sponsorshipSnapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
            })
            .catch((e) => mounted && setError(friendlyError(e)))
            .finally(() => mounted && setLoading(false));
        return () => { mounted = false; };
    }, []);

    // The transactions are the documents in `sponsorships`. Each one is normalised to the shape the dashboard
    // (and PrimaryCharts) expect: sponsorshipAmount, platformFeeAmount (3% unless stored), and status "complete"
    // for anything that counts. Records that don't count (failed, cancelled...) keep their own status and add R0.
    const payments = useMemo(() => sponsorships.map((sp) => {
        const amount = toNumber(sp.amount ?? sp.sponsorshipAmount);
        const counted = isCounted(sp);
        const storedFee = toNumber(sp.platformFeeAmount ?? sp.platformFee);
        const fee = storedFee || Math.round(amount * PLATFORM_FEE_RATE * 100) / 100;
        return {
            ...sp,
            sponsorshipAmount: amount,
            platformFeeAmount: counted ? fee : 0,
            status: counted ? "complete" : sp.status,
        };
    }), [sponsorships]);

    const stats = useMemo(() => ({
        sponsors: users.filter((user) => user.role === "sponsor").length,
        ngos: users.filter((user) => user.role === "ngo").length,
        sponsored: payments.filter(isCounted).reduce((sum, p) => sum + p.sponsorshipAmount, 0),
        generated: payments.filter(isCounted).reduce((sum, p) => sum + p.platformFeeAmount, 0),
    }), [users, payments]);

    // Table rows: newest first, with sponsor / NGO / project names filled in from users and projects
    // when the sponsorship document doesn't store them itself.
    const paymentRows = useMemo(() => {
        const userById = new Map(users.map((u) => [u.id, u]));
        const projectById = new Map(projects.map((p) => [p.id, p]));
        const nameOf = (u) => u?.organisationName || u?.full_name || u?.name || u?.email;
        return payments
            .map((doc) => {
                const date = dateValue(doc.paidAt ?? doc.createdAt);
                const project = projectById.get(doc.projectId);
                return {
                    ...doc,
                    _key: doc.id,
                    _date: date && !Number.isNaN(date.getTime()) ? date : null,
                    _project: doc.projectTitle || project?.title || project?.name || "Project sponsorship",
                    _sponsor: doc.sponsorName || nameOf(userById.get(doc.sponsorId)) || "Sponsor",
                    _ngo: doc.ngoName || nameOf(userById.get(doc.ngoId)) || "NGO",
                    _amount: doc.sponsorshipAmount,
                };
            })
            .sort((a, b) => (b._date?.getTime() || 0) - (a._date?.getTime() || 0));
    }, [payments, users, projects]);
    const visiblePayments = showAllPayments ? paymentRows : paymentRows.slice(0, 10);

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
                <StatCard title="Funds Sponsored" value={rand(stats.sponsored)} />
                <StatCard title="Platform Fees" value={rand(stats.generated)} />
            </div>

            <PrimaryCharts users={users} payments={payments} />
            <SecondaryCharts projects={projects} />

            <section className="card dashboard-users" style={{ marginBottom: 24 }}>
                <div className="section-heading">
                    <div><h2>Recent Sponsorship Payments</h2><p className="sub">Transactions recorded through the Sponsor Payment API</p></div>
                    <span className="user-count">{paymentRows.length} Payments</span>
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
                            {paymentRows.length === 0 && (
                                <tr><td colSpan={7} className="empty">No payments recorded yet.</td></tr>
                            )}
                            {visiblePayments.map((pmt) => {
                                const dateStr = pmt._date
                                    ? pmt._date.toLocaleString("en-ZA", { dateStyle: "medium", timeStyle: "short" })
                                    : "—";
                                return (
                                    <tr key={pmt._key}>
                                        <td><strong>{pmt._project}</strong></td>
                                        <td>{pmt._sponsor}</td>
                                        <td>{pmt._ngo}</td>
                                        <td><strong>R{pmt._amount.toLocaleString("en-ZA")}</strong></td>
                                        <td><span className="meta">PayFast</span></td>
                                        <td>
                                            {isCounted(pmt) ? (
                                                <span className="account-status active">Paid</span>
                                            ) : (
                                                <span className="account-status suspended">{pmt.status || "Pending"}</span>
                                            )}
                                        </td>
                                        <td><span className="meta">{dateStr}</span></td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                {paymentRows.length > 10 && (
                    <div style={{ textAlign: "center", marginTop: 12 }}>
                        <button className="btn ghost sm" onClick={() => setShowAllPayments((v) => !v)}>
                            {showAllPayments ? "Show latest 10" : `Show all ${paymentRows.length}`}
                        </button>
                    </div>
                )}
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