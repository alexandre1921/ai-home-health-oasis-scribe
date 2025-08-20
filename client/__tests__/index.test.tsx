import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Home from '../pages/index';

const apiUrl = 'http://localhost:4000';
process.env.NEXT_PUBLIC_API_URL = apiUrl;

describe('Upload page', () => {
  beforeEach(() => {
    // @ts-ignore
    global.fetch = jest.fn((url: string, opts?: any) => {
      if (url === `${apiUrl}/patients`) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            { id: 1, name: 'John Doe', dob: '1948-03-12T00:00:00.000Z' },
            { id: 2, name: 'Jane Smith', dob: '1955-10-08T00:00:00.000Z' },
          ]),
        } as any);
      }
      if (url === `${apiUrl}/notes` && opts?.method === 'POST') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ id: 1 }) } as any);
      }
      return Promise.reject(new Error('Unknown fetch'));
    });
  });

  it('renders patients and allows file upload + submit', async () => {
    render(<Home />);
    await waitFor(() => expect(screen.getByRole('combobox')).toBeInTheDocument());

    const fileInput = screen.getByLabelText(/Audio/i) as HTMLInputElement;
    const file = new File(['abc'], 'voice.mp3', { type: 'audio/mpeg' });
    await userEvent.upload(fileInput, file);
    expect(fileInput.files?.[0]).toBe(file);

    const submit = screen.getByRole('button', { name: /Submit/i });
    expect(submit).toBeEnabled();

    await userEvent.click(submit);
    await waitFor(() => screen.getByText(/Note created successfully/i));
  });
}); 