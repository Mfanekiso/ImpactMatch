import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
    createSponsor,
    deleteSponsor,
    getSponsor,
    updateSponsor,
} from "../services/sponsors";
import { friendlyError } from "../utils";

const TYPES = ["Corporate", "Non-profit", "Trust", "Individual"];
const STATUSES = ["pending", "approved", "rejected"];

const EMPTY = {
    name: "",
    type: "Corporate",
    location: "",
    causes: "",
    description: "",
    website: "",
    fundingDeployed: "",
    status: "pending",
};

export default function SponsorForm() {
    const { id } = useParams();
    const isEdit = Boolean(id);
    const navigate = useNavigate();

    const [form, setForm] = useState(EMPTY);
    const [loading, setLoading] = useState(isEdit);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!isEdit) return;
        let active = true;
        getSponsor(id)
            .then((s) => {
                if (!active) return;
                if (!s) {
                    setError("Sponsor not found.");
                    return;
                }
                setForm({
                    name: s.name ?? "",
                    type: s.type ?? "Corporate",
                    location: s.location ?? "",
                    causes: (s.causes ?? []).join(", "),
                    description: s.description ?? "",
                    website: s.website ?? "",
                    fundingDeployed: s.fundingDeployed ?? "",
                    status: s.status ?? "pending",
                });
            })
            .catch((e) => active && setError(friendlyError(e)))
            .finally(() => active && setLoading(false));
        return () => { active = false; };
    }, [id, isEdit]);

    const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (!form.name.trim()) {
            setError("Please enter a sponsor name.");
            return;
        }

        let website = form.website.trim();
        if (website && !/^https?:\/\//i.test(website)) website = `https://${website}`;

        const data = {
            name: form.name.trim(),
            type: form.type,
            location: form.location.trim(),
            causes: form.causes.split(",").map((c) => c.trim()).filter(Boolean),
            description: form.description.trim(),
            website,
            fundingDeployed: Number(form.fundingDeployed) || 0,
            status: form.status,
        };

        setSaving(true);
        try {
            if (isEdit) await updateSponsor(id, data);
            else await createSponsor(data);
            navigate("/sponsors");
        } catch (err) {
            setError(friendlyError(err));
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm(`Delete ${form.name || "this sponsor"}? This can't be undone.`)) return;
        setSaving(true);
        try {
            await deleteSponsor(id);
            navigate("/sponsors");
        } catch (err) {
            setError(friendlyError(err));
            setSaving(false);
        }
    };

    if (loading) return <div className="loading">Loading sponsor…</div>;

    return (
        <>
            <div className="page-head">
                <div>
                    <h1>{isEdit ? "Edit sponsor" : "Add sponsor"}</h1>
                    <p className="sub">
                        <Link to="/sponsors" style={{ color: "var(--primary)" }}>← Back to sponsors</Link>
                    </p>
                </div>
            </div>

            <form className="card form-card" onSubmit={handleSubmit}>
                {error && <div className="notice error">{error}</div>}

                <div className="field">
                    <label htmlFor="name">Name</label>
                    <input id="name" value={form.name} onChange={set("name")} placeholder="e.g. Bright Futures Foundation" />
                </div>

                <div className="row2">
                    <div className="field">
                        <label htmlFor="type">Type</label>
                        <select id="type" value={form.type} onChange={set("type")}>
                            {TYPES.map((t) => <option key={t}>{t}</option>)}
                        </select>
                    </div>
                    <div className="field">
                        <label htmlFor="status">Status</label>
                        <select id="status" value={form.status} onChange={set("status")}>
                            {STATUSES.map((s) => (
                                <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="field">
                    <label htmlFor="location">Location</label>
                    <input id="location" value={form.location} onChange={set("location")} placeholder="City, Province" />
                </div>

                <div className="field">
                    <label htmlFor="causes">Causes</label>
                    <input id="causes" value={form.causes} onChange={set("causes")} placeholder="Education, Health, Environment" />
                    <div className="hint">Separate with commas.</div>
                </div>

                <div className="field">
                    <label htmlFor="description">Description</label>
                    <textarea id="description" value={form.description} onChange={set("description")} />
                </div>

                <div className="row2">
                    <div className="field">
                        <label htmlFor="website">Website</label>
                        <input id="website" value={form.website} onChange={set("website")} placeholder="example.org" />
                    </div>
                    <div className="field">
                        <label htmlFor="funding">Funding deployed</label>
                        <input id="funding" type="number" min="0" value={form.fundingDeployed} onChange={set("fundingDeployed")} />
                    </div>
                </div>

                <div className="form-actions">
                    <button className="btn" disabled={saving}>
                        {saving ? "Saving…" : isEdit ? "Save changes" : "Create sponsor"}
                    </button>
                    <Link to="/sponsors" className="btn ghost">Cancel</Link>
                    <span className="spacer" />
                    {isEdit && (
                        <button type="button" className="btn danger" disabled={saving} onClick={handleDelete}>
                            Delete
                        </button>
                    )}
                </div>
            </form>
        </>
    );
}
