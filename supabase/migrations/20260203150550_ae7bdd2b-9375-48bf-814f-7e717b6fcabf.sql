-- Create datasets table to store uploaded Excel data
CREATE TABLE public.datasets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  row_count INTEGER NOT NULL DEFAULT 0,
  columns JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create dataset_rows table to store actual data rows
CREATE TABLE public.dataset_rows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dataset_id UUID NOT NULL REFERENCES public.datasets(id) ON DELETE CASCADE,
  row_data JSONB NOT NULL,
  state_normalized TEXT,
  industry_category TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create AI analysis results table
CREATE TABLE public.ai_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dataset_id UUID NOT NULL REFERENCES public.datasets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  analysis_type TEXT NOT NULL, -- 'insights', 'recommendations', 'predictions'
  result JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dataset_rows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_analysis ENABLE ROW LEVEL SECURITY;

-- RLS Policies for datasets
CREATE POLICY "Users can view their own datasets" 
  ON public.datasets FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own datasets" 
  ON public.datasets FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own datasets" 
  ON public.datasets FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own datasets" 
  ON public.datasets FOR DELETE 
  USING (auth.uid() = user_id);

-- RLS Policies for dataset_rows (based on dataset ownership)
CREATE POLICY "Users can view rows of their datasets" 
  ON public.dataset_rows FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.datasets 
    WHERE datasets.id = dataset_rows.dataset_id 
    AND datasets.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert rows to their datasets" 
  ON public.dataset_rows FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.datasets 
    WHERE datasets.id = dataset_rows.dataset_id 
    AND datasets.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete rows from their datasets" 
  ON public.dataset_rows FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM public.datasets 
    WHERE datasets.id = dataset_rows.dataset_id 
    AND datasets.user_id = auth.uid()
  ));

-- RLS Policies for ai_analysis
CREATE POLICY "Users can view their own analysis" 
  ON public.ai_analysis FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own analysis" 
  ON public.ai_analysis FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own analysis" 
  ON public.ai_analysis FOR DELETE 
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_datasets_user_id ON public.datasets(user_id);
CREATE INDEX idx_dataset_rows_dataset_id ON public.dataset_rows(dataset_id);
CREATE INDEX idx_dataset_rows_state ON public.dataset_rows(state_normalized);
CREATE INDEX idx_dataset_rows_industry ON public.dataset_rows(industry_category);
CREATE INDEX idx_ai_analysis_dataset_id ON public.ai_analysis(dataset_id);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_datasets_updated_at
  BEFORE UPDATE ON public.datasets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();