import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FileText, ExternalLink, Plus, Save, Loader2, Camera, ImagePlus, X } from "lucide-react";
import { toast } from "sonner";
import { DOCUMENT_TYPES } from "@/hooks/useDocumentos";
import { useBodegas } from "@/hooks/useBodegas";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DocRow {
  id: string;
  nombre: string;
  tipo: string;
  fecha_documento: string | null;
  storage_path: string | null;
  mime_type: string | null;
}

const typeLabels: Record<string, string> = {
  factura: "Factura",
  lista_precios: "Lista de precios",
  catalogo: "Catálogo",
  ficha_tecnica: "Ficha técnica",
  email: "Email",
  otro: "Otro",
};

interface Props {
  vinoId: string;
  vinoNombre: string;
  vinoAnada: number | null;
  fotoUrl: string | null;
  onFotoUpdated: (url: string) => void;
}

export default function WineDocumentsSection({ vinoId, vinoNombre, vinoAnada, fotoUrl, onFotoUpdated }: Props) {
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const { bodegas } = useBodegas();

  // Upload form state
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadNombre, setUploadNombre] = useState("");
  const [uploadTipo, setUploadTipo] = useState("ficha_tecnica");
  const [uploadBodegaId, setUploadBodegaId] = useState("");
  const [uploading, setUploading] = useState(false);

  // Photo upload state
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // PDF viewer state
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfDocName, setPdfDocName] = useState("");

  const fetchDocs = () => {
    supabase
      .from("documentos")
      .select("id, nombre, tipo, fecha_documento, storage_path, mime_type")
      .eq("vino_id", vinoId)
      .order("fecha_documento", { ascending: false })
      .then(({ data }) => {
        if (data) setDocs(data);
      });
  };

  useEffect(() => {
    fetchDocs();
  }, [vinoId]);

  const openDoc = async (doc: DocRow) => {
    if (!doc.storage_path) return;
    const { data } = await supabase.storage.from("documentos").createSignedUrl(doc.storage_path, 3600);
    if (!data?.signedUrl) return;

    const isPdf = doc.mime_type === "application/pdf" || doc.storage_path.toLowerCase().endsWith(".pdf");
    if (isPdf) {
      setPdfUrl(data.signedUrl);
      setPdfDocName(doc.nombre);
    } else {
      window.open(data.signedUrl, "_blank");
    }
  };

  const generateAutoName = (tipo: string, ext: string) => {
    const tipoLabel = typeLabels[tipo] || tipo;
    const anadaPart = vinoAnada ? ` — ${vinoAnada}` : "";
    return `${tipoLabel} — ${vinoNombre}${anadaPart}.${ext}`;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      toast.error("Archivo demasiado grande (máx 20 MB)");
      return;
    }
    setUploadFile(file);
    const ext = file.name.split(".").pop() || "";
    setUploadNombre(generateAutoName("ficha_tecnica", ext));
    setUploadTipo("ficha_tecnica");
    setShowUpload(true);
  };

  // Regenerate name when tipo changes
  const handleTipoChange = (newTipo: string) => {
    setUploadTipo(newTipo);
    if (uploadFile) {
      const ext = uploadFile.name.split(".").pop() || "";
      setUploadNombre(generateAutoName(newTipo, ext));
    }
  };

  const handleUpload = async () => {
    if (!uploadFile) return;
    setUploading(true);
    try {
      const ext = uploadFile.name.split(".").pop();
      const path = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: storageError } = await supabase.storage.from("documentos").upload(path, uploadFile);
      if (storageError) throw storageError;
      const { error: dbError } = await supabase.from("documentos").insert({
        nombre: uploadNombre,
        tipo: uploadTipo,
        vino_id: vinoId,
        bodega_id: uploadBodegaId || null,
        tamano_bytes: uploadFile.size,
        storage_path: path,
        mime_type: uploadFile.type,
      });
      if (dbError) throw dbError;
      toast.success("Documento adjuntado");
      setShowUpload(false);
      setUploadFile(null);
      setUploadNombre("");
      setUploadTipo("ficha_tecnica");
      setUploadBodegaId("");
      if (fileRef.current) fileRef.current.value = "";
      fetchDocs();
    } catch (err: any) {
      toast.error(err.message || "Error al subir");
    } finally {
      setUploading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Solo se permiten imágenes JPG/PNG");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Imagen demasiado grande (máx 10 MB)");
      return;
    }
    setUploadingPhoto(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${vinoId}_${Date.now()}.${ext}`;
      const { error: storageError } = await supabase.storage.from("fotos-vinos").upload(path, file);
      if (storageError) throw storageError;

      const { data: urlData } = supabase.storage.from("fotos-vinos").getPublicUrl(path);
      const publicUrl = urlData.publicUrl;

      await supabase.from("vinos").update({ foto_url: publicUrl }).eq("id", vinoId);
      toast.success("Foto del vino actualizada");
      onFotoUpdated(publicUrl);
    } catch (err: any) {
      toast.error(err.message || "Error al subir imagen");
    } finally {
      setUploadingPhoto(false);
      if (galleryRef.current) galleryRef.current.value = "";
      if (cameraRef.current) cameraRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      {/* Wine Photo */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h3 className="font-display text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            📷 Foto del vino
          </h3>
          <div className="flex items-center gap-1.5">
            <label className="flex items-center gap-1 px-2 py-1.5 bg-secondary text-secondary-foreground rounded-lg text-xs font-medium hover:bg-accent transition-colors cursor-pointer">
              {uploadingPhoto ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImagePlus className="w-3.5 h-3.5" />}
              Galería
              <input
                ref={galleryRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handlePhotoUpload}
                disabled={uploadingPhoto}
              />
            </label>
            <label className="flex items-center gap-1 px-2 py-1.5 bg-secondary text-secondary-foreground rounded-lg text-xs font-medium hover:bg-accent transition-colors cursor-pointer">
              {uploadingPhoto ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
              Cámara
              <input
                ref={cameraRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handlePhotoUpload}
                disabled={uploadingPhoto}
              />
            </label>
          </div>
        </div>
        {fotoUrl ? (
          <div className="p-4 flex justify-center">
            <img src={fotoUrl} alt="Foto del vino" className="max-h-64 rounded-lg object-contain" />
          </div>
        ) : (
          <div className="p-6 text-center text-muted-foreground/60 text-sm">
            Sin foto. Sube una imagen o haz una foto con la cámara.
          </div>
        )}
      </div>

      {/* Documents */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h3 className="font-display text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            📄 Documentos ({docs.length})
          </h3>
          <label className="flex items-center gap-1.5 px-2.5 py-1.5 bg-secondary text-secondary-foreground rounded-lg text-xs font-medium hover:bg-accent transition-colors cursor-pointer">
            <Plus className="w-3.5 h-3.5" />
            Adjuntar
            <input ref={fileRef} type="file" accept=".pdf,.xlsx,.xls,.csv,.jpg,.jpeg,.png" className="hidden" onChange={handleFileSelect} />
          </label>
        </div>
        {docs.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground/60 text-sm">Sin documentos vinculados</div>
        ) : (
          <div className="divide-y divide-border">
            {docs.map((doc) => (
              <div
                key={doc.id}
                className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-accent/30 transition-colors cursor-pointer"
                onClick={() => openDoc(doc)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{doc.nombre}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="px-1.5 py-0.5 bg-secondary rounded">{typeLabels[doc.tipo] || doc.tipo}</span>
                      {doc.fecha_documento && <span>{new Date(doc.fecha_documento).toLocaleDateString("es-ES")}</span>}
                    </div>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground/40 shrink-0" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Dialog */}
      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Adjuntar documento al vino</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Tipo</label>
              <select value={uploadTipo} onChange={(e) => handleTipoChange(e.target.value)} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/20">
                {DOCUMENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Nombre</label>
              <input type="text" value={uploadNombre} onChange={(e) => setUploadNombre(e.target.value)} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/20" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Bodega (opcional)</label>
              <select value={uploadBodegaId} onChange={(e) => setUploadBodegaId(e.target.value)} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/20">
                <option value="">Sin bodega</option>
                {bodegas.map((b) => (
                  <option key={b.id} value={b.id}>{b.nombre}</option>
                ))}
              </select>
            </div>
            <button onClick={handleUpload} disabled={uploading || !uploadFile} className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
              <Save className="w-4 h-4" />
              {uploading ? "Subiendo..." : "Guardar documento"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* PDF Viewer Modal */}
      {pdfUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="relative w-[90vw] h-[90vh] bg-background rounded-xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
              <h3 className="text-sm font-semibold text-foreground truncate">{pdfDocName}</h3>
              <button
                onClick={() => setPdfUrl(null)}
                className="p-1.5 rounded-lg hover:bg-accent transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <iframe
              src={pdfUrl}
              className="flex-1 w-full"
              title="Visor PDF"
            />
          </div>
        </div>
      )}
    </div>
  );
}
