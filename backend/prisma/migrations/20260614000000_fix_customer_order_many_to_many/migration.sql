-- Migration: fix_customer_order_many_to_many
-- The original schema had Order.customerId (one-to-one FK to Customer).
-- The current schema uses a many-to-many relation (Order.customers Customer[])
-- which requires an implicit join table "_CustomerToOrder".
-- This migration safely migrates the deployed DB to the new structure.

-- Step 1: Create the many-to-many join table if it doesn't already exist
CREATE TABLE IF NOT EXISTS "_CustomerToOrder" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- Step 2: Migrate existing customerId data into the join table
-- (only if the old customerId column still exists on Order)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Order' AND column_name = 'customerId'
  ) THEN
    INSERT INTO "_CustomerToOrder" ("A", "B")
    SELECT "customerId", "id"
    FROM "Order"
    WHERE "customerId" IS NOT NULL
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Step 3: Create unique index on join table (required by Prisma)
CREATE UNIQUE INDEX IF NOT EXISTS "_CustomerToOrder_AB_unique" ON "_CustomerToOrder"("A", "B");
CREATE INDEX IF NOT EXISTS "_CustomerToOrder_B_index" ON "_CustomerToOrder"("B");

-- Step 4: Add foreign key constraints if not already present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = '_CustomerToOrder_A_fkey'
  ) THEN
    ALTER TABLE "_CustomerToOrder"
      ADD CONSTRAINT "_CustomerToOrder_A_fkey"
      FOREIGN KEY ("A") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = '_CustomerToOrder_B_fkey'
  ) THEN
    ALTER TABLE "_CustomerToOrder"
      ADD CONSTRAINT "_CustomerToOrder_B_fkey"
      FOREIGN KEY ("B") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- Step 5: Drop the old FK constraint on Order.customerId if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'Order_customerId_fkey'
  ) THEN
    ALTER TABLE "Order" DROP CONSTRAINT "Order_customerId_fkey";
  END IF;
END $$;

-- Step 6: Drop the old customerId column from Order if it still exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Order' AND column_name = 'customerId'
  ) THEN
    ALTER TABLE "Order" DROP COLUMN "customerId";
  END IF;
END $$;
