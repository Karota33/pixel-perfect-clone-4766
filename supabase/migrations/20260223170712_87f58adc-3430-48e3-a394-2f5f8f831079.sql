
-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('documentos', 'documentos', false)
ON CONFLICT (id) DO NOTHING;

-- Allow all authenticated and anonymous users to upload documents
CREATE POLICY "Allow upload documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'documentos');

-- Allow all to read documents
CREATE POLICY "Allow read documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'documentos');

-- Allow all to delete documents
CREATE POLICY "Allow delete documents"
ON storage.objects FOR DELETE
USING (bucket_id = 'documentos');
