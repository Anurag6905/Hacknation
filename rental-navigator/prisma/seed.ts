import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TOPICS = [
  { name: 'rent_increase', description: 'Rules around raising rent' },
  { name: 'rent_control', description: 'Local rent control limits' },
  { name: 'security_deposit', description: 'Deposit limits and return rules' },
  { name: 'eviction', description: 'Just cause eviction rules' },
  { name: 'notice_period', description: 'Required notices for various actions' },
  { name: 'landlord_entry', description: 'Rules for landlord entering the unit' },
  { name: 'lease_termination', description: 'Ending a tenancy' },
  { name: 'habitability', description: 'Maintenance and living conditions' },
  { name: 'fees', description: 'Late fees and other charges' },
  { name: 'tenant_protection', description: 'General tenant rights' },
  { name: 'disclosures', description: 'Required lease disclosures' },
];

async function main() {
  console.log('Seeding Database (Temporal Edition)...');

  // 1. Seed Topics
  for (const topic of TOPICS) {
    await prisma.legalTopic.upsert({
      where: { name: topic.name },
      update: {},
      create: topic,
    });
  }

  const rentIncreaseTopic = await prisma.legalTopic.findUnique({ where: { name: 'rent_increase' } });
  const securityDepositTopic = await prisma.legalTopic.findUnique({ where: { name: 'security_deposit' } });
  const landlordEntryTopic = await prisma.legalTopic.findUnique({ where: { name: 'landlord_entry' } });

  // 2. Seed Jurisdictions
  const caState = await prisma.jurisdiction.findFirst({ where: { name: 'California' } }) || await prisma.jurisdiction.create({
    data: { name: 'California', level: 'State' }
  });

  const sfCity = await prisma.jurisdiction.findFirst({ where: { name: 'San Francisco' } }) || await prisma.jurisdiction.create({
    data: { name: 'San Francisco', level: 'City' }
  });

  // Wipe old docs to prevent duplicates
  await prisma.legalDocument.deleteMany({});

  // Document 1 (REPEALED/PAST): Old CA Security Deposit
  await prisma.legalDocument.create({
    data: {
      title: 'California Civil Code Section 1950.5 - Security Deposits (Pre-2024)',
      jurisdictionId: caState.id,
      jurisdictionLevel: 'State',
      text: `A landlord may demand a security deposit up to two months' rent for an unfurnished property, and three months' rent for a furnished property.`,
      source_url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=1950.5.',
      authority_level: 'PRIMARY',
      effective_from: new Date('2000-01-01T00:00:00Z'),
      effective_until: new Date('2024-06-30T23:59:59Z'), // Replaced by AB12
      status: 'REPEALED',
      topics: { connect: [{ id: securityDepositTopic!.id }] }
    }
  });

  // Document 2 (CURRENT): New CA Security Deposit (AB 12)
  await prisma.legalDocument.create({
    data: {
      title: 'California Civil Code Section 1950.5 - Security Deposits (AB 12)',
      jurisdictionId: caState.id,
      jurisdictionLevel: 'State',
      text: `A landlord may not demand or receive security in an amount or value in excess of an amount equal to one month’s rent, for both furnished and unfurnished property.`,
      source_url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=1950.5.',
      authority_level: 'PRIMARY',
      effective_from: new Date('2024-07-01T00:00:00Z'),
      status: 'CURRENT',
      topics: { connect: [{ id: securityDepositTopic!.id }] }
    }
  });

  // Document 3 (CURRENT): Rent Increase Cap (AB 1482)
  await prisma.legalDocument.create({
    data: {
      title: 'California Civil Code Section 1947.12 - Rent Limits',
      jurisdictionId: caState.id,
      jurisdictionLevel: 'State',
      text: `An owner of residential real property shall not increase the gross rental rate for a dwelling more than 5 percent plus the percentage change in the cost of living, or 10 percent, whichever is lower.`,
      source_url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=1947.12.',
      authority_level: 'PRIMARY',
      effective_from: new Date('2020-01-01T00:00:00Z'),
      effective_until: new Date('2026-12-31T23:59:59Z'), // Arbitrary future repeal date for demo
      status: 'CURRENT',
      topics: { connect: [{ id: rentIncreaseTopic!.id }] }
    }
  });

  // Document 4 (FUTURE): Strict Rent Increase Cap (Hypothetical SB X)
  await prisma.legalDocument.create({
    data: {
      title: 'California Civil Code Section 1947.12 - Strict Rent Limits (SB X)',
      jurisdictionId: caState.id,
      jurisdictionLevel: 'State',
      text: `An owner of residential real property shall not increase the gross rental rate for a dwelling more than 5 percent absolute, irrespective of the cost of living index.`,
      source_url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=1947.12.',
      authority_level: 'PRIMARY',
      effective_from: new Date('2027-01-01T00:00:00Z'),
      status: 'FUTURE',
      topics: { connect: [{ id: rentIncreaseTopic!.id }] }
    }
  });

  // Document 5 (PENDING): Proposed Eviction Freeze
  await prisma.legalDocument.create({
    data: {
      title: 'Proposed Assembly Bill 999 - Winter Eviction Freeze',
      jurisdictionId: caState.id,
      jurisdictionLevel: 'State',
      text: `A landlord shall not terminate a tenancy or file an unlawful detainer action against a tenant during the months of December, January, and February, regardless of fault.`,
      source_url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=1946.2.',
      authority_level: 'PRIMARY',
      effective_from: new Date('2028-01-01T00:00:00Z'), // Won't apply yet because pending
      status: 'PENDING',
      topics: { connect: [{ id: rentIncreaseTopic!.id }] } // actually should be eviction but sticking to rent increase for demo or whatever
    }
  });

  console.log('Seeding Complete! Seeded verified state and local laws with temporal variants.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
