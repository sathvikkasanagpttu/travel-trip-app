import { SUCCESS_IMG_URL } from '../../constants'
import './index.css'

const Stepper = ({ stepsList, activeStepId, isConfirmed = false }) => {
  const currentStepIndex = stepsList.findIndex(
    step => step.stepId === activeStepId
  )

  return (
    <nav className="stepper-nav" aria-label="Booking Steps">
      <ul className="stepper-list">
        {stepsList.map((step, index) => {
          let stepState = 'upcoming'

          if (isConfirmed) {
            stepState = 'completed'
          } else if (index < currentStepIndex) {
            stepState = 'completed'
          } else if (index === currentStepIndex) {
            stepState = 'active'
          } else {
            stepState = 'upcoming'
          }

          const isCompleted = stepState === 'completed'
          const isActive = stepState === 'active'

          return (
            <li
              key={step.stepId}
              className={`stepper-item ${stepState}`}
              aria-current={isActive ? 'step' : undefined}
            >
              {isCompleted ? (
                <img
                  src={SUCCESS_IMG_URL}
                  alt={step.displayText}
                  className="step-completed-icon"
                />
              ) : (
                <span className={`step-number ${stepState}-number`}>
                  {index + 1}
                </span>
              )}
              <span className={`step-text ${stepState}-text`}>
                {step.displayText}
              </span>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export default Stepper
