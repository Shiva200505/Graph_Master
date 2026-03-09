// Plain Node.js CJS script — no Prisma client needed
// Uses pg + bcryptjs directly, reads DATABASE_URL from .env
const { execSync } = require('child_process');
const path = require('path');

// Load .env manually
require('fs').readFileSync(path.join(__dirname, '../.env'), 'utf8')
    .split('\n')
    .forEach(line => {
        const [k, ...v] = line.split('=');
        if (k && v.length && !process.env[k.trim()]) {
            process.env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
        }
    });

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

async function main() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });

    console.log('🔑 Setting dealer passwords...');
    const hash = await bcrypt.hash('dealer123', 10);

    const { rows } = await pool.query('SELECT id, name, email FROM dealers');
    if (rows.length === 0) {
        console.log('❌ No dealers found. Run the seed first.');
        await pool.end();
        return;
    }

    for (const dealer of rows) {
        await pool.query(
            'UPDATE dealers SET password_hash = $1, is_active = true WHERE id = $2',
            [hash, dealer.id]
        );
        console.log(`  ✅ ${dealer.name} (${dealer.email || 'no email'}) — password: dealer123`);
    }

    await pool.end();
    console.log('\n────────────────────────────────');
    console.log('Dealer Login Credentials:');
    console.log('  shivaji@agro.com   / dealer123');
    console.log('  krushna@seeds.com  / dealer123');
    console.log('  nashik@agri.com    / dealer123');
    console.log('────────────────────────────────');
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
