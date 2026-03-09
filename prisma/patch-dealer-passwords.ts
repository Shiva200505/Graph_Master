import { PrismaClient } from '../app/generated/prisma';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🔑 Patching dealer passwords...');

    const dealers = await prisma.dealer.findMany();
    if (dealers.length === 0) {
        console.log('❌ No dealers found in database. Run the full seed first.');
        return;
    }

    const hashed = await bcrypt.hash('dealer123', 10);

    for (const dealer of dealers) {
        await prisma.dealer.update({
            where: { id: dealer.id },
            data: { passwordHash: hashed, isActive: true },
        });
        console.log(`  ✅ ${dealer.name} (${dealer.email}) — password set to dealer123`);
    }

    console.log('\n─────────────────────────────────');
    console.log('Dealer Login Credentials:');
    console.log('  shivaji@agro.com   / dealer123');
    console.log('  krushna@seeds.com  / dealer123');
    console.log('  nashik@agri.com    / dealer123');
    console.log('─────────────────────────────────');
}

main()
    .catch((e) => {
        console.error('❌ Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
