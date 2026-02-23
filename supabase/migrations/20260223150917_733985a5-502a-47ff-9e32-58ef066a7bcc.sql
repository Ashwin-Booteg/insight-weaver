
-- Add sector column to datasets table to distinguish Production Companies vs Unions datasets
ALTER TABLE public.datasets ADD COLUMN sector text NOT NULL DEFAULT 'production_companies';

-- Add check constraint for valid sector values
ALTER TABLE public.datasets ADD CONSTRAINT datasets_sector_check CHECK (sector IN ('production_companies', 'unions'));

-- Create index for faster sector-based queries
CREATE INDEX idx_datasets_sector ON public.datasets (sector);
