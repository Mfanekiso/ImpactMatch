import React from "react";

const LABELS = { approved: "Approved", pending: "Pending", rejected: "Rejected" };

export default function StatusBadge({ status }) {
    const key = LABELS[status] ? status : "pending";
    return <span className={`badge ${key}`}>{LABELS[key]}</span>;
}
