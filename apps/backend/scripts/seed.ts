#!/usr/bin/env node

import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';
import { config } from 'dotenv';
import { DB } from '../src/types/database.js';
import { Seeder, SeedContext } from '../db/seeds/index.js';
import { stripeSeeds } from '../db/seeds/stripe-prices.js';
import { usersSeeds } from '../db/seeds/users.js';
import { notesSeeds } from '../db/seeds/notes.js';

// Load environment variables
config();

function getEnvironment(): 'development' | 'test' | 'production' {
  const env = process.env.NODE_ENV || 'development';
  if (env === 'test' || env === 'production' || env === 'development') {
    return env;
  }
  return 'development';
}

function createDatabaseConnection(): Kysely<DB> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  return new Kysely<DB>({
    dialect: new PostgresDialect({
      pool: new Pool({
        connectionString: databaseUrl,
        max: 10,
      }),
    }),
  });
}

async function main() {
  const command = process.argv[2];
  const environment = getEnvironment();

  console.log(`🌱 Seeding for environment: ${environment}`);

  const db = createDatabaseConnection();

  try {
    const context: SeedContext = {
      db,
      environment,
    };

    const seeder = new Seeder(context);

    // Register all seeds
    seeder.register(usersSeeds);
    seeder.register(stripeSeeds);
    seeder.register(notesSeeds);

    switch (command) {
      case 'run':
        await seeder.runAll();
        break;
      case 'reset':
        await seeder.reset();
        break;
      case 'reset-and-seed':
        await seeder.reset();
        await seeder.runAll();
        break;
      default:
        console.log('Usage: pnpm seed:run [run|reset|reset-and-seed]');
        console.log('');
        console.log('Commands:');
        console.log('  run            - Run all applicable seeds for current environment');
        console.log('  reset          - Clear all data from database (except migrations)');
        console.log('  reset-and-seed - Reset database and run all seeds');
        process.exit(1);
    }

    console.log('🎉 Seeding operation completed successfully');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await db.destroy();
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

main().catch(console.error);