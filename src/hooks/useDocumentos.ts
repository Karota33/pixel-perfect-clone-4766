import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Documento {
  id: string;
  nombre: string;
  tipo: string;
  bodega_id: string | null;
  vino_id: string | null;
  fecha_documento: string | null;
  tamano_bytes: number | null;
  storage_path: string | null;
  mime_type: string | null;
  etiquetas: string[] | null;
  notas: string | null;
  procesado: boolean | null;
  created_at: string | null;
}

export const DOCUMENT_TYPES = [
  { value: "factura", label: "Factura" },
  { value: "lista_precios", label: "Lista de precios" },
  { value: "catalogo", label: "Catálogo" },
  { value: "ficha_tecnica", label: "Ficha técnica" },
  { value: "email", label: "Email" },
  { value: "otro", label: "Otro" },
] as const;

export function useDocumentos() {
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDocumentos = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("documentos")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setDocumentos(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchDocumentos();
  }, [fetchDocumentos]);

  return { documentos, loading, fetchDocumentos };
}
