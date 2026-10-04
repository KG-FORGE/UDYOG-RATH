import React from 'react';

interface TimelineGroup {
  group_name: string;
  approvals_count: number;
  approval_names: string[];
  max_days: number;
  items: { id: string; name: string; sla_days: number; authority: string }[];
}

interface TimelineComparisonProps {
  data: {
    sequential_total_days: number;
    parallel_total_days: number;
    days_saved: number;
    saving_percentage: number;
    groups: TimelineGroup[];
  };
}

export const ParallelVsSequentialBar: React.FC<TimelineComparisonProps> = ({ data }) => {
  const { sequential_total_days, parallel_total_days, days_saved, saving_percentage, groups } = data;

  const maxScaleDays = Math.max(sequential_total_days, 1);

  return (
    <div style={{ backgroundColor: '#FFFFFF', border: '1px solid var(--border)', padding: '20px', marginBottom: '20px' }}>
      <h3 style={{ fontSize: '1.15rem', color: 'var(--navy)', marginBottom: '4px' }}>
        Statutory Approval Timeline: Parallel Orchestration vs Sequential Processing
      </h3>
      <p style={{ fontSize: '0.86rem', color: 'var(--muted)', marginBottom: '20px' }}>
        Under the Maharashtra Single Window Facilitation Framework, inter-departmental clearances in the same parallel group execute simultaneously, drastically shortening total gestation duration.
      </p>

      {/* Summary Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        <div style={{ border: '1px solid var(--border)', padding: '12px', backgroundColor: '#F8FAFC' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 600 }}>
            Sequential Cumulative Duration
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--danger)', marginTop: '4px' }}>
            {sequential_total_days} Days
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
            If processed serially across each department
          </div>
        </div>

        <div style={{ border: '1px solid var(--blue)', padding: '12px', backgroundColor: 'var(--info-bg)' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--blue)', textTransform: 'uppercase', fontWeight: 700 }}>
            UDYOGRATH Parallel Critical Path
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--navy)', marginTop: '4px' }}>
            {parallel_total_days} Days
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--blue)' }}>
            Statutory turnaround with parallel dispatch
          </div>
        </div>

        <div style={{ border: '1px solid var(--green)', padding: '12px', backgroundColor: '#F0FDF4' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--success)', textTransform: 'uppercase', fontWeight: 700 }}>
            Gestation Days Saved
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--success)', marginTop: '4px' }}>
            {days_saved} Days ({saving_percentage}%)
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--success)' }}>
            Statutory time saved for industrial unit
          </div>
        </div>
      </div>

      {/* High-Level Comparison Horizontal Bars */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ marginBottom: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
            <span>Sequential Traditional Path</span>
            <span style={{ color: 'var(--danger)' }}>{sequential_total_days} Statutory Days</span>
          </div>
          <div style={{ height: '26px', backgroundColor: '#E2E8F0', borderRadius: 2, overflow: 'hidden' }}>
            <div
              style={{
                width: '100%',
                height: '100%',
                backgroundColor: '#94A3B8',
                display: 'flex',
                alignItems: 'center',
                paddingLeft: '10px',
                color: '#FFFFFF',
                fontSize: '0.75rem',
                fontWeight: 700
              }}
            >
              Linear Department-by-Department Handover
            </div>
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
            <span>UDYOGRATH Parallel Workflows</span>
            <span style={{ color: 'var(--success)' }}>{parallel_total_days} Statutory Days (Saved {days_saved} Days)</span>
          </div>
          <div style={{ height: '26px', backgroundColor: '#E2E8F0', borderRadius: 2, overflow: 'hidden', position: 'relative' }}>
            <div
              style={{
                width: `${Math.min(100, (parallel_total_days / maxScaleDays) * 100)}%`,
                height: '100%',
                backgroundColor: 'var(--navy)',
                display: 'flex',
                alignItems: 'center',
                paddingLeft: '10px',
                color: '#FFFFFF',
                fontSize: '0.75rem',
                fontWeight: 700
              }}
            >
              Parallel Critical Path ({parallel_total_days} Days)
            </div>
          </div>
        </div>
      </div>

      {/* Group Critical Path Breakdown */}
      <h4 style={{ fontSize: '0.95rem', color: 'var(--navy)', borderBottom: '1px solid var(--border)', paddingBottom: '6px', marginBottom: '12px' }}>
        Parallel Group Timelines Breakdown (Critical Path Contribution)
      </h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {groups.map((g, idx) => (
          <div key={idx} style={{ border: '1px solid var(--border)', padding: '10px 14px', backgroundColor: '#F8FAFC' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <div>
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--navy)' }}>
                  {g.group_name}
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--muted)', marginLeft: '8px' }}>
                  ({g.approvals_count} approvals running in parallel)
                </span>
              </div>
              <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--blue)' }}>
                Critical Path: {g.max_days} Days
              </span>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {g.items.map((it) => (
                <span
                  key={it.id}
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid var(--border)',
                    padding: '2px 8px',
                    fontSize: '0.78rem',
                    color: 'var(--text)'
                  }}
                >
                  {it.name} ({it.sla_days}d)
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
