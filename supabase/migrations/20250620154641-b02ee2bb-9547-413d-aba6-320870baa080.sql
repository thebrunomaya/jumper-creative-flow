
-- Create table for managing creative drafts
CREATE TABLE public.creative_drafts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creative_id TEXT NOT NULL UNIQUE, -- The CRT-XXX format ID
  manager_id UUID REFERENCES auth.users NOT NULL,
  client_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'IN_PROGRESS', 'COMPLETED')),
  platform TEXT,
  campaign_objective TEXT,
  creative_type TEXT,
  form_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_accessed TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security
ALTER TABLE public.creative_drafts ENABLE ROW LEVEL SECURITY;

-- Create policies for creative drafts
CREATE POLICY "Users can view their own drafts" 
  ON public.creative_drafts 
  FOR SELECT 
  USING (auth.uid() = manager_id);

CREATE POLICY "Users can create their own drafts" 
  ON public.creative_drafts 
  FOR INSERT 
  WITH CHECK (auth.uid() = manager_id);

CREATE POLICY "Users can update their own drafts" 
  ON public.creative_drafts 
  FOR UPDATE 
  USING (auth.uid() = manager_id);

CREATE POLICY "Users can delete their own drafts" 
  ON public.creative_drafts 
  FOR DELETE 
  USING (auth.uid() = manager_id);

-- Create function to generate creative ID
CREATE OR REPLACE FUNCTION public.generate_creative_id()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  next_counter INTEGER;
  creative_id TEXT;
BEGIN
  -- Get next counter value
  SELECT get_next_creative_counter() INTO next_counter;
  
  -- Format as CRT-XXXX
  creative_id := 'CRT-' || LPAD(next_counter::TEXT, 4, '0');
  
  RETURN creative_id;
END;
$$;

-- Create trigger to update updated_at column
CREATE OR REPLACE FUNCTION public.update_creative_drafts_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER creative_drafts_updated_at
  BEFORE UPDATE ON public.creative_drafts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_creative_drafts_updated_at();

-- Create index for better performance
CREATE INDEX idx_creative_drafts_manager_status ON public.creative_drafts(manager_id, status);
CREATE INDEX idx_creative_drafts_updated_at ON public.creative_drafts(updated_at DESC);
