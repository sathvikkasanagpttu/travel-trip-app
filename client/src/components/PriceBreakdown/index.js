import './index.css'

const PriceBreakdown = ({ quote, loading, error }) => {
  if (loading) {
    return (
      <div className="price-breakdown-card" data-testid="price-breakdown-skeleton">
        <div className="price-breakdown-header">
          <span className="price-breakdown-title">Estimated Price</span>
          <span className="price-breakdown-badge">Calculating...</span>
        </div>
        <div className="price-skeleton">
          <div className="skeleton-line long" />
          <div className="skeleton-line short" />
          <div className="skeleton-line total" />
        </div>
      </div>
    )
  }

  if (error || !quote) {
    return null
  }

  const { currency = 'INR', breakdown = [], total = 0 } = quote
  const currencySymbol = currency === 'INR' ? '₹' : currency

  return (
    <div className="price-breakdown-card" data-testid="price-breakdown">
      <div className="price-breakdown-header">
        <span className="price-breakdown-title">Estimated Price</span>
        <span className="price-breakdown-badge">Live Quote</span>
      </div>

      <div className="price-breakdown-list">
        {breakdown.map((item, index) => (
          <div key={index} className="price-breakdown-row">
            <span>{item.label}</span>
            <span>
              {currencySymbol}
              {Number(item.amount).toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
        ))}
      </div>

      <div className="price-breakdown-total">
        <span>Total Estimated</span>
        <span className="price-total-amount">
          {currencySymbol}
          {Number(total).toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>
      </div>
    </div>
  )
}

export default PriceBreakdown
