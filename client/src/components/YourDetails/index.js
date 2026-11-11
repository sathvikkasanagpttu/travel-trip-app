import { useState } from 'react'
import AutocompleteInput from '../AutocompleteInput'
import RouteMap from '../RouteMap'
import './index.css'

const YourDetails = ({
  name,
  startLocation,
  endLocation,
  startLat,
  startLng,
  endLat,
  endLng,
  onChangeName,
  onChangeStartLocation,
  onChangeEndLocation,
  onSelectStartPlace,
  onSelectEndPlace,
  onNextStep,
}) => {
  const [errors, setErrors] = useState({
    name: '',
    startLocation: '',
    endLocation: '',
  })

  const handleSubmit = (e) => {
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

  const handleNameChange = (e) => {
    const val = typeof e === 'string' ? e : e?.target?.value ?? ''
    onChangeName(val)
    if (errors.name) {
      setErrors((prev) => ({ ...prev, name: '' }))
    }
  }

  const handleStartLocationChange = (valOrEvent) => {
    const val = typeof valOrEvent === 'string' ? valOrEvent : valOrEvent?.target?.value ?? ''
    onChangeStartLocation(val)
    if (errors.startLocation) {
      setErrors((prev) => ({ ...prev, startLocation: '' }))
    }
  }

  const handleEndLocationChange = (valOrEvent) => {
    const val = typeof valOrEvent === 'string' ? valOrEvent : valOrEvent?.target?.value ?? ''
    onChangeEndLocation(val)
    if (errors.endLocation) {
      setErrors((prev) => ({ ...prev, endLocation: '' }))
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
          <AutocompleteInput
            id="startLocation"
            label="Start Location"
            placeholder="Enter start location"
            value={startLocation}
            hasError={Boolean(errors.startLocation)}
            onChange={handleStartLocationChange}
            onSelectPlace={(place) => {
              if (onSelectStartPlace) {
                onSelectStartPlace(place)
              }
            }}
          />
          {errors.startLocation && (
            <p className="error-message">{errors.startLocation}</p>
          )}
        </div>

        <div className="form-group">
          <AutocompleteInput
            id="endLocation"
            label="End Location"
            placeholder="Enter end location"
            value={endLocation}
            hasError={Boolean(errors.endLocation)}
            onChange={handleEndLocationChange}
            onSelectPlace={(place) => {
              if (onSelectEndPlace) {
                onSelectEndPlace(place)
              }
            }}
          />
          {errors.endLocation && (
            <p className="error-message">{errors.endLocation}</p>
          )}
        </div>

        {startLat && startLng && endLat && endLng && (
          <RouteMap
            startLat={startLat}
            startLng={startLng}
            endLat={endLat}
            endLng={endLng}
            startLabel={startLocation || 'Start'}
            endLabel={endLocation || 'Destination'}
          />
        )}

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
