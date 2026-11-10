import { useState } from 'react'
import Header from '../Header'
import Stepper from '../Stepper'
import YourDetails from '../YourDetails'
import DateSelection from '../DateSelection'
import Guests from '../Guests'
import TravelAssistance from '../TravelAssistance'
import Confirmation from '../Confirmation'
import Confirmed from '../Confirmed'
import { stepsList } from '../../constants'
import './index.css'

const TravelTrip = () => {
  const [activeStepId, setActiveStepId] = useState(stepsList[0].stepId)
  const [name, setName] = useState('')
  const [startLocation, setStartLocation] = useState('')
  const [endLocation, setEndLocation] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [adults, setAdults] = useState(1)
  const [children, setChildren] = useState(0)
  const [infants, setInfants] = useState(0)
  const [assistanceNeeded, setAssistanceNeeded] = useState(false)
  const [assistanceType, setAssistanceType] = useState('Wheelchair')
  const [isConfirmed, setIsConfirmed] = useState(false)

  const handleResetAll = () => {
    setName('')
    setStartLocation('')
    setEndLocation('')
    setStartDate('')
    setEndDate('')
    setAdults(1)
    setChildren(0)
    setInfants(0)
    setAssistanceNeeded(false)
    setAssistanceType('Wheelchair')
    setIsConfirmed(false)
    setActiveStepId(stepsList[0].stepId)
  }

  const handleConfirm = () => {
    setIsConfirmed(true)
  }

  const renderActiveStepContent = () => {
    if (isConfirmed) {
      return <Confirmed onBookNewTrip={handleResetAll} />
    }

    switch (activeStepId) {
      case 'YOUR_DETAILS':
        return (
          <YourDetails
            name={name}
            startLocation={startLocation}
            endLocation={endLocation}
            onChangeName={setName}
            onChangeStartLocation={setStartLocation}
            onChangeEndLocation={setEndLocation}
            onNextStep={() => setActiveStepId('DATE_SELECTION')}
          />
        )
      case 'DATE_SELECTION':
        return (
          <DateSelection
            startDate={startDate}
            endDate={endDate}
            onChangeStartDate={setStartDate}
            onChangeEndDate={setEndDate}
            onPreviousStep={() => setActiveStepId('YOUR_DETAILS')}
            onNextStep={() => setActiveStepId('GUESTS')}
          />
        )
      case 'GUESTS':
        return (
          <Guests
            adults={adults}
            children={children}
            infants={infants}
            onChangeAdults={setAdults}
            onChangeChildren={setChildren}
            onChangeInfants={setInfants}
            onPreviousStep={() => setActiveStepId('DATE_SELECTION')}
            onNextStep={() => setActiveStepId('TRAVEL_ASSISTANCE')}
          />
        )
      case 'TRAVEL_ASSISTANCE':
        return (
          <TravelAssistance
            assistanceNeeded={assistanceNeeded}
            assistanceType={assistanceType}
            onChangeAssistanceNeeded={setAssistanceNeeded}
            onChangeAssistanceType={setAssistanceType}
            onPreviousStep={() => setActiveStepId('GUESTS')}
            onNextStep={() => setActiveStepId('CONFIRMATION')}
          />
        )
      case 'CONFIRMATION':
        return (
          <Confirmation
            name={name}
            startLocation={startLocation}
            endLocation={endLocation}
            startDate={startDate}
            endDate={endDate}
            adults={adults}
            children={children}
            infants={infants}
            assistanceNeeded={assistanceNeeded}
            assistanceType={assistanceType}
            onCancel={handleResetAll}
            onConfirm={handleConfirm}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="travel-trip-app">
      <Header />
      <main className="main-content">
        <div className="travel-trip-card">
          <aside className="stepper-sidebar">
            <Stepper
              stepsList={stepsList}
              activeStepId={activeStepId}
              isConfirmed={isConfirmed}
            />
          </aside>
          <section className="step-content">
            {renderActiveStepContent()}
          </section>
        </div>
      </main>
    </div>
  )
}

export default TravelTrip
