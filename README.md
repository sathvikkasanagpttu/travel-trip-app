# Travel Trip Application

A 5-step multi-step booking wizard built with React using functional components and the `useState` hook.

## Features

- **Multi-Step Wizard**:
  1. **Your Details**: Captures name, start location, and end location with full validation.
  2. **Date Selection**: Captures start date and end date with date ordering validation.
  3. **Guests**: Interactive counters for Adults (min 1), Children (min 0), and Infants (min 0).
  4. **Travel Assistance**: Opt-in assistance toggle with dropdown options (Wheelchair, Medical Support, Senior Citizen Support, Other).
  5. **Confirmation**: Comprehensive summary of all entered details with Cancel (reset) and Confirm actions.
  6. **Confirmed Screen**: Success confirmation with "Book New Trip" reset action.
- **Dynamic Stepper**: Indicates upcoming, active (highlighted), and completed steps (with checkmark icons).
- **State Persistence**: Preserves all form values and selections when navigating backward and forward.
- **Accessibility & Strict Testing Compliance**: Accessible label associations, exact error strings, and semantic HTML.

## Tech Stack

- **React** (Functional Components + Hooks)
- **Vite**
- **Plain CSS**
- **Vitest & React Testing Library**

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Development Server
```bash
npm run dev
```

### 3. Run Tests
```bash
npm test
```

### 4. Build for Production
```bash
npm run build
```
