/**
 * DB Migration Script
 *
 * Copies all collections from SOURCE_URI to TARGET_URI.
 * Existing documents in the target are skipped (upsert by _id).
 *
 * Usage:
 *   SOURCE_URI=mongodb://... TARGET_URI=mongodb://... npx ts-node scripts/migrate-db.ts
 *
 * Or with a .env file:
 *   ts-node -r dotenv/config scripts/migrate-db.ts dotenv_config_path=scripts/.env.migrate
 */

import { Document, MongoClient } from 'mongodb';

const SOURCE_URI = process.env.SOURCE_URI;
const TARGET_URI = process.env.TARGET_URI;

if (!SOURCE_URI || !TARGET_URI) {
  console.error(
    '❌  SOURCE_URI and TARGET_URI environment variables are required.',
  );
  process.exit(1);
}

// Collections to skip (add system collections or any you want to exclude)
const SKIP_COLLECTIONS = new Set<string>(['system.views']);

async function migrateCollection(
  sourceClient: MongoClient,
  targetClient: MongoClient,
  sourceDbName: string,
  targetDbName: string,
  collectionName: string,
): Promise<void> {
  const sourceColl = sourceClient.db(sourceDbName).collection(collectionName);
  const targetColl = targetClient.db(targetDbName).collection(collectionName);

  const total = await sourceColl.countDocuments();
  if (total === 0) {
    console.log(`  ⤷ ${collectionName}: empty, skipping`);
    return;
  }

  const BATCH_SIZE = 500;
  let processed = 0;
  let inserted = 0;
  let skipped = 0;

  const cursor = sourceColl.find({});

  const batch: Document[] = [];

  const flushBatch = async () => {
    if (batch.length === 0) return;

    const ops = batch.map((doc) => ({
      updateOne: {
        filter: { _id: doc._id },
        update: { $setOnInsert: doc },
        upsert: true,
      },
    }));

    const result = await targetColl.bulkWrite(ops, { ordered: false });
    inserted += result.upsertedCount;
    skipped += result.matchedCount;
    processed += batch.length;
    batch.length = 0;

    process.stdout.write(
      `\r  ⤷ ${collectionName}: ${processed}/${total} (${inserted} inserted, ${skipped} skipped)   `,
    );
  };

  for await (const doc of cursor) {
    batch.push(doc);
    if (batch.length >= BATCH_SIZE) {
      await flushBatch();
    }
  }
  await flushBatch();

  console.log(
    `\n  ✅ ${collectionName}: done — ${inserted} inserted, ${skipped} already existed`,
  );
}

function extractDbName(uri: string): string {
  // mongodb://host/dbName?options  or  mongodb+srv://host/dbName?options
  const url = new URL(uri);
  const dbName = url.pathname.replace(/^\//, '');
  if (!dbName) {
    throw new Error(`Cannot extract database name from URI: ${uri}`);
  }
  return dbName;
}

async function main() {
  const sourceClient = new MongoClient(SOURCE_URI!);
  const targetClient = new MongoClient(TARGET_URI!);

  try {
    console.log('🔌  Connecting to source...');
    await sourceClient.connect();

    console.log('🔌  Connecting to target...');
    await targetClient.connect();

    const sourceDbName = extractDbName(SOURCE_URI!);
    const targetDbName = extractDbName(TARGET_URI!);

    console.log(`\n📦  Source DB : ${sourceDbName}`);
    console.log(`📦  Target DB : ${targetDbName}`);

    const collections = await sourceClient
      .db(sourceDbName)
      .listCollections()
      .toArray();

    const names = collections
      .map((c) => c.name)
      .filter((n) => !SKIP_COLLECTIONS.has(n));

    console.log(
      `\n📋  Found ${names.length} collection(s): ${names.join(', ')}\n`,
    );

    for (const name of names) {
      await migrateCollection(
        sourceClient,
        targetClient,
        sourceDbName,
        targetDbName,
        name,
      );
    }

    console.log('\n🎉  Migration complete.');
  } catch (err) {
    console.error('\n❌  Migration failed:', err);
    process.exit(1);
  } finally {
    await sourceClient.close();
    await targetClient.close();
  }
}

main();
