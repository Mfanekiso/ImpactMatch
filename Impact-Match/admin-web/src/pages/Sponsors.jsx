import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import StatusBadge from "../components/StatusBadge";
import { listSponsors, setSponsorStatus } from "../services/sponsors";
import { friendlyError } from "../utils";

const FILTERS = ["all", "pending", "approved", "rejected"];

export default function Sponsors() {
    const [sponsors, setSponsors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [query, setQuery] = useState("");
    const [filter, setFilter] = useState("all");
    const [busyId, setBusyId] = useState(null);

    useEffect(() => {
        let active = true;
        listSponsors()
            .then((s) => active && setSponsors(s))
            .catch((e) => active && setError(friendlyError(e)))
            .finally(() => active && setLoading(false));
        return () => { active = false; };
    }, []);

    const visible = useMemo(() => {
        const q = query.trim().toLowerCase();
        return sponsors.filter(
            (s) =>
                (filter === "all" || s.status === filter) &&
                (q === "" || (s.name ?? "").toLowerCase().includes(q))
        );
    }, [sponsors, query, filter]);

    const changeStatus = async (id, status) => {
        setBusyId(id);
        setError(null);
        try {
            await setSponsorStatus(id, status);
            setSponsors((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));
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
                    <h1>Sponsors</h1>
                    <p className="sub">{sponsors.length} total</p>
                </div>
                <Link to="/sponsors/new" className="btn">+ Add sponsor</Link>
            </div>

            {error && <div className="notice error">{error}</div>}

            <div className="toolbar">
                <input
                    type="search"
                    placeholder="Search by name"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
                <div className="chips">
                    {FILTERS.map((f) => (
                        <button
                            key={f}
                            className={`chip ${filter === f ? "active" : ""}`}
                            onClick={() => setFilter(f)}
                        >
                            {f[0].toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="loading">Loading sponsors…</div>
            ) : (
                <div className="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>Sponsor</th>
                                <th>Causes</th>
                                <th>Status</th>
                                <th style={{ textAlign: "right" }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visible.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="empty">No sponsors found.</td>
                                </tr>
                            )}
                            {visible.map((s) => (
                                <tr key={s.id}>
                                    <td>
                                        <div className="name">{s.name}</div>
                                        <div className="meta">
                                            {[s.type, s.location].filter(Boolean).join(" · ")}
                                        </div>
                                    </td>
                                    <td style={{ color: "var(--primary)" }}>
                                        {(s.causes ?? []).join(" • ")}
                                    </td>
                                    <td><StatusBadge status={s.status} /></td>
                                    <td>
                                        <div className="actions" style={{ justifyContent: "flex-end" }}>
                                            {s.status !== "approved" && (
                                                <button
                                                    className="btn success sm"
                                                    disabled={busyId === s.id}
                                                    onClick={() => changeStatus(s.id, "approved")}
                                                >
                                                    Approve
                                                </button>
                                            )}
                                            {s.status !== "rejected" && (
                                                <button
                                                    className="btn danger sm"
                                                    disabled={busyId === s.id}
                                                    onClick={() => changeStatus(s.id, "rejected")}
                                                >
                                                    Reject
                                                </button>
                                            )}
                                            <Link to={`/sponsors/${s.id}`} className="btn ghost sm">Edit</Link>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </>
    );
}
