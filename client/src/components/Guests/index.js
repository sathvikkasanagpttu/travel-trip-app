import './index.css'

const Guests = ({
  adults,
  children,
  infants,
  onChangeAdults,
  onChangeChildren,
  onChangeInfants,
  onPreviousStep,
  onNextStep,
}) => {
  const onDecrementAdults = () => {
    if (adults > 1) {
      onChangeAdults(adults - 1)
    }
  }

  const onIncrementAdults = () => {
    onChangeAdults(adults + 1)
  }

  const onDecrementChildren = () => {
    if (children > 0) {
      onChangeChildren(children - 1)
    }
  }

  const onIncrementChildren = () => {
    onChangeChildren(children + 1)
  }

  const onDecrementInfants = () => {
    if (infants > 0) {
      onChangeInfants(infants - 1)
    }
  }

  const onIncrementInfants = () => {
    onChangeInfants(infants + 1)
  }

  return (
    <div className="step-card">
      <div className="guests-list">
        <div className="guest-row">
          <div className="guest-info">
            <p className="guest-type">Adults</p>
            <p className="guest-desc">Age 13 or above</p>
          </div>
          <div className="counter-controls">
            <button
              type="button"
              className="counter-btn"
              onClick={onDecrementAdults}
              disabled={adults <= 1}
              aria-label="Decrease adults"
            >
              -
            </button>
            <p className="counter-value" data-testid="adults-count">
              {adults}
            </p>
            <button
              type="button"
              className="counter-btn"
              onClick={onIncrementAdults}
              aria-label="Increase adults"
            >
              +
            </button>
          </div>
        </div>

        <div className="guest-row">
          <div className="guest-info">
            <p className="guest-type">Children</p>
            <p className="guest-desc">Age 2-12</p>
          </div>
          <div className="counter-controls">
            <button
              type="button"
              className="counter-btn"
              onClick={onDecrementChildren}
              disabled={children <= 0}
              aria-label="Decrease children"
            >
              -
            </button>
            <p className="counter-value" data-testid="children-count">
              {children}
            </p>
            <button
              type="button"
              className="counter-btn"
              onClick={onIncrementChildren}
              aria-label="Increase children"
            >
              +
            </button>
          </div>
        </div>

        <div className="guest-row">
          <div className="guest-info">
            <p className="guest-type">Infants</p>
            <p className="guest-desc">Under 2</p>
          </div>
          <div className="counter-controls">
            <button
              type="button"
              className="counter-btn"
              onClick={onDecrementInfants}
              disabled={infants <= 0}
              aria-label="Decrease infants"
            >
              -
            </button>
            <p className="counter-value" data-testid="infants-count">
              {infants}
            </p>
            <button
              type="button"
              className="counter-btn"
              onClick={onIncrementInfants}
              aria-label="Increase infants"
            >
              +
            </button>
          </div>
        </div>
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

export default Guests
