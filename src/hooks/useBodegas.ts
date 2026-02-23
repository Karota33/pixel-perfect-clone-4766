import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Bodega {
  id: string;
  nombre: string;
  isla: string | null;
  do: string | null;
  web: string | null;
  contacto_nombre: string | null;
  contacto_tel: string | null;
  contacto_email: string | null;
  distribuidor: string | null;
  distribuidor_tel: string | null;
  valoracion: number | null;
  condiciones: string | null;
  notas: string | null;
  activa: boolean | null;
  tipo_entidad: string;
}

export function useBodegas() {
  const [bodegas, setBodegas] = useState<Bodega[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBodegas = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("bodegas")
      .select("*")
      .order("nombre");
    if (data) setBodegas(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchBodegas();
  }, [fetchBodegas]);

  const getBodega = useCallback(
    (id: string) => bodegas.find((b) => b.id === id) || null,
    [bodegas]
  );

  return { bodegas, loading, fetchBodegas, getBodega };
}

export function useBodegaDetail(id: string | undefined) {
  const [bodega, setBodega] = useState<Bodega | null>(null);
  const [loading, setLoading] = useState(true);
  const [vinoCount, setVinoCount] = useState(0);

  useEffect(() => {
    if (!id) return;
    async function fetch() {
      setLoading(true);
      const { data } = await supabase
        .from("bodegas")
        .select("*")
        .eq("id", id)
        .single();
      if (data) setBodega(data);

      const { count } = await supabase
        .from("vinos")
        .select("id", { count: "exact", head: true })
        .eq("bodega_id", id);
      setVinoCount(count || 0);

      setLoading(false);
    }
    fetch();
  }, [id]);

  const updateBodega = useCallback(
    async (updates: Partial<Bodega>) => {
      if (!id) return;
      const { error } = await supabase
        .from("bodegas")
        .update(updates)
        .eq("id", id);
      if (!error) {
        setBodega((prev) => (prev ? { ...prev, ...updates } : prev));
      }
      return { error };
    },
    [id]
  );

  return { bodega, loading, vinoCount, updateBodega };
}
