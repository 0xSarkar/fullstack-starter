import type { FastifyInstance } from 'fastify';

/**
 * Start a suite-level Kysely transaction that rolls back on teardown.
 * Assumes the Fastify app has already registered the Kysely plugin (e.g. via fp(App)).
 *
 * Usage:
 *  const { teardown } = await startSuiteTransactionOnFastify(fastify)
 *  // run any setup (e.g., signup) here — it will be inside the transaction
 *  await teardown()
 */
export async function startSuiteTransactionOnFastify(
  fastify: FastifyInstance
): Promise<{ teardown: () => Promise<void>; }> {
  const hasDb = (fastify as any).kysely;
  if (!hasDb) {
    throw new Error('startSuiteTransactionOnFastify: fastify.kysely is not available. Ensure Kysely plugin/App is registered first.');
  }

  let originalDb: any;
  let endOuterTxn!: () => void;
  let outerTxnPromise!: Promise<void>;

  // Wait until transaction is active before returning
  let resolveReady!: () => void;
  const ready = new Promise<void>((resolve) => { resolveReady = resolve; });

  outerTxnPromise = (fastify as any).kysely
    .transaction()
    .execute(async (trx: any) => {
      originalDb = (fastify as any).kysely;
      // Create a shim over the transaction handle that supports nested transaction() calls.
      //
      // Intent: some route handlers call `db.transaction().execute(...)`. During tests we
      // replace `fastify.kysely` with a Transaction (the outer test transaction). Calling
      // `.transaction()` on a Transaction normally throws. The shim provides a safe
      // test-only no-op wrapper so handler code can still call `transaction().execute(cb)`.
      //
      // Limitation: this does NOT create a true nested transaction or savepoint. The
      // callback receives the same outer transaction object. If your code relies on
      // independent nested commits/rollbacks or savepoints, the shim won't emulate that.
      const txShim: any = trx;
      const makeNestedBuilder = () => {
        const builder = {
          execute: async (cb: (t: any) => Promise<any>) => cb(txShim),
          setIsolationLevel: () => builder,
          isolationLevel: () => builder,
          readOnly: () => builder,
          readWrite: () => builder,
        };
        return builder;
      };
      txShim.transaction = () => makeNestedBuilder();
      (fastify as any).kysely = txShim;

      // signal transaction active
      resolveReady();

      // keep open until teardown triggers rollback
      await new Promise<void>((_resolve, reject) => {
        endOuterTxn = () => reject({ __intendedRollback: true });
      });
    })
    .catch((err: any) => {
      if (!err || err.__intendedRollback === true) return;
      throw err;
    });

  await ready;

  async function teardown() {
    (fastify as any).kysely = originalDb;
    endOuterTxn();
    await outerTxnPromise;
  }

  return { teardown };
}
