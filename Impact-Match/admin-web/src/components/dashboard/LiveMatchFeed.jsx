import React from 'react';

// Static placeholder data until you create a "matches" collection in Firestore
const matches = [
  { id: 1, sponsor: "TechCorp Inc.", ngo: "Water for All", amount: "$15,000", time: "2 hours ago" },
  { id: 2, sponsor: "Sarah J.", ngo: "EduBuild South Africa", amount: "$500", time: "5 hours ago" },
  { id: 3, sponsor: "Global Fund", ngo: "Green Earth Initiative", amount: "$42,000", time: "1 day ago" },
];

export default function LiveMatchFeed() {
  return (
    <div className="card" style={{ marginTop: 0, height: '100%' }}>
      <h2>Live Impact Matches</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
        {matches.map((match) => (
          <div key={match.id} style={{ padding: '15px', background: 'var(--primary-bg)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '14px', color: '#333' }}>
                <strong>{match.sponsor}</strong> funded <strong>{match.ngo}</strong>
              </div>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>{match.time}</div>
            </div>
            <div style={{ fontWeight: 'bold', color: 'var(--success)' }}>
              {match.amount}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}