
-- Drop restrictive CHECK constraints
ALTER TABLE public.stock_movimientos DROP CONSTRAINT IF EXISTS stock_movimientos_motivo_check;
ALTER TABLE public.stock_movimientos DROP CONSTRAINT IF EXISTS stock_movimientos_tipo_check;
