type Patient = { id: number; name: string; dob: Date };
interface Note {
  id: number;
  createdAt: Date;
  audioKey: string;
  transcription: string;
  summary: string;
  oasisM1800: string;
  oasisM1810: string;
  oasisM1820: string;
  oasisM1830: string;
  oasisM1840: string;
  oasisM1850: string;
  oasisM1860: string;
  oasisRaw: any;
  patientId: number;
}

let patientSeq = 1;
let noteSeq = 1;
const patients: Patient[] = [
  { id: patientSeq++, name: 'John Doe', dob: new Date('1948-03-12') },
  { id: patientSeq++, name: 'Jane Smith', dob: new Date('1955-10-08') },
  { id: patientSeq++, name: 'Alice Johnson', dob: new Date('1962-07-30') },
];
const notes: Note[] = [];

export class PrismaClient {
  patient = {
    findMany: async ({ orderBy }: any = {}) => {
      if (orderBy?.id === 'asc') return [...patients].sort((a, b) => a.id - b.id);
      return patients;
    },
    count: async () => patients.length,
    createMany: async ({ data }: { data: Array<Omit<Patient, 'id'>> }) => {
      data.forEach((d) => patients.push({ id: patientSeq++, ...d } as any));
      return { count: data.length } as any;
    },
    findUnique: async ({ where: { id } }: any) => patients.find((p) => p.id === id) || null,
    findFirst: async () => patients[0] || null,
  };
  note = {
    create: async ({ data, include }: any) => {
      const newNote: Note = {
        id: noteSeq++,
        createdAt: new Date(),
        audioKey: data.audioKey,
        transcription: data.transcription,
        summary: data.summary,
        oasisM1800: data.oasisM1800,
        oasisM1810: data.oasisM1810,
        oasisM1820: data.oasisM1820,
        oasisM1830: data.oasisM1830,
        oasisM1840: data.oasisM1840,
        oasisM1850: data.oasisM1850,
        oasisM1860: data.oasisM1860,
        oasisRaw: data.oasisRaw,
        patientId: data.patientId,
      };
      notes.push(newNote);
      if (include?.patient) {
        const patient = patients.find((p) => p.id === newNote.patientId)!;
        return { ...newNote, patient } as any;
      }
      return newNote as any;
    },
    findMany: async ({ orderBy, select }: any = {}) => {
      const sorted = orderBy?.createdAt === 'desc'
        ? [...notes].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        : notes;
      if (select) {
        return sorted.map((n) => ({
          id: n.id,
          createdAt: n.createdAt,
          summary: n.summary,
          patient: { ...patients.find((p) => p.id === n.patientId)! },
        }));
      }
      return sorted as any;
    },
    findUnique: async ({ where: { id }, include }: any) => {
      const n = notes.find((x) => x.id === id);
      if (!n) return null;
      if (include?.patient) {
        const patient = patients.find((p) => p.id === n.patientId)!;
        return { ...n, patient } as any;
      }
      return n as any;
    },
    deleteMany: async () => { notes.splice(0, notes.length); return { count: 0 } as any; },
  };
  async $queryRaw() { return 1; }
  async $disconnect() { /* no-op */ }
}

export default PrismaClient; 