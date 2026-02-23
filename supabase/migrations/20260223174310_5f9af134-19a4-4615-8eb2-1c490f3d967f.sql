
-- Add vino_id to documentos to link documents to specific wines
ALTER TABLE public.documentos ADD COLUMN vino_id uuid REFERENCES public.vinos(id) ON DELETE SET NULL;

-- Make bodega_id nullable (documents can be linked to a wine without a bodega)
ALTER TABLE public.documentos ALTER COLUMN bodega_id DROP NOT NULL;
