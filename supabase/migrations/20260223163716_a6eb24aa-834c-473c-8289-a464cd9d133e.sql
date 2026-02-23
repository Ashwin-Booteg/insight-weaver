-- Drop the existing check constraint on sector
ALTER TABLE public.datasets DROP CONSTRAINT IF EXISTS datasets_sector_check;

-- Add new check constraint with all three sector values
ALTER TABLE public.datasets ADD CONSTRAINT datasets_sector_check 
  CHECK (sector IN ('production_companies', 'unions', 'talent_users'));