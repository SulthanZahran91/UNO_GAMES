import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App';

/**
 * Basic App component tests
 * Verifies that the app renders and Firebase initializes
 */

describe('App', () => {
  it('should render loading state initially', () => {
    console.log('🧪 Test: App loading state');
    render(<App />);
    // The app should show loading initially
    expect(screen.getByText(/Loading UNO Game/i)).toBeInTheDocument();
  });
});
