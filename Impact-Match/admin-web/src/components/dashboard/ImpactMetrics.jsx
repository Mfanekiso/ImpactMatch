import React from 'react';
import StatCard from '../StatCard';
import { formatCurrencyShort } from '../../utils';

export default function ImpactMetrics({ stats }) {
    // Note: Since you don't have "Revenue" or "Projects" in your DB yet, 
    // we use your users/pending stats and mock Revenue for the layout.
    return (
        <div className="stats">
            <StatCard 
                value={stats.total} 
                label="Total Sponsors" 
                bg="var(--primary-bg)" 
                color="var(--primary)" 
            />
            <StatCard 
                value={stats.users} 
                label="Total Users" 
                bg="var(--danger-bg)" 
                color="var(--danger)" 
            />
            <StatCard 
                value={formatCurrencyShort(stats.funding)} 
                label="Amount Sponsored" 
                bg="var(--success-bg)" 
                color="var(--success)" 
            />
            <StatCard 
                value="$12.5k" // Placeholder until you add Revenue to DB
                label="Platform Revenue" 
                bg="var(--warning-bg)" 
                color="var(--warning)" 
            />
        </div>
    );
}