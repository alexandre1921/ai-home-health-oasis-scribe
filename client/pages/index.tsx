import { useEffect, useRef, useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Select } from '../components/ui/select';
import { Alert } from '../components/ui/alert';

interface Patient {
  id: number;
  name: string;
  dob: string;
}

export default function Home() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientId, setPatientId] = useState<number | undefined>(undefined);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';

  useEffect(() => {
    async function fetchPatients() {
      const res = await fetch(`${apiUrl}/patients`);
      const data = await res.json();
      setPatients(data);
      if (data.length > 0) setPatientId(data[0].id);
    }
    fetchPatients().catch(console.error);
  }, [apiUrl]);

  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }

  function onDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setAudioFile(e.dataTransfer.files[0]);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!audioFile || !patientId) return;
    const formData = new FormData();
    formData.append('patientId', String(patientId));
    formData.append('audio', audioFile);
    setMessageType('info');
    setMessage('Uploading…');
    try {
      const res = await fetch(`${apiUrl}/notes`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Upload failed');
      }
      setMessageType('success');
      setMessage('Note created successfully');
      setAudioFile(null);
      if (inputRef.current) inputRef.current.value = '';
    } catch (err: any) {
      setMessageType('error');
      setMessage(err.message);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight gradient-text">Create a new note</h1>
        <p className="text-sm text-gray-600">Attach an audio file and we will extract an OASIS-ready summary.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>New OASIS Note</CardTitle>
          <CardDescription>Upload a patient voice note to automatically generate an OASIS summary.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label className="mb-1 block" htmlFor="patient">Patient</Label>
              <Select
                id="patient"
                aria-label="Patient"
                value={patientId}
                onChange={(e) => setPatientId(Number(e.target.value))}
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (DOB: {p.dob})
                  </option>
                ))}
              </Select>
            </div>

            <div
              onDragOver={onDragOver}
              onDragEnter={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              className={`rounded-lg border-2 border-dashed px-4 py-8 text-center ${dragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 bg-gray-50'}`}
            >
              <div className="mb-3 text-sm font-medium text-gray-700">Drag & drop your audio here</div>
              <div className="text-xs text-gray-500 mb-4">or choose a file from your computer</div>
              <div className="inline-flex items-center gap-2">
                <Button type="button" onClick={() => inputRef.current?.click()}>Browse file</Button>
                {audioFile && (
                  <span className="text-xs text-gray-700">Selected: {audioFile.name}</span>
                )}
              </div>
              <div className="sr-only" aria-live="polite">{audioFile ? `Selected ${audioFile.name}` : ''}</div>
            </div>

            <div>
              <Label htmlFor="audio" className="mb-1 block">Audio</Label>
              <Input
                ref={inputRef}
                id="audio"
                type="file"
                accept="audio/*"
                onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
              />
              <div className="mt-1 text-xs text-gray-500">Accepted: mp3, wav, m4a • Max 50MB</div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">We store audio securely and remove it after processing.</span>
              <Button type="submit" disabled={!audioFile || !patientId}>
                Submit
              </Button>
            </div>
          </form>
          {message && (
            <div className="mt-4">
              <Alert variant={messageType === 'success' ? 'success' : messageType === 'error' ? 'error' : 'info'}>
                {message}
              </Alert>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <a href="/notes" className="text-sm text-blue-600 underline">
            View notes
          </a>
        </CardFooter>
      </Card>
    </div>
  );
}