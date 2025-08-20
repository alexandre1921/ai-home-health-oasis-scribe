import { render, screen, waitFor } from '@testing-library/react';
import router from 'next/router';
import NoteDetail from '../pages/notes/[id]';

// Router mock provided by moduleNameMapper; no explicit jest.mock needed

const apiUrl = 'http://localhost:4000';
process.env.NEXT_PUBLIC_API_URL = apiUrl;

describe('Note detail page', () => {
  beforeEach(() => {
    // Ensure router query contains id
    (router as any).query = { id: '1' };
    // @ts-ignore
    global.fetch = jest.fn((url: string) => {
      if (url === `${apiUrl}/notes/1`) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            id: 1,
            createdAt: new Date().toISOString(),
            summary: 'Mock summary',
            transcription: 'Mock transcription',
            audioUrl: 'http://localhost/audio.mp3',
            oasisM1800: '1', oasisM1810: '2', oasisM1820: '3', oasisM1830: '4', oasisM1840: '5', oasisM1850: '6', oasisM1860: '0',
            patient: { id: 1, name: 'John Doe', dob: '1948-03-12T00:00:00.000Z' },
          }),
        } as any);
      }
      return Promise.reject(new Error('Unknown fetch'));
    });
  });

  it('renders patient info, summary, transcription, OASIS and audio', async () => {
    render(<NoteDetail />);
    await waitFor(() => expect(screen.getByText(/Note Detail/i)).toBeInTheDocument());
    expect(screen.getByText(/Patient:/i)).toBeInTheDocument();
    expect(screen.getByText(/Mock summary/i)).toBeInTheDocument();
    expect(screen.getByText(/Mock transcription/i)).toBeInTheDocument();
    // 7 rows for M1800..M1860 (plus header)
    expect(screen.getAllByRole('row').length).toBeGreaterThanOrEqual(8);
    expect(document.querySelector('audio')).toBeTruthy();
  });
}); 