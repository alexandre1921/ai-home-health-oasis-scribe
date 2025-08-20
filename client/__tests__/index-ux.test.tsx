import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Home from '../pages/index';

const apiUrl = 'http://localhost:4000';
process.env.NEXT_PUBLIC_API_URL = apiUrl;

describe('Upload page - UX', () => {
  beforeEach(() => {
    // @ts-ignore
    global.fetch = jest.fn((url: string) => {
      if (url === `${apiUrl}/patients`) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            { id: 1, name: 'John Doe', dob: '1948-03-12T00:00:00.000Z' },
          ]),
        } as any);
      }
      return Promise.reject(new Error('Unknown fetch'));
    });
  });

  it('shows drag-and-drop zone and reflects selected filename after upload', async () => {
    render(<Home />);
    await waitFor(() => expect(screen.getByRole('combobox')).toBeInTheDocument());

    expect(screen.getByText(/Drag \& drop your audio here/i)).toBeInTheDocument();

    const fileInput = screen.getByLabelText(/Audio/i) as HTMLInputElement;
    const file = new File(['abc'], 'voice.mp3', { type: 'audio/mpeg' });
    await userEvent.upload(fileInput, file);

    expect(screen.getByText(/Selected: voice\.mp3/i)).toBeInTheDocument();
  });
}); 