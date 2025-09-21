import bcrypt from 'bcrypt';
import { Seed, SeedContext } from './index.js';

export const usersSeeds: Seed = {
  name: 'users',
  description: 'Seed sample users for development and testing',
  environments: ['development', 'test'],
  run: async (context: SeedContext) => {
    const { db } = context;

    // Hash passwords for sample users
    const defaultPassword = 'pass@1234';
    const passwordHash = await bcrypt.hash(defaultPassword, 12);

    const sampleUsers = [
      {
        email: 'admin@example.com',
        password_hash: passwordHash,
        role: 'admin' as const,
        active: true,
      },
      {
        email: 'test1@example.com',
        password_hash: passwordHash,
        role: 'user' as const,
        active: true,
      },
      {
        email: 'test2@example.com',
        password_hash: passwordHash,
        role: 'user' as const,
        active: false,
      },
      {
        email: 'test3@example.com',
        password_hash: passwordHash,
        role: 'user' as const,
        active: true,
      },
    ];

    for (const user of sampleUsers) {
      await db
        .insertInto('users')
        .values({
          ...user,
          created_at: new Date(),
          updated_at: new Date(),
        })
        .onConflict((oc) =>
          oc.column('email').doUpdateSet({
            password_hash: (eb: any) => eb.ref('excluded.password_hash'),
            role: (eb: any) => eb.ref('excluded.role'),
            active: (eb: any) => eb.ref('excluded.active'),
            updated_at: new Date(),
          })
        )
        .execute();
    }

    console.log(`   👥 Upserted ${sampleUsers.length} sample users`);
    console.log(`   🔑 Default password for all users: ${defaultPassword}`);
  },
};