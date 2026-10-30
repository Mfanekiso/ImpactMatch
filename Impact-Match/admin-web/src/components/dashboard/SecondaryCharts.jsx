import React, { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const toDate = (value) => value?.toDate?.() ?? (value ? new Date(value) : null);
const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#06b6d4", "#f97316"];

function Card({ title, children }) {
    return <section className="chart-card"><h2>{title}</h2>{children}</section>;
}

export default function SecondaryCharts({ projects = [] }) {
    const projectData = useMemo(() => {
        const months = Array.from({ length: 7 }, (_, index) => {
            const date = new Date();
            date.setDate(1);
            date.setMonth(date.getMonth() - (6 - index));
            return {
                date,
                key: `${date.getFullYear()}-${date.getMonth()}`,
                name: date.toLocaleDateString("en-ZA", { month: "short" }),
                projects: 0,
                raised: 0,
            };
        });
        projects.forEach((project) => {
            const date = toDate(project.createdAt);
            if (!date || Number.isNaN(date.getTime())) return;
            const month = months.find((item) => item.key === `${date.getFullYear()}-${date.getMonth()}`);
            if (month) {
                month.projects += 1;
                month.raised += Number(project.raisedAmount) || 0;
            }
        });
        return months;
    }, [projects]);

    const causeData = useMemo(() => {
        const totals = new Map();
        projects.forEach((project) => {
            const cause = String(project.cause ?? project.category ?? "Other").trim() || "Other";
            totals.set(cause, (totals.get(cause) || 0) + (Number(project.raisedAmount) || 0));
        });
        return [...totals.entries()]
            .map(([name, value]) => ({ name, value }))
            .filter((item) => item.value > 0)
            .sort((a, b) => b.value - a.value)
            .slice(0, 6);
    }, [projects]);

    const hasProjects = projectData.some((item) => item.projects > 0);
    const hasCauses = causeData.length > 0;

    return (
        <div className="dashboard-chart-grid secondary-chart-grid">
            <Card title="Projects created · last 7 months">
                {hasProjects ? <div className="chart-plot"><ResponsiveContainer width="100%" height="100%">
                    <BarChart data={projectData} barSize={24}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf0f3" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#888" }} />
                        <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#888" }} />
                        <Tooltip />
                        <Bar dataKey="projects" name="Projects" fill="#3b82f6" radius={[5, 5, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer></div> : <div className="chart-empty">No projects created in this period</div>}
            </Card>
            <Card title="Funding raised by cause">
                {hasCauses ? <div className="cause-chart-content">
                    <div className="cause-donut">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={causeData} dataKey="value" nameKey="name" innerRadius={54} outerRadius={78} paddingAngle={2}>
                                    {causeData.map((entry, index) => <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />)}
                                </Pie>
                                <Tooltip formatter={(value) => [`R${Number(value).toLocaleString("en-ZA")}`, "Raised"]} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="cause-legend">
                        {causeData.map((item, index) => <div className="cause-legend-row" key={item.name}>
                            <span className="cause-label"><i style={{ backgroundColor: COLORS[index % COLORS.length] }} />{item.name}</span>
                            <strong>R{item.value.toLocaleString("en-ZA")}</strong>
                        </div>)}
                    </div>
                </div> : <div className="chart-empty">No project cause data recorded</div>}
            </Card>
        </div>
    );
}
