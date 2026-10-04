import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'IN_APP' | 'SMS' | 'EMAIL'>('IN_APP');

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await api.listNotifications();
      setNotifications(data);
    } catch (err: any) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkRead = async (id: number) => {
    try {
      await api.markNotificationRead(id);
      await fetchNotifications();
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      await fetchNotifications();
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const inAppList = notifications.filter((n) => !n.channel || n.channel === 'IN_APP');
  const smsList = notifications.filter((n) => n.channel === 'SMS');
  const emailList = notifications.filter((n) => n.channel === 'EMAIL');

  return (
    <div className="container" style={{ padding: '24px 0 60px 0' }}>
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div>
          <h1 style={{ margin: '0 0 8px 0', fontSize: '24px' }}>Notifications & Statutory Dispatch Log</h1>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '14px' }}>
            Multi-channel statutory alerts, SLA breach warnings, and simulated SMS/Email dispatch audit logs.
          </p>
        </div>
        {activeTab === 'IN_APP' && inAppList.some((n) => !n.is_read) && (
          <button
            type="button"
            className="gov-btn gov-btn-secondary"
            onClick={handleMarkAllRead}
          >
            Mark All as Read
          </button>
        )}
      </div>

      {/* Simulated Notice */}
      <div className="gov-instruction-box gov-instruction-info" style={{ marginBottom: '20px' }}>
        <strong>Simulation Notice:</strong> No actual cellular SMS or external emails are transmitted. SMS and Email feeds below reflect real-time background dispatch triggers logged by the statutory event engine.
      </div>

      {/* Tabs */}
      <div className="gov-tab-strip" style={{ marginBottom: '20px' }}>
        <button
          type="button"
          className={`gov-tab ${activeTab === 'IN_APP' ? 'active' : ''}`}
          onClick={() => setActiveTab('IN_APP')}
        >
          In-App Statutory Alerts ({inAppList.filter((n) => !n.is_read).length} unread)
        </button>
        <button
          type="button"
          className={`gov-tab ${activeTab === 'SMS' ? 'active' : ''}`}
          onClick={() => setActiveTab('SMS')}
        >
          Simulated SMS Log ({smsList.length})
        </button>
        <button
          type="button"
          className={`gov-tab ${activeTab === 'EMAIL' ? 'active' : ''}`}
          onClick={() => setActiveTab('EMAIL')}
        >
          Simulated Email Log ({emailList.length})
        </button>
      </div>

      {/* Tab 1: In-App Alerts */}
      {activeTab === 'IN_APP' && (
        <div className="gov-panel">
          <div className="gov-panel-header">Urgent In-App Regulatory Alerts</div>
          <div className="gov-panel-body" style={{ padding: '16px' }}>
            {loading ? (
              <p style={{ textAlign: 'center', color: 'var(--muted)' }}>Loading alerts...</p>
            ) : inAppList.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--muted)' }}>No in-app alerts recorded.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {inAppList.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      border: '1px solid var(--border)',
                      padding: '14px',
                      backgroundColor: item.is_read ? '#FFFFFF' : 'var(--warn-bg)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span
                          className={`gov-badge ${
                            item.severity === 'DANGER'
                              ? 'gov-badge-danger'
                              : item.severity === 'WARNING'
                              ? 'gov-badge-warn'
                              : 'gov-badge-submitted'
                          }`}
                        >
                          {item.title || 'Statutory Notice'}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
                          {new Date(item.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: 'var(--text)' }}>
                        {item.message}
                      </p>
                    </div>

                    {!item.is_read && (
                      <button
                        type="button"
                        className="gov-btn gov-btn-secondary"
                        style={{ padding: '2px 8px', fontSize: '11px', flexShrink: 0 }}
                        onClick={() => handleMarkRead(item.id)}
                      >
                        Acknowledge
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Simulated SMS Log */}
      {activeTab === 'SMS' && (
        <div className="gov-panel">
          <div className="gov-panel-header">Simulated Carrier SMS Dispatch Journal (TRAI DLT Template Standard)</div>
          <div className="gov-panel-body" style={{ padding: 0 }}>
            {smsList.length === 0 ? (
              <p style={{ padding: '20px', textAlign: 'center', color: 'var(--muted)' }}>No SMS dispatches logged yet.</p>
            ) : (
              <table className="gov-table" style={{ margin: 0, fontSize: '12px' }}>
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Recipient Mobile</th>
                    <th>Sender ID</th>
                    <th>DLT SMS Text</th>
                    <th>Delivery Status</th>
                  </tr>
                </thead>
                <tbody>
                  {smsList.map((sms) => (
                    <tr key={sms.id}>
                      <td>{new Date(sms.created_at).toLocaleString()}</td>
                      <td><strong>{sms.recipient || '+91 98200 XXXXX'}</strong></td>
                      <td><span className="gov-badge gov-badge-draft">MH-GOV-UR</span></td>
                      <td style={{ maxWidth: '380px' }}>{sms.message}</td>
                      <td>
                        <span className="gov-badge gov-badge-approved">DELIVERED (SIMULATED)</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Simulated Email Log */}
      {activeTab === 'EMAIL' && (
        <div className="gov-panel">
          <div className="gov-panel-header">Simulated SMTP Email Outbox Journal</div>
          <div className="gov-panel-body" style={{ padding: 0 }}>
            {emailList.length === 0 ? (
              <p style={{ padding: '20px', textAlign: 'center', color: 'var(--muted)' }}>No Email dispatches logged yet.</p>
            ) : (
              <table className="gov-table" style={{ margin: 0, fontSize: '12px' }}>
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>To / Recipient</th>
                    <th>Subject Line</th>
                    <th>Body Preview</th>
                    <th>SMTP Gateway Status</th>
                  </tr>
                </thead>
                <tbody>
                  {emailList.map((mail) => (
                    <tr key={mail.id}>
                      <td>{new Date(mail.created_at).toLocaleString()}</td>
                      <td><strong>{mail.recipient || 'applicant@industry.maharashtra.gov'}</strong></td>
                      <td><strong>{mail.title || 'UDYOGRATH Statutory Intimation'}</strong></td>
                      <td style={{ maxWidth: '340px' }}>{mail.message}</td>
                      <td>
                        <span className="gov-badge gov-badge-approved">SMTP 250 OK (SIMULATED)</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
