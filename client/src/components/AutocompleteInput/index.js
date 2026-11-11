import { useState, useEffect, useRef } from 'react'
import { searchPlaces } from '../../api/places'
import './index.css'

const AutocompleteInput = ({
  id,
  label,
  value,
  placeholder,
  hasError,
  onChange,
  onSelectPlace,
}) => {
  const [suggestions, setSuggestions] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [loading, setLoading] = useState(false)

  const containerRef = useRef(null)
  const debounceTimerRef = useRef(null)

  // Debounced search on input value changes
  useEffect(() => {
    if (!value || value.trim().length < 3) {
      setSuggestions([])
      setIsOpen(false)
      setActiveIndex(-1)
      return
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const data = await searchPlaces(value)
        if (data?.places && data.places.length > 0) {
          setSuggestions(data.places)
          setIsOpen(true)
          setActiveIndex(-1)
        } else {
          setSuggestions([])
          setIsOpen(false)
        }
      } catch {
        setSuggestions([])
        setIsOpen(false)
      } finally {
        setLoading(false)
      }
    }, 400)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [value])

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
        setActiveIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleSelect = (place) => {
    onChange(place.label)
    if (onSelectPlace) {
      onSelectPlace(place)
    }
    setIsOpen(false)
    setActiveIndex(-1)
  }

  const handleKeyDown = (e) => {
    if (!isOpen || suggestions.length === 0) {
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1))
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0 && activeIndex < suggestions.length) {
        e.preventDefault()
        handleSelect(suggestions[activeIndex])
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setIsOpen(false)
      setActiveIndex(-1)
    }
  }

  const activeOptionId =
    activeIndex >= 0 ? `${id}-option-${activeIndex}` : undefined

  return (
    <div className="autocomplete-container" ref={containerRef}>
      <label htmlFor={id} className="form-label">
        {label}
      </label>
      <div className="autocomplete-input-wrapper">
        <input
          id={id}
          type="text"
          className={`form-input ${hasError ? 'input-error' : ''}`}
          placeholder={placeholder}
          value={value}
          onChange={(e) => {
            onChange(e.target.value)
          }}
          onKeyDown={handleKeyDown}
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          aria-controls={`${id}-suggestions-list`}
          aria-activedescendant={activeOptionId}
          autoComplete="off"
        />
        {loading && <span className="autocomplete-spinner" aria-hidden="true" />}
      </div>

      {isOpen && suggestions.length > 0 && (
        <ul
          id={`${id}-suggestions-list`}
          className="autocomplete-dropdown"
          role="listbox"
          aria-label={`${label} suggestions`}
        >
          {suggestions.map((place, idx) => {
            const isSelected = idx === activeIndex
            return (
              <li
                key={`${place.lat}-${place.lng}-${idx}`}
                id={`${id}-option-${idx}`}
                role="option"
                aria-selected={isSelected}
                className={`autocomplete-option ${isSelected ? 'option-active' : ''}`}
                onClick={() => handleSelect(place)}
                onMouseEnter={() => setActiveIndex(idx)}
              >
                <span className="place-icon" aria-hidden="true">📍</span>
                <span className="place-label">{place.label}</span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

export default AutocompleteInput
