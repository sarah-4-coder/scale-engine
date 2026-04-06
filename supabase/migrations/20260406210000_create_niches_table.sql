-- Create niches table and populate with initial data
-- This fixes 406 Not Acceptable errors on fetch and enables category selection

CREATE TABLE IF NOT EXISTS public.niches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.niches ENABLE ROW LEVEL SECURITY;

-- Allow public read access to niches
CREATE POLICY "Niches are viewable by everyone" ON public.niches
FOR SELECT USING (true);

-- Populate with standard influencer categories
INSERT INTO public.niches (name) VALUES 
('Fashion'),
('Beauty'),
('Lifestyle'),
('Travel'),
('Food & Dining'),
('Tech & Gadgets'),
('Fitness & Health'),
('Parenting'),
('Gaming'),
('Finance & Business'),
('Entertainment'),
('Education'),
('Automotive'),
('Home & Decor'),
('Art & Photography')
ON CONFLICT (name) DO NOTHING;
