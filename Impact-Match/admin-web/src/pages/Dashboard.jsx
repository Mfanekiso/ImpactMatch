import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import { listSponsors } from "../services/sponsors";
import { listUsers } from "../services/users";
import { formatCurrencyShort, friendlyError } from "../utils";

export default function Dashboard() {
    const [sponsors, setSponsors] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let active = true;
        Promise.all([listSponsors(), listUsers()])
            .then(([s, u]) => {
                if (!active) return;
                setSponsors(s);
                setUsers(u);
            })
            .catch((e) => active && setError(friendlyError(e)))
            .finally(() => active && setLoading(false));
        return () => { active = false; };
    }, []);

    const stats = useMemo(() => {
        const pending = sponsors.filter((s) => s.status === "pending");
        const funding = sponsors.reduce((sum, s) => sum + (Number(s.fundingDeployed) || 0), 0);
        return { total: sponsors.length, pending, users: users.length, funding };
    }, [sponsors, users]);

    if (loading) return <div className="loading">Loading dashboard…</div>;

    return (
        <>
            <div className="page-head">
                <div>
                    <h1>Dashboard</h1>
                    <p className="sub">Overview of your platform</p>
                </div>
                <Link to="/sponsors/new" className="btn">+ Add sponsor</Link>
            </div>

            {error && <div className="notice error">{error}</div>}

            <div className="stats">
                <StatCard value={stats.total} label="Sponsors" bg="var(--primary-bg)" color="var(--primary)" />
                <StatCard value={stats.pending.length} label="Pending approval" bg="var(--warning-bg)" color="var(--warning)" />
                <StatCard value={stats.users} label="Users" bg="var(--danger-bg)" color="var(--danger)" />
                <StatCard value={formatCurrencyShort(stats.funding)} label="Funding deployed" bg="var(--success-bg)" color="var(--success)" />
            </div>

            <div className="card">
                <h2>Needs your attention</h2>
                {stats.pending.length === 0 ? (
                    <p className="hint" style={{ fontSize: 14 }}>Nothing is waiting for approval.</p>
                ) : (
                    <div className="table-wrap" style={{ border: 0 }}>
                        <table style={{ minWidth: 0 }}>
                            <tbody>
                                {stats.pending.map((s) => (
                                    <tr key={s.id}>
                                        <td>
                                            <div className="name">{s.name}</div>
                                            <div className="meta">{[s.type, s.location].filter(Boolean).join(" · ")}</div>
                                        </td>
                                        <td><StatusBadge status={s.status} /></td>
                                        <td style={{ textAlign: "right" }}>
                                            <Link to={`/sponsors/${s.id}`} className="btn ghost sm">Review</Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </>
    );
}
