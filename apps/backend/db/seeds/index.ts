import { Kysely, sql } from 'kysely';
import { DB } from '../../src/types/database.js';

export interface SeedContext {
  db: Kysely<DB>;
  environment: 'development' | 'test' | 'production';
}

export interface Seed {
  name: string;
  description: string;
  environments: Array<'development' | 'test' | 'production'>;
  dependencies?: string[];
  run: (context: SeedContext) => Promise<void>;
}

export class Seeder {
  private seeds: Map<string, Seed> = new Map();
  private executed: Set<string> = new Set();

  constructor(private context: SeedContext) { }

  register(seed: Seed): void {
    this.seeds.set(seed.name, seed);
  }

  async runAll(): Promise<void> {
    console.log(`🌱 Starting seeding process for ${this.context.environment} environment`);

    // Get seeds that should run in current environment
    const applicableSeeds = Array.from(this.seeds.values())
      .filter(seed => seed.environments.includes(this.context.environment));

    // Sort seeds by dependencies
    const sortedSeeds = this.topologicalSort(applicableSeeds);

    for (const seed of sortedSeeds) {
      await this.runSeed(seed);
    }

    console.log(`✅ Seeding completed successfully`);
  }

  async runSeed(seedName: string): Promise<void>;
  async runSeed(seed: Seed): Promise<void>;
  async runSeed(seedOrName: string | Seed): Promise<void> {
    const seed = typeof seedOrName === 'string'
      ? this.seeds.get(seedOrName)
      : seedOrName;

    if (!seed) {
      throw new Error(`Seed ${typeof seedOrName === 'string' ? seedOrName : 'unknown'} not found`);
    }

    if (this.executed.has(seed.name)) {
      return;
    }

    // Check if seed should run in current environment
    if (!seed.environments.includes(this.context.environment)) {
      console.log(`⏭️  Skipping ${seed.name} (not applicable for ${this.context.environment})`);
      return;
    }

    // Run dependencies first
    if (seed.dependencies) {
      for (const dep of seed.dependencies) {
        await this.runSeed(dep);
      }
    }

    console.log(`🌱 Running seed: ${seed.name}`);
    console.log(`   ${seed.description}`);

    try {
      await seed.run(this.context);
      this.executed.add(seed.name);
      console.log(`✅ Completed: ${seed.name}`);
    } catch (error) {
      console.error(`❌ Failed to run seed ${seed.name}:`, error);
      throw error;
    }
  }

  private topologicalSort(seeds: Seed[]): Seed[] {
    const result: Seed[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (seed: Seed) => {
      if (visiting.has(seed.name)) {
        throw new Error(`Circular dependency detected involving seed: ${seed.name}`);
      }
      if (visited.has(seed.name)) {
        return;
      }

      visiting.add(seed.name);

      if (seed.dependencies) {
        for (const depName of seed.dependencies) {
          const depSeed = seeds.find(s => s.name === depName);
          if (depSeed) {
            visit(depSeed);
          }
        }
      }

      visiting.delete(seed.name);
      visited.add(seed.name);
      result.push(seed);
    };

    for (const seed of seeds) {
      visit(seed);
    }

    return result;
  }

  async reset(): Promise<void> {
    console.log(`🗑️  Resetting database for ${this.context.environment} environment`);

    // Get all tables except schema_migrations using raw SQL
    const result = await sql<{ table_name: string; }>`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name != 'schema_migrations'
    `.execute(this.context.db);

    // Truncate tables in dependency order to avoid foreign key issues
    const tableOrder = [
      'notes',
      'stripe_subscriptions',
      'stripe_webhook_events',
      'user_providers',
      'password_reset_tokens',
      'users',
      'stripe_prices'
    ];

    try {
      // Truncate tables in the specified order
      for (const tableName of tableOrder) {
        const tableExists = result.rows.find(row => row.table_name === tableName);
        if (tableExists) {
          await sql.raw(`TRUNCATE TABLE "${tableName}" RESTART IDENTITY CASCADE`).execute(this.context.db);
        }
      }

      // Truncate any remaining tables not in our order
      for (const table of result.rows) {
        if (!tableOrder.includes(table.table_name)) {
          await sql.raw(`TRUNCATE TABLE "${table.table_name}" RESTART IDENTITY CASCADE`).execute(this.context.db);
        }
      }
    } catch (error) {
      console.error('Error during reset:', error);
      throw error;
    }

    console.log(`✅ Database reset completed`);
  }
}