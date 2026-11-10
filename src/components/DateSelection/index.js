import { useState } from 'react'
import './index.css'

const DateSelection = ({
  startDate,
  endDate,
  onChangeStartDate,
  onChangeEndDate,
  onPreviousStep,
  onNextStep,
}) => {
  const [errors, setErrors] = useState({
    startDate: '',
    endDate: '',
  })

  const handleSubmit = e => {
    e.preventDefault()
    const newErrors = {
      startDate: '',
      endDate: '',
    }
    let isValid = true

    if (!startDate) {
      newErrors.startDate = 'Select start date'
      isValid = false
    }

    if (!endDate) {
      newErrors.endDate = 'Select end date'
      isValid = false
    }

    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      if (end < start) {
        newErrors.endDate = 'The end date cannot be less than the start date'
        isValid = false
      }
    }

    setErrors(newErrors)

    if (isValid) {
      onNextStep()
    }
  }

  const handleStartDateChange = e => {
    onChangeStartDate(e.target.value)
    if (errors.startDate) {
      setErrors(prev => ({ ...prev, startDate: '' }))
    }
  }

  const handleEndDateChange = e => {
    onChangeEndDate(e.target.value)
    if (errors.endDate) {
      setErrors(prev => ({ ...prev, endDate: '' }))
    }
  }

  return (
    <div className="step-card">
      <form onSubmit={handleSubmit} className="step-form" noValidate>
        <div className="form-group">
          <label htmlFor="startDate" className="form-label">
            Start Date
          </label>
          <input
            id="startDate"
            type="date"
            className={`form-input ${errors.startDate ? 'input-error' : ''}`}
            value={startDate}
            onChange={handleStartDateChange}
          />
          {errors.startDate && (
            <p className="error-message">{errors.startDate}</p>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="endDate" className="form-label">
            End Date
          </label>
          <input
            id="endDate"
            type="date"
            className={`form-input ${errors.endDate ? 'input-error' : ''}`}
            value={endDate}
            onChange={handleEndDateChange}
          />
          {errors.endDate && <p className="error-message">{errors.endDate}</p>}
        </div>

        <div className="form-actions dual-actions">
          <button
            type="button"
            className="secondary-btn"
            onClick={onPreviousStep}
          >
            Previous
          </button>
          <button type="submit" className="primary-btn">
            Next
          </button>
        </div>
      </form>
    </div>
  )
}

export default DateSelection
