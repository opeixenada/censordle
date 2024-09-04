import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Censordle title', () => {
  render(<App />);
  const censordleElement = screen.getByText("Censordle");
  expect(censordleElement).toBeInTheDocument();
});
