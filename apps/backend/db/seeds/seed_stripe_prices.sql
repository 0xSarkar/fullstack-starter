
-- seed_stripe_prices.sql
-- Upsert two Pro prices for product prod_T1SVPnvgg5GFnM

INSERT INTO public.stripe_prices (
	stripe_product_id,
	stripe_price_id,
	price_code,
	price_name,
	product_code,
	product_name,
	amount,
	currency,
	interval,
	active,
	created_at,
	updated_at
)
VALUES
	(
		'prod_T1SVPnvgg5GFnM',
		'price_1S5PaOSGlUSNXM7JV8mi4g8x',
		'pro_monthly',
		'Pro Monthly',
		'pro',
		'Pro',
		500,
		'usd',
		'month',
		true,
		now(),
		now()
	),
	(
		'prod_T1SVPnvgg5GFnM',
		'price_1S5SNeSGlUSNXM7JMTAveMx6',
		'pro_yearly',
		'Pro Yearly',
		'pro',
		'Pro',
		5000,
		'usd',
		'year',
		true,
		now(),
		now()
	)
ON CONFLICT (stripe_price_id) DO UPDATE SET
	stripe_product_id = EXCLUDED.stripe_product_id,
	price_code = EXCLUDED.price_code,
	price_name = EXCLUDED.price_name,
	product_code = EXCLUDED.product_code,
	product_name = EXCLUDED.product_name,
	amount = EXCLUDED.amount,
	currency = EXCLUDED.currency,
	interval = EXCLUDED.interval,
	active = EXCLUDED.active,
	updated_at = now();
