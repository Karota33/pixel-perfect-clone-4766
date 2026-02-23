
ALTER TABLE public.stock_movimientos
ADD CONSTRAINT stock_movimientos_motivo_check
CHECK (motivo IN (
  'venta', 'rotura', 'consumo_interno',
  'ajuste_manual', 'entrada', 'devolucion', 'inventario', 'inventario_fisico'
));
