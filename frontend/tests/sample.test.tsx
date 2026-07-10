import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import Home from '@/app/page';

test('renders system welcome message in Page component', () => {
  render(<Home />);
  const titleElement = screen.getByRole('heading', {
    name: /GrowEasy CSV CRM Importer/i,
  });
  expect(titleElement).toBeInTheDocument();
});
