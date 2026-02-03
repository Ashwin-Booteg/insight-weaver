-- Drop the broken INSERT policy
DROP POLICY IF EXISTS "Users can create their own datasets" ON public.datasets;

-- Recreate with proper WITH CHECK clause
CREATE POLICY "Users can create their own datasets" 
  ON public.datasets FOR INSERT 
  WITH CHECK (auth.uid() = user_id);