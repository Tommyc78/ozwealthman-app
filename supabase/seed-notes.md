# Seed Data

The working MVP seed data currently lives in `src/data/seed.ts` so the Expo app is usable immediately without a Supabase project.

When persistence is connected, mirror those records into Supabase through a typed seed loader rather than relying on static SQL ids. The recommended flow is:

1. Create or sign in a demo user.
2. Insert the `users` and `profiles` rows.
3. Insert accounts and retain their generated ids.
4. Insert holdings, transactions and budget categories using those account ids.
5. Run the dashboard calculation service and persist a `dashboard_snapshots` row.

Generated bullion columns in `supabase/schema.sql` keep lot valuation deterministic in the database.
