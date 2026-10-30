import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { listFlags, resolveFlag } from "../services/flags";
import { friendlyError } from "../utils";

const TABS = [
    { value: "pending", label: "Needs review" },
    { value: "dismissed", label: "Dismissed (looks fine)" },
    { value: "confirmed", label: "Confirmed concern" },
];

const RISK_ORDER = { high: 0, medium: 1, low: 2 };

const CATEGORY_LABELS = {
    scam: "Possible scam",
    impersonation: "Impersonation",
    spam: "Spam",
    gibberish_or_test: "Gibberish / test data",
    inappropriate: "Inappropriate",
    implausible_claims: "Implausible claims",
    other: "Other",
};

export default function Flags() {
    const { user: me } = useAuth();
    const [tab, setTab] = useState("pending");
    const [flags, setFlags] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [busyId, setBusyId] = useState(null);

    useEffect(() => {
        let active = true;
        setLoading(true);
        setError(null);
        listFlags(tab)
            .then((rows) => active && setFlags(rows))
            .catch((e) => active && setError(friendlyError(e)))
            .finally(() => active && setLoading(false));
        return () => { active = false; };
    }, [tab]);

    const sorted = useMemo(
        () => [...flags].sort((a, b) => (RISK_ORDER[a.risk] ?? 3) - (RISK_ORDER[b.risk] ?? 3)),
        [flags]
    );

    const decide = async (flag, status) => {
        setBusyId(flag.id);
        setError(null);
        try {
            await resolveFlag(flag.id, status, me?.uid);
            setFlags((prev) => prev.filter((f) => f.id !== flag.id));
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
                    <h1>AI profile review</h1>
                    <p className="sub">
                        New and edited profiles are checked automatically. The AI only flags — you decide.
                        It can be wrong, so please read the profile before acting.
                    </p>
                </div>
            </div>

            {error && <div className="notice error">{error}</div>}

            <div className="toolbar">
                <select value={tab} onChange={(e) => setTab(e.target.value)}>
                    {TABS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
            </div>

            {loading ? (
                <div className="loading">Loading…</div>
            ) : (
                <div className="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>Profile</th>
                                <th>Risk</th>
                                <th>Why it was flagged</th>
                                {tab === "pending" && <th style={{ width: 210 }}>Decision</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {sorted.length === 0 && (
                                <tr><td colSpan={tab === "pending" ? 4 : 3} className="empty">
                                    {tab === "pending" ? "Nothing waiting for review." : "Nothing here yet."}
                                </td></tr>
                            )}
                            {sorted.map((f) => (
                                <tr key={f.id}>
                                    <td>
                                        <div className="name">{f.organisationName || "(no name)"}</div>
                                        <div className="meta">{f.role} · {f.id}</div>
                                    </td>
                                    <td><span className={`badge ${f.risk}`}>{f.risk}</span></td>
                                    <td>
                                        {(f.categories || []).length > 0 && (
                                            <div className="meta" style={{ marginBottom: 6 }}>
                                                {f.categories.map((c) => CATEGORY_LABELS[c] || c).join(" · ")}
                                            </div>
                                        )}
                                        <ul className="reasons">
                                            {(f.reasons || []).map((r, i) => <li key={i}>{r}</li>)}
                                        </ul>
                                        {f.source === "rules" && (
                                            <div className="meta">The AI was unavailable, so this came from simple automatic checks.</div>
                                        )}
                                    </td>
                                    {tab === "pending" && (
                                        <td>
                                            <div style={{ display: "flex", gap: 8 }}>
                                                <button className="btn success sm" disabled={busyId === f.id} onClick={() => decide(f, "dismissed")}>
                                                    Looks fine
                                                </button>
                                                <button className="btn danger sm" disabled={busyId === f.id} onClick={() => decide(f, "confirmed")}>
                                                    Confirm concern
                                                </button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </>
    );
}