
-- TABAIBA VINOS — Schema completo v1.0

-- GRUPO 1: CATÁLOGO

CREATE TABLE bodegas (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre              TEXT NOT NULL,
  isla                TEXT,
  "do"                TEXT,
  web                 TEXT,
  contacto_nombre     TEXT,
  contacto_tel        TEXT,
  contacto_email      TEXT,
  distribuidor        TEXT,
  distribuidor_tel    TEXT,
  condiciones         TEXT,
  valoracion          INTEGER CHECK (valoracion BETWEEN 1 AND 5),
  notas               TEXT,
  activa              BOOLEAN DEFAULT true,
  created_at          TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE vinos (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre              TEXT NOT NULL,
  anada               INTEGER,
  tipo                TEXT NOT NULL CHECK (tipo IN ('blanco','tinto','rosado','espumoso','dulce','sidra')),
  isla                TEXT NOT NULL,
  isla_normalizada    TEXT,
  "do"                TEXT,
  uvas                TEXT,
  bodega_id           UUID REFERENCES bodegas(id),
  precio_carta        NUMERIC(8,2),
  precio_coste        NUMERIC(8,2),
  margen_objetivo     NUMERIC(5,2),
  stock_actual        INTEGER DEFAULT 0,
  estado              TEXT DEFAULT 'en_carta' CHECK (estado IN ('en_carta','en_bodega','en_prueba','descartado')),
  descripcion_corta   TEXT,
  descripcion_larga   JSONB,
  descripcion_en      TEXT,
  notas_internas      TEXT,
  created_at          TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at          TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE maridajes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vino_id         UUID NOT NULL REFERENCES vinos(id) ON DELETE CASCADE,
  plato           TEXT NOT NULL,
  descripcion     TEXT,
  en_carta        BOOLEAN DEFAULT false,
  generado_ia     BOOLEAN DEFAULT false,
  orden           INTEGER DEFAULT 0
);

CREATE TABLE puntuaciones (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vino_id         UUID NOT NULL REFERENCES vinos(id) ON DELETE CASCADE,
  guia            TEXT NOT NULL CHECK (guia IN ('parker','penin','proensa','otro')),
  puntuacion      NUMERIC(5,1),
  anada           INTEGER,
  nota            TEXT,
  fecha           DATE
);

-- GRUPO 2: INVENTARIO

CREATE TABLE pedidos (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bodega_id         UUID NOT NULL REFERENCES bodegas(id),
  estado            TEXT DEFAULT 'borrador' CHECK (estado IN ('borrador','enviado','recibido','parcial','cancelado')),
  fecha_pedido      DATE,
  fecha_entrega     DATE,
  importe_total     NUMERIC(10,2),
  factura_ref       TEXT,
  documento_id      UUID,
  notas             TEXT,
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE pedido_lineas (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id        UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  vino_id          UUID NOT NULL REFERENCES vinos(id),
  cantidad         INTEGER NOT NULL,
  precio_ud        NUMERIC(8,2) NOT NULL,
  cantidad_rec     INTEGER,
  notas            TEXT
);

CREATE TABLE stock_movimientos (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vino_id      UUID NOT NULL REFERENCES vinos(id),
  tipo         TEXT NOT NULL CHECK (tipo IN ('entrada','salida','ajuste','baja','inventario')),
  cantidad     INTEGER NOT NULL,
  motivo       TEXT CHECK (motivo IN ('compra','venta','rotura','merma','correccion','inventario_fisico')),
  pedido_id    UUID REFERENCES pedidos(id),
  precio_ud    NUMERIC(8,2),
  notas        TEXT,
  fecha        TIMESTAMP WITH TIME ZONE DEFAULT now(),
  usuario      TEXT
);

-- GRUPO 3: FINANCIERO

CREATE TABLE price_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vino_id         UUID NOT NULL REFERENCES vinos(id),
  campo           TEXT NOT NULL CHECK (campo IN ('precio_carta','precio_coste')),
  valor_anterior  NUMERIC(8,2),
  valor_nuevo     NUMERIC(8,2) NOT NULL,
  motivo          TEXT CHECK (motivo IN ('ajuste_manual','recepcion_pedido','importacion')),
  pedido_id       UUID REFERENCES pedidos(id),
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT now(),
  usuario         TEXT
);

CREATE TABLE ventas (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vino_id       UUID NOT NULL REFERENCES vinos(id),
  fecha         DATE NOT NULL,
  servicio      TEXT CHECK (servicio IN ('mediodia','noche')),
  cantidad      INTEGER NOT NULL,
  precio_venta  NUMERIC(8,2),
  precio_coste  NUMERIC(8,2),
  notas         TEXT,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- GRUPO 4: DOCUMENTOS E IMÁGENES

CREATE TABLE documentos (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bodega_id         UUID NOT NULL REFERENCES bodegas(id),
  tipo              TEXT NOT NULL CHECK (tipo IN ('factura','lista_precios','catalogo','ficha_tecnica','email','otro')),
  nombre            TEXT NOT NULL,
  fecha_documento   DATE,
  storage_path      TEXT,
  mime_type         TEXT,
  tamano_bytes      INTEGER,
  etiquetas         TEXT[],
  procesado         BOOLEAN DEFAULT false,
  notas             TEXT,
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE imagenes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vino_id       UUID NOT NULL REFERENCES vinos(id) ON DELETE CASCADE,
  tipo          TEXT NOT NULL CHECK (tipo IN ('etiqueta','botella','servicio','detalle')),
  storage_path  TEXT NOT NULL,
  url_publica   TEXT,
  principal     BOOLEAN DEFAULT false,
  alt_text      TEXT,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ÍNDICES
CREATE INDEX idx_vinos_tipo ON vinos(tipo);
CREATE INDEX idx_vinos_isla_normalizada ON vinos(isla_normalizada);
CREATE INDEX idx_vinos_estado ON vinos(estado);
CREATE INDEX idx_vinos_bodega ON vinos(bodega_id);
CREATE INDEX idx_stock_mov_vino ON stock_movimientos(vino_id);
CREATE INDEX idx_price_history_vino ON price_history(vino_id);
CREATE INDEX idx_ventas_vino ON ventas(vino_id);
CREATE INDEX idx_ventas_fecha ON ventas(fecha);
CREATE INDEX idx_pedidos_bodega ON pedidos(bodega_id);
CREATE INDEX idx_documentos_bodega ON documentos(bodega_id);
CREATE INDEX idx_imagenes_vino ON imagenes(vino_id);

-- TRIGGER updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_vinos_updated_at
  BEFORE UPDATE ON vinos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE bodegas ENABLE ROW LEVEL SECURITY;
ALTER TABLE vinos ENABLE ROW LEVEL SECURITY;
ALTER TABLE maridajes ENABLE ROW LEVEL SECURITY;
ALTER TABLE puntuaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedido_lineas ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movimientos ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE imagenes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on bodegas" ON bodegas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on vinos" ON vinos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on maridajes" ON maridajes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on puntuaciones" ON puntuaciones FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on pedidos" ON pedidos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on pedido_lineas" ON pedido_lineas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on stock_movimientos" ON stock_movimientos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on price_history" ON price_history FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on ventas" ON ventas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on documentos" ON documentos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on imagenes" ON imagenes FOR ALL USING (true) WITH CHECK (true);

-- FK diferida
ALTER TABLE pedidos ADD CONSTRAINT fk_pedidos_documento FOREIGN KEY (documento_id) REFERENCES documentos(id);
