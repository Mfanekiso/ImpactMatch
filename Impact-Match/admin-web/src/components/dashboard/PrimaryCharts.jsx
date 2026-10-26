import React, { useMemo } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const toDate = (value) => value?.toDate?.() ?? (value ? new Date(value) : null);
const monthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
const monthLabel = (date) => date.toLocaleDateString("en-ZA", { month: "short" });

function Card({ title, children }) {
    return <section className="chart-card"><h2>{title}</h2>{children}</section>;
}

export default function PrimaryCharts({ users = [], projects = [] }) {
    const activityData = useMemo(() => {
        const days = Array.from({ length: 7 }, (_, index) => {
            const date = new Date();
            date.setHours(0, 0, 0, 0);
            date.setDate(date.getDate() - (6 - index));
            const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
            return { date, key, name: date.toLocaleDateString("en-ZA", { weekday: "short" }), users: 0 };
        });
        users.forEach((user) => {
            const date = toDate(user.lastActiveAt ?? user.lastLoginAt ?? user.lastSeenAt);
            if (!date || Number.isNaN(date.getTime())) return;
            const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
            const day = days.find((item) => item.key === key);
            if (day) day.users += 1;
        });
        return days;
    }, [users]);

    const fundingData = useMemo(() => {
        const months = Array.from({ length: 6 }, (_, index) => {
            const date = new Date();
            date.setDate(1);
            date.setMonth(date.getMonth() - (5 - index));
            return { name: monthLabel(date), key: monthKey(date), amount: 0 };
        });
        projects.forEach((project) => {
            const date = toDate(project.updatedAt ?? project.createdAt);
            if (!date || Number.isNaN(date.getTime())) return;
            const month = months.find((item) => item.key === monthKey(date));
            if (month) month.amount += Number(project.raisedAmount) || 0;
        });
        return months;
    }, [projects]);

    const hasActivity = activityData.some((item) => item.users > 0);
    const hasFunding = fundingData.some((item) => item.amount > 0);

    return (
        <div className="dashboard-chart-grid primary-chart-grid">
            <Card title="Active users · last 7 days">
                {hasActivity ? <div className="chart-plot"><ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={activityData}>
                        <defs><linearGradient id="activeUsersFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.18} /><stop offset="95%" stopColor="#3b82f6" stopOpacity={0} /></linearGradient></defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf0f3" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#888" }} />
                        <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#888" }} />
                        <Tooltip />
                        <Area type="monotone" dataKey="users" name="Active users" stroke="#3b82f6" strokeWidth={2.5} fill="url(#activeUsersFill)" />
                    </AreaChart>
                </ResponsiveContainer></div> : <div className="chart-empty">No activity recorded for this period</div>}
            </Card>
            <Card title="Funding raised · last 6 months">
                {hasFunding ? <div className="chart-plot"><ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={fundingData}>
                        <defs><linearGradient id="raisedFundingFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.18} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} /></linearGradient></defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf0f3" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#888" }} />
                        <YAxis tickFormatter={(value) => `R${value >= 1000 ? `${Math.round(value / 1000)}k` : value}`} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#888" }} />
                        <Tooltip formatter={(value) => [`R${Number(value).toLocaleString("en-ZA")}`, "Raised"]} />
                        <Area type="monotone" dataKey="amount" name="Raised" stroke="#10b981" strokeWidth={2.5} fill="url(#raisedFundingFill)" />
                    </AreaChart>
                </ResponsiveContainer></div> : <div className="chart-empty">No funding recorded for this period</div>}
            </Card>
        </div>
    );
}
