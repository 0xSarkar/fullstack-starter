import type { Kysely } from 'kysely';

/**
 * Seed Stripe products and prices for Pro subscription tiers
 * Creates sample pricing data for monthly and yearly subscriptions
 */

// replace `any` with your database interface.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function seed(db: Kysely<any>): Promise<void> {
  const priceData = [
    {
      stripe_product_id: 'prod_T1SVPnvgg5GFnM',
      stripe_price_id: 'price_1S5PaOSGlUSNXM7JV8mi4g8x',
      price_code: 'pro_monthly',
      price_name: 'Pro Monthly',
      product_code: 'pro',
      product_name: 'Pro',
      amount: 500, // $5.00
      currency: 'usd',
      interval: 'month',
      active: true,
    },
    {
      stripe_product_id: 'prod_T1SVPnvgg5GFnM',
      stripe_price_id: 'price_1S5SNeSGlUSNXM7JMTAveMx6',
      price_code: 'pro_yearly',
      price_name: 'Pro Yearly',
      product_code: 'pro',
      product_name: 'Pro',
      amount: 5000, // $50.00
      currency: 'usd',
      interval: 'year',
      active: true,
    },
  ];

  for (const price of priceData) {
    await db
      .insertInto('stripe_prices')
      .values({
        ...price,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .onConflict((oc) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        oc.column('stripe_price_id').doUpdateSet((eb: any) => ({
          stripe_product_id: eb.ref('excluded.stripe_product_id'),
          price_code: eb.ref('excluded.price_code'),
          price_name: eb.ref('excluded.price_name'),
          product_code: eb.ref('excluded.product_code'),
          product_name: eb.ref('excluded.product_name'),
          amount: eb.ref('excluded.amount'),
          currency: eb.ref('excluded.currency'),
          interval: eb.ref('excluded.interval'),
          active: eb.ref('excluded.active'),
          updated_at: new Date(),
        }))
      )
      .execute();
  }

  console.log(`✅ Seeded ${priceData.length} Stripe price records`);
}
