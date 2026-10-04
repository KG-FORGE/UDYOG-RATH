import React from 'react';

interface ApprovalItem {
  id: string;
  name: string;
  authority: string;
  parallel_group: string;
  prerequisites: string[];
  sla_days: number;
}

export const SvgDependencyGraph: React.FC<{ approvals: ApprovalItem[] }> = ({ approvals }) => {
  // Group approvals by parallel group left-to-right
  const groups: Record<string, ApprovalItem[]> = {};
  approvals.forEach((app) => {
    const g = app.parallel_group || 'General Clearances';
    if (!groups[g]) groups[g] = [];
    groups[g].push(app);
  });

  const groupKeys = Object.keys(groups);
  const columnWidth = 240;
  const cardHeight = 64;
  const cardGap = 16;
  const paddingX = 30;
  const paddingY = 40;

  const maxItemsInGroup = Math.max(...groupKeys.map((k) => groups[k].length), 1);
  const svgWidth = Math.max(900, groupKeys.length * columnWidth + paddingX * 2);
  const svgHeight = Math.max(480, maxItemsInGroup * (cardHeight + cardGap) + paddingY * 2 + 60);

  // Position map for drawing directed connecting lines
  const positions: Record<string, { x: number; y: number; w: number; h: number }> = {};

  groupKeys.forEach((groupName, colIdx) => {
    const colX = paddingX + colIdx * columnWidth;
    groups[groupName].forEach((app, rowIdx) => {
      const rowY = paddingY + 50 + rowIdx * (cardHeight + cardGap);
      positions[app.id] = { x: colX, y: rowY, w: 200, h: cardHeight };
    });
  });

  return (
    <div style={{ width: '100%', overflowX: 'auto', backgroundColor: '#FFFFFF', border: '1px solid var(--border)', padding: '16px' }}>
      <div style={{ marginBottom: '12px', fontSize: '0.85rem', color: 'var(--muted)', display: 'flex', justifyContent: 'space-between' }}>
        <span><strong>Directed Statutory Workflow:</strong> Approvals in each column execute in parallel; arrows denote legal prerequisites.</span>
        <span><span style={{ color: 'var(--blue)' }}>■</span> Stage Columns &rarr; Pre-requisite Connectors</span>
      </div>

      <svg width={svgWidth} height={svgHeight} style={{ display: 'block', backgroundColor: '#F8FAFC' }}>
        <defs>
          <marker
            id="arrowhead"
            markerWidth="8"
            markerHeight="6"
            refX="7"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 8 3, 0 6" fill="#1F4E8C" />
          </marker>
        </defs>

        {/* Group Column Background Banners */}
        {groupKeys.map((groupName, colIdx) => {
          const colX = paddingX + colIdx * columnWidth;
          return (
            <g key={groupName}>
              <rect
                x={colX - 10}
                y={15}
                width={columnWidth - 20}
                height={svgHeight - 30}
                fill="#F1F5F9"
                stroke="#CBD5E1"
                strokeWidth="1"
                rx="2"
              />
              <rect
                x={colX - 10}
                y={15}
                width={columnWidth - 20}
                height={32}
                fill="#17375E"
                rx="2"
              />
              <text
                x={colX + (columnWidth - 20) / 2 - 10}
                y={36}
                fill="#FFFFFF"
                fontSize="11"
                fontWeight="bold"
                textAnchor="middle"
              >
                {groupName}
              </text>
            </g>
          );
        })}

        {/* Directed Prerequisite Connecting Arrows */}
        {approvals.map((app) => {
          const targetPos = positions[app.id];
          if (!targetPos) return null;

          return (app.prerequisites || []).map((preId) => {
            const prePos = positions[preId];
            if (!prePos) return null;

            const startX = prePos.x + prePos.w;
            const startY = prePos.y + prePos.h / 2;
            const endX = targetPos.x;
            const endY = targetPos.y + targetPos.h / 2;

            const midX = (startX + endX) / 2;

            return (
              <path
                key={`${preId}->${app.id}`}
                d={`M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`}
                fill="none"
                stroke="#1F4E8C"
                strokeWidth="1.5"
                strokeDasharray="4 2"
                markerEnd="url(#arrowhead)"
              />
            );
          });
        })}

        {/* Nodes / Approval Cards */}
        {approvals.map((app) => {
          const pos = positions[app.id];
          if (!pos) return null;

          return (
            <g key={app.id}>
              {/* Card Body */}
              <rect
                x={pos.x}
                y={pos.y}
                width={pos.w}
                height={pos.h}
                fill="#FFFFFF"
                stroke="#17375E"
                strokeWidth="1"
                rx="2"
              />
              {/* Left Stripe */}
              <rect
                x={pos.x}
                y={pos.y}
                width={4}
                height={pos.h}
                fill="var(--saffron)"
                rx="1"
              />
              {/* Approval Name */}
              <text
                x={pos.x + 10}
                y={pos.y + 20}
                fill="#17375E"
                fontSize="11"
                fontWeight="bold"
              >
                {app.name.length > 24 ? app.name.slice(0, 24) + '...' : app.name}
              </text>
              {/* Authority */}
              <text
                x={pos.x + 10}
                y={pos.y + 36}
                fill="#4A5568"
                fontSize="9"
              >
                {app.authority.length > 28 ? app.authority.slice(0, 28) + '...' : app.authority}
              </text>
              {/* SLA Days Badge */}
              <rect
                x={pos.x + 10}
                y={pos.y + 43}
                width={70}
                height={14}
                fill="#E8F0FA"
                stroke="#B8D2F2"
                rx="2"
              />
              <text
                x={pos.x + 15}
                y={pos.y + 53}
                fill="#1F4E8C"
                fontSize="8"
                fontWeight="bold"
              >
                SLA: {app.sla_days} Days
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
