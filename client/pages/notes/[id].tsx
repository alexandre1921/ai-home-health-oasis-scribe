import { useRouter } from 'next/router';
import useSWR from 'swr';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Skeleton } from '../../components/ui/skeleton';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function NoteDetail() {
  const router = useRouter();
  const { id } = router.query;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
  const { data, error } = useSWR(
    id ? `${apiUrl}/notes/${id}` : null,
    fetcher
  );

  if (error) return <div>Error loading note</div>;

  if (!data) {
    return (
      <div className="mx-auto max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Note Detail</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Skeleton className="h-4 w-2/5" />
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-3/5" />
              <Skeleton className="h-24 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const note = data;
  return (
    <div className="mx-auto max-w-3xl">
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Note Detail</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p><strong>Patient:</strong> {note.patient.name} (DOB: {new Date(note.patient.dob).toLocaleDateString()})</p>
            <p><strong>Date:</strong> {new Date(note.createdAt).toLocaleString()}</p>
            <p><strong>Summary:</strong> {note.summary}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Transcription</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap rounded bg-gray-100 p-3">{note.transcription}</pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>OASIS Section G</CardTitle>
          </CardHeader>
          <CardContent>
            <Table className="border-collapse">
              <TableHeader>
                <TableRow>
                  <TableHead className="p-2 border">Item</TableHead>
                  <TableHead className="p-2 border">Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow><TableCell className="p-2 border">M1800</TableCell><TableCell className="p-2 border">{note.oasisM1800}</TableCell></TableRow>
                <TableRow><TableCell className="p-2 border">M1810</TableCell><TableCell className="p-2 border">{note.oasisM1810}</TableCell></TableRow>
                <TableRow><TableCell className="p-2 border">M1820</TableCell><TableCell className="p-2 border">{note.oasisM1820}</TableCell></TableRow>
                <TableRow><TableCell className="p-2 border">M1830</TableCell><TableCell className="p-2 border">{note.oasisM1830}</TableCell></TableRow>
                <TableRow><TableCell className="p-2 border">M1840</TableCell><TableCell className="p-2 border">{note.oasisM1840}</TableCell></TableRow>
                <TableRow><TableCell className="p-2 border">M1850</TableCell><TableCell className="p-2 border">{note.oasisM1850}</TableCell></TableRow>
                <TableRow><TableCell className="p-2 border">M1860</TableCell><TableCell className="p-2 border">{note.oasisM1860}</TableCell></TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Audio</CardTitle>
          </CardHeader>
          <CardContent>
            {note.audioUrl ? (
              <audio
                key={note.audioUrl}
                controls
                crossOrigin="anonymous"
                src={note.audioUrl}
                className="mt-2 w-full"
              />
            ) : (
              <p className="text-sm text-gray-600">Audio unavailable for this note.</p>
            )}
            <div className="mt-4">
              <Link href="/notes"><span className="text-blue-600 underline">Back to notes</span></Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}