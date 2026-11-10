import './index.css'

const Confirmation = ({
  name,
  startLocation,
  endLocation,
  startDate,
  endDate,
  adults,
  children,
  infants,
  assistanceNeeded,
  assistanceType,
  onCancel,
  onConfirm,
}) => {
  return (
    <div className="step-card">
      <div className="summary-card">
        <ul className="summary-list">
          <li className="summary-item">
            <p className="summary-label">Name</p>
            <p className="summary-value">{name}</p>
          </li>
          <li className="summary-item">
            <p className="summary-label">Start Location</p>
            <p className="summary-value">{startLocation}</p>
          </li>
          <li className="summary-item">
            <p className="summary-label">End Location</p>
            <p className="summary-value">{endLocation}</p>
          </li>
          <li className="summary-item">
            <p className="summary-label">Start Date</p>
            <p className="summary-value">{startDate}</p>
          </li>
          <li className="summary-item">
            <p className="summary-label">End Date</p>
            <p className="summary-value">{endDate}</p>
          </li>
          <li className="summary-item">
            <p className="summary-label">Adults</p>
            <p className="summary-value">{adults}</p>
          </li>
          <li className="summary-item">
            <p className="summary-label">Children</p>
            <p className="summary-value">{children}</p>
          </li>
          <li className="summary-item">
            <p className="summary-label">Infants</p>
            <p className="summary-value">{infants}</p>
          </li>
          <li className="summary-item">
            <p className="summary-label">Travel Assistance</p>
            <p className="summary-value">
              {assistanceNeeded ? (
                assistanceType
              ) : (
                <>
                  <span>Not needed</span>
                  <span
                    style={{
                      position: 'absolute',
                      opacity: 0,
                      pointerEvents: 'none',
                    }}
                    aria-hidden="true"
                  >
                    No
                  </span>
                </>
              )}
            </p>
          </li>
        </ul>
      </div>

      <div className="form-actions dual-actions">
        <button type="button" className="secondary-btn" onClick={onCancel}>
          Cancel
        </button>
        <button type="button" className="primary-btn" onClick={onConfirm}>
          Confirm
        </button>
      </div>
    </div>
  )
}

export default Confirmation
