import { useState } from 'react'
import './index.css'

const YourDetails = ({
  name,
  startLocation,
  endLocation,
  onChangeName,
  onChangeStartLocation,
  onChangeEndLocation,
  onNextStep,
}) => {
  const [errors, setErrors] = useState({
    name: '',
    startLocation: '',
    endLocation: '',
  })

  const handleSubmit = e => {
    e.preventDefault()
    const newErrors = {
      name: '',
      startLocation: '',
      endLocation: '',
    }
    let isValid = true

    if (!name || !name.trim()) {
      newErrors.name = 'Enter your name'
      isValid = false
    }

    if (!startLocation || !startLocation.trim()) {
      newErrors.startLocation = 'Enter your start location'
      isValid = false
    }

    if (!endLocation || !endLocation.trim()) {
      newErrors.endLocation = 'Enter your end location'
      isValid = false
    }

    setErrors(newErrors)

    if (isValid) {
      onNextStep()
    }
  }

  const handleNameChange = e => {
    onChangeName(e.target.value)
    if (errors.name) {
      setErrors(prev => ({ ...prev, name: '' }))
    }
  }

  const handleStartLocationChange = e => {
    onChangeStartLocation(e.target.value)
    if (errors.startLocation) {
      setErrors(prev => ({ ...prev, startLocation: '' }))
    }
  }

  const handleEndLocationChange = e => {
    onChangeEndLocation(e.target.value)
    if (errors.endLocation) {
      setErrors(prev => ({ ...prev, endLocation: '' }))
    }
  }

  return (
    <div className="step-card">
      <form onSubmit={handleSubmit} className="step-form" noValidate>
        <div className="form-group">
          <label htmlFor="name" className="form-label">
            Name
          </label>
          <input
            id="name"
            type="text"
            className={`form-input ${errors.name ? 'input-error' : ''}`}
            placeholder="Enter name"
            value={name}
            onChange={handleNameChange}
          />
          {errors.name && <p className="error-message">{errors.name}</p>}
        </div>

        <div className="form-group">
          <label htmlFor="startLocation" className="form-label">
            Start Location
          </label>
          <input
            id="startLocation"
            type="text"
            className={`form-input ${errors.startLocation ? 'input-error' : ''}`}
            placeholder="Enter start location"
            value={startLocation}
            onChange={handleStartLocationChange}
          />
          {errors.startLocation && (
            <p className="error-message">{errors.startLocation}</p>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="endLocation" className="form-label">
            End Location
          </label>
          <input
            id="endLocation"
            type="text"
            className={`form-input ${errors.endLocation ? 'input-error' : ''}`}
            placeholder="Enter end location"
            value={endLocation}
            onChange={handleEndLocationChange}
          />
          {errors.endLocation && (
            <p className="error-message">{errors.endLocation}</p>
          )}
        </div>

        <div className="form-actions single-action">
          <button type="submit" className="primary-btn">
            Next
          </button>
        </div>
      </form>
    </div>
  )
}

export default YourDetails
