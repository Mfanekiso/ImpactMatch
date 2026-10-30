import React from "react";
export default function StatCard({ title, value }) {
    return (
        <div style={{
            background: "#fff",
            padding: "20px",
            borderRadius: "12px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            border: "1px solid #f0f0f0"
        }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "14px", color: "#666", fontWeight: "500" }}>{title}</span>
            </div>
            <div style={{ fontSize: "28px", fontWeight: "700", color: "#111" }}>
                {value}
            </div>
        </div>
    );
}
