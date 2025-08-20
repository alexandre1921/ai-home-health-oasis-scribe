import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.patient.count();
  if (count > 0) {
    console.log('Patients already seeded');
    return;
  }
  await prisma.patient.createMany({
    data: [
      { name: 'John Doe', dob: new Date('1948-03-12') },
      { name: 'Jane Smith', dob: new Date('1955-10-08') },
      { name: 'Alice Johnson', dob: new Date('1962-07-30') },
    ],
  });
  console.log('Seeded patients');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());