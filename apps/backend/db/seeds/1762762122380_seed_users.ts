import type { Kysely } from 'kysely';
import bcrypt from 'bcrypt';

/**
 * Seed sample users for development and testing
 * Creates admin and regular users with default password
 */

// replace `any` with your database interface.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function seed(db: Kysely<any>): Promise<void> {
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        oc.column('email').doUpdateSet((eb: any) => ({
          password_hash: eb.ref('excluded.password_hash'),
          role: eb.ref('excluded.role'),
          active: eb.ref('excluded.active'),
          updated_at: new Date(),
        }))
      )
      .execute();
  }

  console.log(`✅ Seeded ${sampleUsers.length} sample users`);
  console.log(`   Default password for all users: ${defaultPassword}`);
}
