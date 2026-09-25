import { Inbox } from 'lucide-react';

/**
 * Reusable data Table component with loading skeleton/spinner,
 * empty state, horizontal scroll handling, and responsive action column support.
 *
 * @param {object} props
 * @param {Array<{key: string, label: string, render?: function}>} props.columns
 * @param {Array<object>} props.data
 * @param {boolean} props.loading
 * @param {string} props.emptyMessage
 * @param {string} props.emptySubtext
 * @param {React.ReactNode} props.emptyIcon
 * @param {React.ReactNode} props.emptyAction
 */
const Table = ({
  columns = [],
  data = [],
  loading = false,
  emptyMessage = 'No data found',
  emptySubtext = 'Try adjusting your search criteria or filters.',
  emptyIcon = <Inbox size={44} strokeWidth={1.5} color="var(--text-secondary)" />,
  emptyAction = null,
}) => {
  if (loading) {
    return (
      <div className="table-container">
        <div className="loading-container">
          <div className="spinner"></div>
          <span className="loading-text">Loading records...</span>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="table-container">
        <div className="empty-state">
          <div className="empty-state-icon">{emptyIcon}</div>
          <div className="empty-state-text">{emptyMessage}</div>
          {emptySubtext && <div className="empty-state-subtext">{emptySubtext}</div>}
          {emptyAction && <div style={{ marginTop: 16 }}>{emptyAction}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="table-container" tabIndex={0} role="region" aria-label="Data Table">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} scope="col">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={row.id || row.nic || index}>
              {columns.map((col) => (
                <td key={col.key}>
                  {col.render ? col.render(row) : (row[col.key] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
