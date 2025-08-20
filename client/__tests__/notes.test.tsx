import { render, screen, waitFor } from '@testing-library/react';
import Notes from '../pages/notes';

const apiUrl = 'http://localhost:4000';
process.env.NEXT_PUBLIC_API_URL = apiUrl;

describe('Notes list page', () => {
  beforeEach(() => {
    // @ts-ignore
    global.fetch = jest.fn((url: string) => {
      if (url === `${apiUrl}/notes`) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            { id: 1, createdAt: new Date().toISOString(), summary: 'Summary 1', patient: { id: 1, name: 'John Doe', dob: '1948-03-12T00:00:00.000Z' } },
          ]),
        } as any);
      }
      return Promise.reject(new Error('Unknown fetch'));
    });
  });

  it('renders rows and link to detail', async () => {
    render(<Notes />);
    await waitFor(() => expect(screen.getByText(/Notes/i)).toBeInTheDocument());
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Summary 1')).toBeInTheDocument();
    expect(screen.getByText('Open')).toBeInTheDocument();
  });
}); 