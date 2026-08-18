import React from 'react';

export default function App(): React.JSX.Element {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        fontFamily: 'system-ui, sans-serif',
        backgroundColor: '#f8fafc',
        color: '#0f172a',
      }}
    >
      <h1 style={{ color: '#0f766e', marginBottom: '8px' }}>BiyaEase Admin Dashboard</h1>
      <p style={{ fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
        Phase 0: Project Foundation
      </p>
      <p style={{ color: '#64748b', fontSize: '14px' }}>
        Transit Management & Data Operations Interface
      </p>
    </div>
  );
}
