const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function updateUrls() {
    await prisma.legalDocument.updateMany({
        where: { title: { contains: 'San Jose Municipal Code' } },
        data: { source_url: 'https://library.municode.com/search?stateId=5&clientId=4205&searchText=A%20landlord%20may%20not%20increase%20the%20rent%20of%20any%20rent-stabilized%20unit%20by%20more%20than%20five%20percent&searchMode=CLIENTMODE&contentTypeId=CODES' }
    });
    
    await prisma.legalDocument.updateMany({
        where: { title: { contains: 'San Francisco Administrative Code' } },
        data: { source_url: 'https://library.municode.com/search?stateId=5&clientId=4205&searchText=A%20landlord%20may%20not%20increase%20the%20rent%20of%20any%20rent-stabilized%20unit%20by%20more%20than%20five%20percent&searchMode=CLIENTMODE&contentTypeId=CODES' }
    });
    
    console.log('URLs updated in database.');
}
updateUrls().finally(() => prisma.$disconnect());
