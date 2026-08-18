import { useState, useEffect } from 'react';
import { adminApiService, SystemMetrics, AdminReport, AdminUser } from './services/adminApiService';

export function App() {
  const [token, setToken] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [health, setHealth] = useState<{ status: string; uptime: number; database: string }>({
    status: 'checking...',
    uptime: 0,
    database: 'checking...',
  });
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'overview' | 'reports' | 'users'>('overview');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadData = async (authToken: string) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const [healthRes, metricsRes, reportsRes, usersRes] = await Promise.all([
        adminApiService.fetchHealth(),
        adminApiService.fetchMetrics(authToken),
        adminApiService.fetchReports(authToken, statusFilter),
        adminApiService.fetchUsers(authToken),
      ]);

      setHealth(healthRes);

      if (metricsRes.success && metricsRes.data) {
        setMetrics(metricsRes.data);
        setIsAuthenticated(true);
      } else {
        setErrorMsg(metricsRes.error || 'Invalid admin authentication token.');
        setIsAuthenticated(false);
      }

      if (reportsRes.success && reportsRes.data) {
        setReports(reportsRes.data);
      }

      if (usersRes.success && usersRes.data) {
        setUsers(usersRes.data);
      }
    } catch (_err) {
      setErrorMsg('Failed to connect to backend server at http://localhost:5000');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    adminApiService.fetchHealth().then(setHealth);
  }, []);

  const handleModeration = async (reportId: string, action: 'approve' | 'dismiss' | 'delete') => {
    if (!token) return;
    const res = await adminApiService.moderateReport(token, reportId, action);
    if (res.success) {
      loadData(token);
    } else {
      alert(res.error || 'Failed to moderate report');
    }
  };

  return (
    <div style={styles.container}>
      {/* Top Navigation Bar */}
      <header style={styles.header}>
        <div style={styles.brandBox}>
          <div style={styles.logoBadge}>🚌</div>
          <div>
            <h1 style={styles.brandTitle}>BiyaEase Admin</h1>
            <p style={styles.brandSub}>Commuter Systems & Data Moderation Platform</p>
          </div>
        </div>

        <div style={styles.healthProbe}>
          <span
            style={{
              ...styles.statusDot,
              backgroundColor: health.database === 'connected' ? '#10B981' : '#EF4444',
            }}
          />
          <span style={styles.healthText}>
            DB: <strong>{health.database}</strong> | Status: <strong>{health.status}</strong>
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main style={styles.main}>
        {!isAuthenticated ? (
          <div style={styles.loginCard}>
            <h2 style={styles.loginTitle}>🔐 System Admin Access</h2>
            <p style={styles.loginSub}>
              Enter your admin Bearer JWT token or test credentials to access system analytics and moderation tools.
            </p>

            {errorMsg && <div style={styles.errorBox}>⚠️ {errorMsg}</div>}

            <div style={styles.inputGroup}>
              <label style={styles.label}>ADMIN JWT AUTHENTICATION TOKEN</label>
              <input
                type="text"
                style={styles.input}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6Ik..."
              />
            </div>

            <button style={styles.loginBtn} onClick={() => loadData(token)} disabled={loading}>
              {loading ? 'Authenticating...' : 'Sign In to Dashboard'}
            </button>
          </div>
        ) : (
          <div>
            {/* Navigation Tabs */}
            <div style={styles.tabBar}>
              <button
                style={{ ...styles.tabBtn, ...(activeTab === 'overview' ? styles.activeTabBtn : {}) }}
                onClick={() => setActiveTab('overview')}
              >
                📊 Executive Overview
              </button>
              <button
                style={{ ...styles.tabBtn, ...(activeTab === 'reports' ? styles.activeTabBtn : {}) }}
                onClick={() => setActiveTab('reports')}
              >
                📢 Crowd Reports ({reports.length})
              </button>
              <button
                style={{ ...styles.tabBtn, ...(activeTab === 'users' ? styles.activeTabBtn : {}) }}
                onClick={() => setActiveTab('users')}
              >
                👥 User Directory ({users.length})
              </button>

              <button style={styles.refreshBtn} onClick={() => loadData(token)}>
                🔄 Refresh Live Data
              </button>
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && metrics && (
              <div>
                <div style={styles.metricsGrid}>
                  <div style={styles.metricCard}>
                    <div style={styles.metricIcon}>👥</div>
                    <div>
                      <div style={styles.metricValue}>{metrics.totalUsers}</div>
                      <div style={styles.metricLabel}>Total Registered Users</div>
                    </div>
                  </div>

                  <div style={styles.metricCard}>
                    <div style={styles.metricIcon}>🚨</div>
                    <div>
                      <div style={{ ...styles.metricValue, color: '#EF4444' }}>{metrics.activeReports}</div>
                      <div style={styles.metricLabel}>Active Crowd Incidents</div>
                    </div>
                  </div>

                  <div style={styles.metricCard}>
                    <div style={styles.metricIcon}>⭐</div>
                    <div>
                      <div style={styles.metricValue}>{metrics.totalSavedPlaces}</div>
                      <div style={styles.metricLabel}>Cloud Saved Places</div>
                    </div>
                  </div>

                  <div style={styles.metricCard}>
                    <div style={styles.metricIcon}>🚌</div>
                    <div>
                      <div style={styles.metricValue}>{metrics.totalGtfsRoutes}</div>
                      <div style={styles.metricLabel}>GTFS Transit Routes</div>
                    </div>
                  </div>

                  <div style={styles.metricCard}>
                    <div style={styles.metricIcon}>🚏</div>
                    <div>
                      <div style={styles.metricValue}>{metrics.totalGtfsStops}</div>
                      <div style={styles.metricLabel}>GTFS Transit Stops</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Reports Moderation Tab */}
            {(activeTab === 'reports' || activeTab === 'overview') && (
              <div style={styles.sectionCard}>
                <div style={styles.sectionHeader}>
                  <h3>📢 Community Crowd Reports Moderation</h3>
                  <div style={styles.filterRow}>
                    <label style={styles.labelInline}>Filter Status:</label>
                    <select
                      style={styles.select}
                      value={statusFilter}
                      onChange={(e) => {
                        setStatusFilter(e.target.value);
                        loadData(token);
                      }}
                    >
                      <option value="all">All Reports</option>
                      <option value="active">Active Only</option>

                      <option value="dismissed">Dismissed</option>
                    </select>
                  </div>
                </div>

                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Category</th>
                      <th style={styles.th}>Title & Details</th>
                      <th style={styles.th}>Author</th>
                      <th style={styles.th}>Confirmed</th>
                      <th style={styles.th}>Status</th>
                      <th style={styles.th}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={styles.emptyTd}>
                          No community reports found.
                        </td>
                      </tr>
                    ) : (
                      reports.map((r) => (
                        <tr key={r.id} style={styles.tr}>
                          <td style={styles.td}>
                            <span style={styles.typeTag}>{r.type}</span>
                          </td>
                          <td style={styles.td}>
                            <strong>{r.title}</strong>
                            {r.description && <div style={styles.subText}>{r.description}</div>}
                            <div style={styles.subText}>
                              {r.latitude.toFixed(4)}, {r.longitude.toFixed(4)}
                            </div>
                          </td>
                          <td style={styles.td}>
                            {r.author_name || 'Commuter'}
                            <div style={styles.subText}>{r.author_email}</div>
                          </td>
                          <td style={styles.td}>
                            <span style={styles.confirmBadge}>👍 {r.confirmed_count}</span>
                          </td>
                          <td style={styles.td}>
                            <span
                              style={{
                                ...styles.statusBadge,
                                backgroundColor:
                                  r.status === 'active'
                                    ? '#D1FAE5'
                                    : r.status === 'dismissed'
                                      ? '#FEF3C7'
                                      : '#FEE2E2',
                                color:
                                  r.status === 'active'
                                    ? '#065F46'
                                    : r.status === 'dismissed'
                                      ? '#92400E'
                                      : '#991B1B',
                              }}
                            >
                              {r.status.toUpperCase()}
                            </span>
                          </td>
                          <td style={styles.td}>
                            <div style={styles.actionGroup}>
                              {r.status !== 'active' && (
                                <button
                                  style={{ ...styles.actionBtn, backgroundColor: '#10B981' }}
                                  onClick={() => handleModeration(r.id, 'approve')}
                                >
                                  Approve
                                </button>
                              )}
                              {r.status === 'active' && (
                                <button
                                  style={{ ...styles.actionBtn, backgroundColor: '#F59E0B' }}
                                  onClick={() => handleModeration(r.id, 'dismiss')}
                                >
                                  Dismiss
                                </button>
                              )}
                              <button
                                style={{ ...styles.actionBtn, backgroundColor: '#EF4444' }}
                                onClick={() => handleModeration(r.id, 'delete')}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Users Directory Tab */}
            {(activeTab === 'users' || activeTab === 'overview') && (
              <div style={styles.sectionCard}>
                <div style={styles.sectionHeader}>
                  <h3>👥 Registered User Accounts Directory</h3>
                </div>

                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Display Name & Email</th>
                      <th style={styles.th}>Role</th>
                      <th style={styles.th}>Joined Date</th>
                      <th style={styles.th}>Saved Places</th>
                      <th style={styles.th}>Reports Posted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} style={styles.tr}>
                        <td style={styles.td}>
                          <strong>{u.displayName}</strong>
                          <div style={styles.subText}>{u.email}</div>
                        </td>
                        <td style={styles.td}>
                          <span
                            style={{
                              ...styles.statusBadge,
                              backgroundColor: u.isAdmin ? '#E0E7FF' : '#F3F4F6',
                              color: u.isAdmin ? '#3730A3' : '#374151',
                            }}
                          >
                            {u.isAdmin ? '👑 ADMIN' : 'COMMUTER'}
                          </span>
                        </td>
                        <td style={styles.td}>
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td style={styles.td}>{u.savedPlacesCount} places</td>
                        <td style={styles.td}>{u.reportsCount} reports</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#0F172A',
    color: '#F8FAFC',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 2rem',
    backgroundColor: '#1E293B',
    borderBottom: '1px solid #334155',
  },
  brandBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  logoBadge: {
    fontSize: '2rem',
    backgroundColor: '#0284C7',
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    margin: 0,
    fontSize: '1.25rem',
    fontWeight: 800,
    letterSpacing: '-0.025em',
  },
  brandSub: {
    margin: 0,
    fontSize: '0.75rem',
    color: '#94A3B8',
  },
  healthProbe: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: '#0F172A',
    padding: '0.5rem 1rem',
    borderRadius: '9999px',
    border: '1px solid #334155',
  },
  statusDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
  },
  healthText: {
    fontSize: '0.75rem',
    color: '#CBD5E1',
  },
  main: {
    padding: '2rem',
    maxWidth: '1280px',
    margin: '0 auto',
  },
  loginCard: {
    backgroundColor: '#1E293B',
    padding: '2.5rem',
    borderRadius: '16px',
    border: '1px solid #334155',
    maxWidth: '480px',
    margin: '3rem auto',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
  },
  loginTitle: {
    marginTop: 0,
    marginBottom: '0.5rem',
  },
  loginSub: {
    fontSize: '0.875rem',
    color: '#94A3B8',
    marginBottom: '1.5rem',
    lineHeight: 1.5,
  },
  errorBox: {
    backgroundColor: '#7F1D1D',
    color: '#FECACA',
    padding: '0.75rem',
    borderRadius: '8px',
    fontSize: '0.875rem',
    marginBottom: '1rem',
  },
  inputGroup: {
    marginBottom: '1.5rem',
  },
  label: {
    display: 'block',
    fontSize: '0.75rem',
    fontWeight: 700,
    color: '#94A3B8',
    marginBottom: '0.5rem',
  },
  input: {
    width: '100%',
    padding: '0.75rem 1rem',
    backgroundColor: '#0F172A',
    border: '1.5px solid #334155',
    borderRadius: '8px',
    color: '#F8FAFC',
    fontSize: '0.875rem',
    boxSizing: 'border-box',
  },
  loginBtn: {
    width: '100%',
    padding: '0.875rem',
    backgroundColor: '#0284C7',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    fontWeight: 700,
    fontSize: '0.875rem',
    cursor: 'pointer',
  },
  tabBar: {
    display: 'flex',
    gap: '0.75rem',
    marginBottom: '1.5rem',
    alignItems: 'center',
  },
  tabBtn: {
    padding: '0.625rem 1.25rem',
    backgroundColor: '#1E293B',
    color: '#94A3B8',
    border: '1px solid #334155',
    borderRadius: '8px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  activeTabBtn: {
    backgroundColor: '#0284C7',
    color: '#FFFFFF',
    borderColor: '#0284C7',
  },
  refreshBtn: {
    marginLeft: 'auto',
    padding: '0.625rem 1rem',
    backgroundColor: '#334155',
    color: '#F8FAFC',
    border: 'none',
    borderRadius: '8px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '1rem',
    marginBottom: '2rem',
  },
  metricCard: {
    backgroundColor: '#1E293B',
    border: '1px solid #334155',
    borderRadius: '12px',
    padding: '1.25rem',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  metricIcon: {
    fontSize: '1.75rem',
    backgroundColor: '#0F172A',
    width: '48px',
    height: '48px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricValue: {
    fontSize: '1.5rem',
    fontWeight: 800,
    color: '#F8FAFC',
  },
  metricLabel: {
    fontSize: '0.75rem',
    color: '#94A3B8',
    marginTop: '0.25rem',
  },
  sectionCard: {
    backgroundColor: '#1E293B',
    border: '1px solid #334155',
    borderRadius: '12px',
    padding: '1.5rem',
    marginBottom: '2rem',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
  },
  filterRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  labelInline: {
    fontSize: '0.75rem',
    color: '#94A3B8',
  },
  select: {
    backgroundColor: '#0F172A',
    color: '#F8FAFC',
    border: '1px solid #334155',
    borderRadius: '6px',
    padding: '0.375rem 0.75rem',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    textAlign: 'left',
    padding: '0.75rem 1rem',
    fontSize: '0.75rem',
    fontWeight: 700,
    color: '#94A3B8',
    borderBottom: '1px solid #334155',
    textTransform: 'uppercase',
  },
  tr: {
    borderBottom: '1px solid #334155',
  },
  td: {
    padding: '0.875rem 1rem',
    fontSize: '0.875rem',
  },
  emptyTd: {
    textAlign: 'center',
    padding: '2rem',
    color: '#94A3B8',
  },
  subText: {
    fontSize: '0.75rem',
    color: '#94A3B8',
    marginTop: '0.25rem',
  },
  typeTag: {
    backgroundColor: '#0F172A',
    padding: '0.25rem 0.5rem',
    borderRadius: '4px',
    fontSize: '0.75rem',
    fontWeight: 700,
    color: '#38BDF8',
    border: '1px solid #0284C7',
  },
  confirmBadge: {
    backgroundColor: '#065F46',
    color: '#A7F3D0',
    padding: '0.25rem 0.5rem',
    borderRadius: '9999px',
    fontSize: '0.75rem',
    fontWeight: 700,
  },
  statusBadge: {
    padding: '0.25rem 0.625rem',
    borderRadius: '9999px',
    fontSize: '0.75rem',
    fontWeight: 800,
  },
  actionGroup: {
    display: 'flex',
    gap: '0.5rem',
  },
  actionBtn: {
    border: 'none',
    color: '#FFFFFF',
    padding: '0.375rem 0.625rem',
    borderRadius: '6px',
    fontSize: '0.75rem',
    fontWeight: 700,
    cursor: 'pointer',
  },
};
