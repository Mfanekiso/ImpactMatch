import React from "react";

export default function StatCard({ value, label, bg, color }) {
    return (
        <div className="stat" style={{ background: bg }}>
            <div className="num" style={{ color }}>{value}</div>
            <div className="lbl">{label}</div>
        </div>
    );
}
