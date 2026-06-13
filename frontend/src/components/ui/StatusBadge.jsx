const STATUS_MAP = {
  /* Order statuses */
  DRAFT:            { label: 'Draft',       cls: 'bg-gray-700 text-gray-300' },
  SENT_TO_KITCHEN:  { label: 'In Kitchen',  cls: 'bg-blue-500/20 text-blue-400 border border-blue-500/30' },
  PAID:             { label: 'Paid',        cls: 'bg-green-500/20 text-green-400 border border-green-500/30' },
  CANCELLED:        { label: 'Cancelled',   cls: 'bg-red-500/20 text-red-400 border border-red-500/30' },

  /* Session statuses */
  OPEN:             { label: 'Open',        cls: 'bg-green-500/20 text-green-400 border border-green-500/30' },
  CLOSED:           { label: 'Closed',      cls: 'bg-gray-700 text-gray-400' },

  /* KDS stages */
  TO_COOK:          { label: 'To Cook',     cls: 'bg-red-500/20 text-red-400 border border-red-500/30' },
  PREPARING:        { label: 'Preparing',   cls: 'bg-amber-500/20 text-amber-400 border border-amber-500/30' },
  COMPLETED:        { label: 'Completed',   cls: 'bg-green-500/20 text-green-400 border border-green-500/30' },

  /* User / generic */
  ACTIVE:           { label: 'Active',      cls: 'bg-green-500/20 text-green-400 border border-green-500/30' },
  ARCHIVED:         { label: 'Archived',    cls: 'bg-gray-700 text-gray-500' },
  ENABLED:          { label: 'Enabled',     cls: 'bg-green-500/20 text-green-400 border border-green-500/30' },
  DISABLED:         { label: 'Disabled',    cls: 'bg-gray-700 text-gray-500' },
};

export default function StatusBadge({ status, className = '' }) {
  const key = (status || '').toString().toUpperCase().replace(/\s+/g, '_');
  const meta = STATUS_MAP[key] || { label: status || '—', cls: 'bg-gray-700 text-gray-400' };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${meta.cls} ${className}`}>
      {meta.label}
    </span>
  );
}
