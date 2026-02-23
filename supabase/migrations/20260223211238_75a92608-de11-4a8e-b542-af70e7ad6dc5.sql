
-- Add new wine detail columns (skip formato_ml as it already exists)
ALTER TABLE public.vinos ADD COLUMN IF NOT EXISTS graduacion numeric;
ALTER TABLE public.vinos ADD COLUMN IF NOT EXISTS temp_servicio_min integer;
ALTER TABLE public.vinos ADD COLUMN IF NOT EXISTS temp_servicio_max integer;
ALTER TABLE public.vinos ADD COLUMN IF NOT EXISTS crianza text;
ALTER TABLE public.vinos ADD COLUMN IF NOT EXISTS puntuacion_parker integer;
