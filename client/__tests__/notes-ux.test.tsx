import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Notes from '../pages/notes';

const apiUrl = 'http://localhost:4000';
process.env.NEXT_PUBLIC_API_URL = apiUrl;

describe('Notes list - UX search', () => {
  beforeEach(() => {
    // @ts-ignore
    global.fetch = jest.fn((url: string) => {
      if (url === `${apiUrl}/notes`) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            { id: 1, createdAt: new Date().toISOString(), summary: 'Summary 1', patient: { id: 1, name: 'Alice Doe', dob: '1948-03-12T00:00:00.000Z' } },
            { id: 2, createdAt: new Date().toISOString(), summary: 'Respiratory assessment', patient: { id: 2, name: 'Bob Smith', dob: '1955-10-08T00:00:00.000Z' } },
          ]),
        } as any);
      }
      return Promise.reject(new Error('Unknown fetch'));
    });
  });

  it('filters notes by patient or summary', async () => {
    render(<Notes />);
    await waitFor(() => expect(screen.getByText(/Notes/i)).toBeInTheDocument());

    const search = screen.getByPlaceholderText(/Search by patient or summary/i);
    await userEvent.type(search, 'respiratory');

    expect(screen.queryByText('Alice Doe')).not.toBeInTheDocument();
    expect(screen.getByText('Bob Smith')).toBeInTheDocument();
  });
}); 