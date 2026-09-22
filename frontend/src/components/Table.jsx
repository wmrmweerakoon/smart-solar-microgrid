/**
 * Reusable data Table component with loading, empty state, and action column support.
 *
 * @param {object} props
 * @param {Array<{key: string, label: string, render?: function}>} props.columns
 * @param {Array<object>} props.data
 * @param {boolean} props.loading
 * @param {string} props.emptyMessage
 * @param {string} props.emptyIcon
 */
const Table = ({
  columns = [],
  data = [],
  loading = false,
  emptyMessage = 'No data found',
  emptyIcon = '📭',
}) => {
  if (loading) {
    return (
      <div className="table-container">
        <div className="loading-container">
          <div className="spinner"></div>
          <span className="loading-text">Loading data...</span>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="table-container">
        <div className="empty-state">
          <div className="empty-state-icon">{emptyIcon}</div>
          <div className="empty-state-text">{emptyMessage}</div>
          <div className="empty-state-subtext">Try adjusting your filters or adding new records.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={row.id || index}>
              {columns.map((col) => (
                <td key={col.key}>
                  {col.render ? col.render(row) : row[col.key] ?? '—'}
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
