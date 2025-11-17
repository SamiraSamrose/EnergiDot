//### Path: `frontend/src/__tests__/Dashboard.test.tsx`

// frontend/src/__tests__/Dashboard.test.tsx
// Frontend component tests

import { render, screen } from '@testing-library/react';
import Dashboard from '../pages/Dashboard';
import { PolkadotProvider } from '../context/PolkadotContext';
import { ApiProvider } from '../context/ApiContext';

describe('Dashboard Component', () => {
  it('renders dashboard title', () => {
    render(
      <PolkadotProvider>
        <ApiProvider>
          <Dashboard />
        </ApiProvider>
      </PolkadotProvider>
    );

    expect(screen.getByText(/Energy Grid Dashboard/i)).toBeInTheDocument();
  });

  it('displays wallet connection prompt when not connected', () => {
    render(
      <PolkadotProvider>
        <ApiProvider>
          <Dashboard />
        </ApiProvider>
      </PolkadotProvider>
    );

    expect(screen.getByText(/Connect your wallet/i)).toBeInTheDocument();
  });
});
