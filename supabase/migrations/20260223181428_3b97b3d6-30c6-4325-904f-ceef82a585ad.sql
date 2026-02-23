
-- Add foto_url column to vinos
ALTER TABLE public.vinos ADD COLUMN IF NOT EXISTS foto_url text DEFAULT NULL;

-- Create storage bucket for wine photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('fotos-vinos', 'fotos-vinos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access
CREATE POLICY "Public read fotos-vinos"
ON storage.objects FOR SELECT
USING (bucket_id = 'fotos-vinos');

-- Allow all inserts/updates/deletes (internal app, no auth)
CREATE POLICY "Allow all uploads fotos-vinos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'fotos-vinos');

CREATE POLICY "Allow all updates fotos-vinos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'fotos-vinos');

CREATE POLICY "Allow all deletes fotos-vinos"
ON storage.objects FOR DELETE
USING (bucket_id = 'fotos-vinos');
