import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FileText, ExternalLink } from "lucide-react";

interface DocRow {
  id: string;
  nombre: string;
  tipo: string;
  fecha_documento: string | null;
  storage_path: string | null;
}

const typeLabels: Record<string, string> = {
  factura: "Factura",
  lista_precios: "Lista de precios",
  catalogo: "Catálogo",
  ficha_tecnica: "Ficha técnica",
  email: "Email",
  otro: "Otro",
};

export default function BodegaDocumentsSection({ bodegaId }: { bodegaId: string }) {
  const [docs, setDocs] = useState<DocRow[]>([]);

  useEffect(() => {
    supabase
      .from("documentos")
      .select("id, nombre, tipo, fecha_documento, storage_path")
      .eq("bodega_id", bodegaId)
      .order("fecha_documento", { ascending: false })
      .then(({ data }) => {
        if (data) setDocs(data);
      });
  }, [bodegaId]);

  const openDoc = async (path: string | null) => {
    if (!path) return;
    const { data } = await supabase.storage.from("documentos").createSignedUrl(path, 3600);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };

  if (docs.length === 0) return null;

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="px-4 py-3 border-b border-border">
        <h3 className="font-display text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          📄 Documentos ({docs.length})
        </h3>
      </div>
      <div className="divide-y divide-border">
        {docs.map((doc) => (
          <div
            key={doc.id}
            className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-accent/30 transition-colors cursor-pointer"
            onClick={() => openDoc(doc.storage_path)}
          >
            <div className="flex items-center gap-3 min-w-0">
              <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{doc.nombre}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="px-1.5 py-0.5 bg-secondary rounded">{typeLabels[doc.tipo] || doc.tipo}</span>
                  {doc.fecha_documento && (
                    <span>{new Date(doc.fecha_documento).toLocaleDateString("es-ES")}</span>
                  )}
                </div>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-muted-foreground/40 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
