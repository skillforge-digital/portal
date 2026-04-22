import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// --- CONFIGURATION ---
const SERVICE_ACCOUNT_PATH = './service-account.json';

if (!existsSync(SERVICE_ACCOUNT_PATH)) {
  console.error('\x1b[31m%s\x1b[0m', 'CRITICAL ERROR: service-account.json not found!');
  console.log('\x1b[33m%s\x1b[0m', '\nTo run this CLI provisioning tool, you must:');
  console.log('1. Go to Firebase Console -> Project Settings -> Service Accounts');
  console.log('2. Click "Generate new private key"');
  console.log(`3. Rename the downloaded file to "service-account.json" and place it in: ${process.cwd()}`);
  console.log('\nAlternatively, use the browser-based provisioning:');
  console.log('1. Open the Personnel Registration page in your browser');
  console.log('2. Enter code: SKF-MASTER-PROVISION-2026');
  process.exit(1);
}

const serviceAccount = JSON.parse(readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

const STAFF_SEED_DATA = [
    // Executive Directors
    {
        code: "SKF-DIR-1010",
        name: "Blessing Emmanuel . E",
        position: "Managing Director / Discord Dev Specialist",
        roles: ["Director", "Specialist"],
        used: false
    },
    {
        code: "SKF-DIR-1020",
        name: "Innocent Oluwaseun",
        position: "Business & Development Director / Digital Marketing Specialist & HOD",
        roles: ["Director", "Specialist", "Digital Marketing", "HOD"],
        used: false
    },
    {
        code: "SKF-DMT-214",
        name: "Ogunsola Iyanuoluwa",
        position: "Social Media Handler (FB & IG)",
        roles: ["Digital Marketing"],
        used: false
    },
    {
        code: "SKF-DMT-221",
        name: "Richard Famuyiwa O",
        position: "Social Media Handler (FB & IG)",
        roles: ["Digital Marketing"],
        used: false
    },
    {
        code: "SKF-DMT-233",
        name: "Aina Samuel . O",
        position: "A.I Content Generation",
        roles: ["Digital Marketing"],
        used: false
    },
    {
        code: "SKF-DMT-241",
        name: "Faith Eniola",
        position: "Social Media & Global Support",
        roles: ["Digital Marketing"],
        used: false
    },
    {
        code: "SKF-HSPEC-514",
        name: "Emmanuel Umoh",
        position: "Website Dev & Design (Dev & Tech HOU)",
        roles: ["HOD", "Specialist"],
        used: false
    },
    {
        code: "SKF-SPEC-521",
        name: "Gbonjubola Olatoye",
        position: "Discord Dev & Community Manager",
        roles: ["Specialist", "Community Manager"],
        used: false
    },
    {
        code: "SKF-SPEC-528",
        name: "Gabriel Odusanya",
        position: "Cybersecurity",
        roles: ["Specialist"],
        used: false
    },
    {
        code: "SKF-SPEC-535",
        name: "Eziukwu Perpetual N",
        position: "A.I Creation & Support Team",
        roles: ["Specialist", "Support Team"],
        used: false
    },
    {
        code: "SKF-SPEC-542",
        name: "Excellent J Akinwumi",
        position: "Graphic Design",
        roles: ["Specialist"],
        used: false
    },
    {
        code: "SKF-SPEC-549",
        name: "O J . Alonge",
        position: "Founder & CEO / Synthetic Indices",
        roles: ["Director", "Specialist"],
        used: false
    },
    {
        code: "SKF-HSPEC-556",
        name: "T. G Adeyeri",
        position: "Chief Trading Officer (CTO) / HOU",
        roles: ["Director", "HOD", "Specialist"],
        used: false
    },
    {
        code: "SKF-CM-888",
        name: "Ajayi Opemipo",
        position: "Community Manager",
        roles: ["Community Manager", "Support Team"],
        used: false
    }
];

async function seed() {
  console.log('--- SkillForge Staff Matrix Provisioning ---');
  let count = 0;
  for (const staff of STAFF_SEED_DATA) {
    await db.collection('role_codes').doc(staff.code).set({
      ...staff,
      created_at: new Date()
    }, { merge: true });
    console.log(`[Provisioned] ${staff.code} -> ${staff.name}`);
    count++;
  }
  console.log(`\nSuccess: ${count} staff authorization codes initialized.`);
  process.exit(0);
}

seed().catch(err => {
  console.error('Provisioning Failed:', err);
  process.exit(1);
});
