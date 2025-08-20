import useSWR from 'swr';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';
import { Input } from '../components/ui/input';
import { useMemo, useState } from 'react';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function Notes() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
  const { data, error } = useSWR(apiUrl ? `${apiUrl}/notes` : null, fetcher);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = query.toLowerCase();
    return data.filter((n: any) =>
      n.patient?.name?.toLowerCase().includes(q) ||
      n.summary?.toLowerCase().includes(q)
    );
  }, [data, query]);

  if (error) return <div>Failed to load notes</div>;

  return (
    <div className="mx-auto max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent>
          {!data ? (
            <div className="space-y-2">
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <>
              <div className="mb-4">
                <Input
                  placeholder="Search by patient or summary"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-gray-200 bg-gray-50 py-12 text-center">
                  <div className="text-sm font-medium text-gray-700">No notes found</div>
                  <div className="text-xs text-gray-500">Try adjusting your search or <Link className="text-blue-600 underline" href="/">create a new note</Link>.</div>
                </div>
              ) : (
                <Table className="border-collapse">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="p-2 border">Patient</TableHead>
                      <TableHead className="p-2 border">Date</TableHead>
                      <TableHead className="p-2 border">Summary</TableHead>
                      <TableHead className="p-2 border">Detail</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((note: any) => (
                      <TableRow key={note.id} className="hover:bg-gray-50">
                        <TableCell className="p-2 border">
                          {note.patient.name}
                        </TableCell>
                        <TableCell className="p-2 border">
                          {new Date(note.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell className="p-2 border">
                          {note.summary}
                        </TableCell>
                        <TableCell className="p-2 border text-blue-600 underline">
                          <Link href={`/notes/${note.id}`}>Open</Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              <div className="mt-4">
                <Link href="/">
                  <span className="text-blue-600 underline">New note</span>
                </Link>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}