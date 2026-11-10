import { SUCCESS_IMG_URL } from '../../constants'
import './index.css'

const Confirmed = ({ onBookNewTrip }) => {
  return (
    <div className="confirmed-container">
      <img
        src={SUCCESS_IMG_URL}
        alt="success"
        className="confirmed-success-img"
      />
      <h1 className="confirmed-heading">Awesome!</h1>
      <h2 className="confirmed-subheading">Confirmed</h2>
      <p className="confirmed-message">Your trip has been booked successfully</p>
      <button
        type="button"
        className="primary-btn book-new-trip-btn"
        onClick={onBookNewTrip}
      >
        Book New Trip
      </button>
    </div>
  )
}

export default Confirmed
