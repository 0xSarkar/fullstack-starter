import { Seed, SeedContext } from './index.js';

export const stripeSeeds: Seed = {
  name: 'stripe-prices',
  description: 'Seed Stripe products and prices for Pro subscription tiers',
  environments: ['development', 'test'],
  run: async (context: SeedContext) => {
    const { db } = context;

    const priceData = [
      {
        stripe_product_id: 'prod_T1SVPnvgg5GFnM',
        stripe_price_id: 'price_1S5PaOSGlUSNXM7JV8mi4g8x',
        price_code: 'pro_monthly',
        price_name: 'Pro Monthly',
        product_code: 'pro',
        product_name: 'Pro',
        amount: 500,
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
        amount: 5000,
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
          oc.column('stripe_price_id').doUpdateSet({
            stripe_product_id: (eb: any) => eb.ref('excluded.stripe_product_id'),
            price_code: (eb: any) => eb.ref('excluded.price_code'),
            price_name: (eb: any) => eb.ref('excluded.price_name'),
            product_code: (eb: any) => eb.ref('excluded.product_code'),
            product_name: (eb: any) => eb.ref('excluded.product_name'),
            amount: (eb: any) => eb.ref('excluded.amount'),
            currency: (eb: any) => eb.ref('excluded.currency'),
            interval: (eb: any) => eb.ref('excluded.interval'),
            active: (eb: any) => eb.ref('excluded.active'),
            updated_at: new Date(),
          })
        )
        .execute();
    }

    console.log(`   📊 Upserted ${priceData.length} Stripe price records`);
  },
};