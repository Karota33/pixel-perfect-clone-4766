import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FileText, ExternalLink, Plus, Upload, Save, Loader2, Camera, X } from "lucide-react";
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
}

const typeLabels: Record<string, string> = {
  factura: "Factura",
  lista_precios: "Lista de precios",
  catalogo: "Catálogo",
  ficha_tecnica: "Ficha técnica",
  email: "Email",
  otro: "Otro",
};

interface WineImage {
  id: string;
  storage_path: string;
  url_publica: string | null;
  tipo: string;
  principal: boolean | null;
}

export default function WineDocumentsSection({ vinoId }: { vinoId: string }) {
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [wineImage, setWineImage] = useState<WineImage | null>(null);
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
  const photoRef = useRef<HTMLInputElement>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const fetchDocs = () => {
    supabase
      .from("documentos")
      .select("id, nombre, tipo, fecha_documento, storage_path")
      .eq("vino_id", vinoId)
      .order("fecha_documento", { ascending: false })
      .then(({ data }) => {
        if (data) setDocs(data);
      });
  };

  const fetchImage = () => {
    supabase
      .from("imagenes")
      .select("id, storage_path, url_publica, tipo, principal")
      .eq("vino_id", vinoId)
      .eq("principal", true)
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) setWineImage(data[0]);
        else setWineImage(null);
      });
  };

  useEffect(() => {
    fetchDocs();
    fetchImage();
  }, [vinoId]);

  const openDoc = async (path: string | null) => {
    if (!path) return;
    const { data } = await supabase.storage.from("documentos").createSignedUrl(path, 3600);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      toast.error("Archivo demasiado grande (máx 20 MB)");
      return;
    }
    setUploadFile(file);
    setUploadNombre(file.name);
    setShowUpload(true);
  };

  const handleUpload = async () => {
    if (!uploadFile) return;
    setUploading(true);
    try {
      const ext = uploadFile.name.split(".").pop();
      const path = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: storageError } = await supabase.storage
        .from("documentos")
        .upload(path, uploadFile);
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
      const path = `wines/${vinoId}_${Date.now()}.${ext}`;

      const { error: storageError } = await supabase.storage
        .from("documentos")
        .upload(path, file);
      if (storageError) throw storageError;

      // If there's an existing principal image, unset it
      if (wineImage) {
        await supabase
          .from("imagenes")
          .update({ principal: false })
          .eq("id", wineImage.id);
      }

      const { error: dbError } = await supabase.from("imagenes").insert({
        vino_id: vinoId,
        storage_path: path,
        tipo: "botella",
        principal: true,
      });
      if (dbError) throw dbError;

      toast.success("Foto del vino actualizada");
      fetchImage();
    } catch (err: any) {
      toast.error(err.message || "Error al subir imagen");
    } finally {
      setUploadingPhoto(false);
      if (photoRef.current) photoRef.current.value = "";
    }
  };

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!wineImage) { setImageUrl(null); return; }
    if (wineImage.url_publica) { setImageUrl(wineImage.url_publica); return; }
    supabase.storage
      .from("documentos")
      .createSignedUrl(wineImage.storage_path, 3600)
      .then(({ data }) => {
        if (data?.signedUrl) setImageUrl(data.signedUrl);
      });
  }, [wineImage]);

  return (
    <div className="space-y-4">
      {/* Wine Photo */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h3 className="font-display text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            📷 Foto del vino
          </h3>
          <label className="flex items-center gap-1.5 px-2.5 py-1.5 bg-secondary text-secondary-foreground rounded-lg text-xs font-medium hover:bg-accent transition-colors cursor-pointer">
            {uploadingPhoto ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
            {uploadingPhoto ? "Subiendo..." : imageUrl ? "Cambiar" : "Subir foto"}
            <input
              ref={photoRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handlePhotoUpload}
              disabled={uploadingPhoto}
            />
          </label>
        </div>
        {imageUrl ? (
          <div className="p-4 flex justify-center">
            <img
              src={imageUrl}
              alt="Foto del vino"
              className="max-h-64 rounded-lg object-contain"
            />
          </div>
        ) : (
          <div className="p-6 text-center text-muted-foreground/60 text-sm">
            Sin foto. Sube una imagen JPG/PNG de la botella.
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
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.xlsx,.xls,.csv,.jpg,.jpeg,.png"
              className="hidden"
              onChange={handleFileSelect}
            />
          </label>
        </div>
        {docs.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground/60 text-sm">
            Sin documentos vinculados
          </div>
        ) : (
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
              <label className="text-xs text-muted-foreground mb-1 block">Nombre</label>
              <input
                type="text"
                value={uploadNombre}
                onChange={(e) => setUploadNombre(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/20"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Tipo</label>
              <select
                value={uploadTipo}
                onChange={(e) => setUploadTipo(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/20"
              >
                {DOCUMENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Bodega (opcional)</label>
              <select
                value={uploadBodegaId}
                onChange={(e) => setUploadBodegaId(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/20"
              >
                <option value="">Sin bodega</option>
                {bodegas.map((b) => (
                  <option key={b.id} value={b.id}>{b.nombre}</option>
                ))}
              </select>
            </div>
            <button
              onClick={handleUpload}
              disabled={uploading || !uploadFile}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {uploading ? "Subiendo..." : "Guardar documento"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
