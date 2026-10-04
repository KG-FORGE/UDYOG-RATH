import React from 'react';

export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const cleanClass = `status-${status.replace(/\s+/g, '_')}`;
  return (
    <span className={`status-badge ${cleanClass}`}>
      {status}
    </span>
  );
};
