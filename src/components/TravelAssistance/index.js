import { travelAssistanceList } from '../../constants'
import './index.css'

const TravelAssistance = ({
  assistanceNeeded,
  assistanceType,
  onChangeAssistanceNeeded,
  onChangeAssistanceType,
  onPreviousStep,
  onNextStep,
}) => {
  const handleCheckboxChange = e => {
    onChangeAssistanceNeeded(e.target.checked)
  }

  const handleSelectChange = e => {
    onChangeAssistanceType(e.target.value)
  }

  return (
    <div className="step-card">
      <div className="assistance-container">
        <div className="checkbox-group">
          <input
            type="checkbox"
            id="travelAssistance"
            className="checkbox-input"
            checked={assistanceNeeded}
            onChange={handleCheckboxChange}
          />
          <label htmlFor="travelAssistance" className="checkbox-label">
            Travel Assistance Needed
          </label>
        </div>

        {assistanceNeeded && (
          <div className="form-group select-group">
            <label htmlFor="travelAssistanceSelect" className="form-label">
              Travel Assistance
            </label>
            <select
              id="travelAssistanceSelect"
              className="form-select"
              value={assistanceType}
              onChange={handleSelectChange}
            >
              {travelAssistanceList.map(option => (
                <option key={option.value} value={option.value}>
                  {option.displayText}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="form-actions dual-actions">
        <button
          type="button"
          className="secondary-btn"
          onClick={onPreviousStep}
        >
          Previous
        </button>
        <button type="button" className="primary-btn" onClick={onNextStep}>
          Next
        </button>
      </div>
    </div>
  )
}

export default TravelAssistance
