import { useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useDocumentos, DOCUMENT_TYPES, Documento } from "@/hooks/useDocumentos";
import { useBodegas } from "@/hooks/useBodegas";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowLeft,
  Upload,
  FileText,
  Search,
  GitCompareArrows,
  X,
  Save,
  Loader2,
  Check,
  Plus,
  Trash2,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";
import FilterChips from "@/components/FilterChips";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { fuzzyMatchWines } from "@/lib/fuzzyMatch";

function formatSize(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getTypeLabel(tipo: string): string {
  return DOCUMENT_TYPES.find((t) => t.value === tipo)?.label ?? tipo;
}

export default function DocumentsList() {
  const navigate = useNavigate();
  const { documentos, loading, fetchDocumentos } = useDocumentos();
  const { bodegas, fetchBodegas } = useBodegas();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [bodegaFilter, setBodegaFilter] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // Upload dialog state
  const [showUpload, setShowUpload] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadNombre, setUploadNombre] = useState("");
  const [uploadTipo, setUploadTipo] = useState("otro");
  const [uploadBodegaId, setUploadBodegaId] = useState("");
  const [uploadFecha, setUploadFecha] = useState("");
  const [uploadEtiquetas, setUploadEtiquetas] = useState("");
  const [uploadNotas, setUploadNotas] = useState("");
  const [uploading, setUploading] = useState(false);
  const [showNewBodega, setShowNewBodega] = useState(false);
  const [newBodegaNombre, setNewBodegaNombre] = useState("");
  const [creatingBodega, setCreatingBodega] = useState(false);

  // Extraction modal state
  const [showExtraction, setShowExtraction] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [extractedData, setExtractedData] = useState<any[]>([]);
  const [savingExtracted, setSavingExtracted] = useState(false);


  const handleCreateBodega = async () => {
    if (!newBodegaNombre.trim()) return;
    setCreatingBodega(true);
    try {
      const { data, error } = await supabase
        .from("bodegas")
        .insert({ nombre: newBodegaNombre.trim() })
        .select("id")
        .single();
      if (error) throw error;
      toast.success(`Bodega "${newBodegaNombre.trim()}" creada`);
      setUploadBodegaId(data.id);
      setNewBodegaNombre("");
      setShowNewBodega(false);
      fetchBodegas();
    } catch (err: any) {
      toast.error(err.message || "Error al crear bodega");
    } finally {
      setCreatingBodega(false);
    }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return documentos.filter((d) => {
      if (typeFilter && d.tipo !== typeFilter) return false;
      if (bodegaFilter && d.bodega_id !== bodegaFilter) return false;
      if (q && !d.nombre.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [documentos, search, typeFilter, bodegaFilter]);

  const bodegaMap = useMemo(() => {
    const m = new Map<string, string>();
    bodegas.forEach((b) => m.set(b.id, b.nombre));
    return m;
  }, [bodegas]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size
    const isPdf = file.type === "application/pdf";
    const maxSize = isPdf ? 20 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(`Archivo demasiado grande (máx ${isPdf ? "20" : "10"} MB)`);
      return;
    }

    setUploadFile(file);
    setUploadNombre(file.name);
    setShowUpload(true);
  };

  const handleUpload = async () => {
    if (!uploadFile || !uploadBodegaId) {
      toast.error("Selecciona una bodega");
      return;
    }

    setUploading(true);
    try {
      const ext = uploadFile.name.split(".").pop();
      const path = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: storageError } = await supabase.storage
        .from("documentos")
        .upload(path, uploadFile);

      if (storageError) throw storageError;

      const etiquetas = uploadEtiquetas
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const { error: dbError } = await supabase.from("documentos").insert({
        nombre: uploadNombre,
        tipo: uploadTipo,
        bodega_id: uploadBodegaId,
        fecha_documento: uploadFecha || null,
        tamano_bytes: uploadFile.size,
        storage_path: path,
        mime_type: uploadFile.type,
        etiquetas: etiquetas.length > 0 ? etiquetas : null,
        notas: uploadNotas || null,
      });

      if (dbError) throw dbError;

      toast.success("Documento subido");
      setShowUpload(false);

      // If ficha_tecnica PDF, trigger extraction
      if (uploadTipo === "ficha_tecnica" && uploadFile.type === "application/pdf") {
        setExtracting(true);
        setShowExtraction(true);
        try {
          const { data: extractData, error: extractError } = await supabase.functions.invoke("extract-document-data", {
            body: { storage_path: path },
          });
          if (extractError) throw extractError;
          const vinos = extractData?.vinos || [];
          // Enrich with fuzzy matches
          const { data: existingWines } = await supabase.from("vinos").select("id, nombre, precio_coste");
          const enriched = vinos.map((v: any) => {
            const matches = existingWines ? fuzzyMatchWines(
              [{ name: v.nombre || "", price: v.precio || 0 }],
              existingWines.map((w: any) => ({ id: w.id, nombre: w.nombre, precio_coste: w.precio_coste }))
            ) : { matched: [], unmatched: [] };
            const existingBodega = bodegas.find((b) => b.nombre.toLowerCase() === (v.bodega || "").toLowerCase());
            return { ...v, fuzzyMatch: matches.matched[0] || null, existingBodega };
          });
          setExtractedData(enriched);
        } catch (e: any) {
          console.error(e);
          toast.error("Error al extraer datos del PDF");
          setShowExtraction(false);
        } finally {
          setExtracting(false);
        }
      }

      resetUploadForm();
      fetchDocumentos();
    } catch (err: any) {
      toast.error(err.message || "Error al subir");
    } finally {
      setUploading(false);
    }
  };

  const resetUploadForm = () => {
    setUploadFile(null);
    setUploadNombre("");
    setUploadTipo("otro");
    setUploadBodegaId("");
    setUploadFecha("");
    setUploadEtiquetas("");
    setUploadNotas("");
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container max-w-2xl py-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/")}
                className="p-2 -ml-2 rounded-lg hover:bg-accent transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-foreground" />
              </button>
              <h1 className="font-display text-xl font-bold text-foreground tracking-tight">
                Documentos
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate("/comparar-precios")}
                className="flex items-center gap-1.5 px-3 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium hover:bg-accent transition-colors"
              >
                <GitCompareArrows className="w-4 h-4" />
                Comparar
              </button>
              <label className="flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer">
                <Upload className="w-4 h-4" />
                Subir
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,.xlsx,.xls,.csv"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </label>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar documento..."
              className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring/20 transition-shadow"
            />
          </div>

          <div className="space-y-2">
            <FilterChips
              options={DOCUMENT_TYPES.map((t) => t.label)}
              selected={
                DOCUMENT_TYPES.find((t) => t.value === typeFilter)?.label || ""
              }
              onSelect={(label) => {
                const found = DOCUMENT_TYPES.find((t) => t.label === label);
                setTypeFilter(found ? found.value : "");
              }}
              allLabel="Todos"
            />
            {bodegas.length > 0 && (
              <FilterChips
                options={bodegas.map((b) => b.nombre)}
                selected={bodegaMap.get(bodegaFilter) || ""}
                onSelect={(name) => {
                  const found = bodegas.find((b) => b.nombre === name);
                  setBodegaFilter(found ? found.id : "");
                }}
                allLabel="Todas"
              />
            )}
          </div>
        </div>
      </header>

      <main className="container max-w-2xl py-3 space-y-2">
        {loading ? (
          <div className="text-center py-16 text-muted-foreground text-sm">
            Cargando...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No se encontraron documentos</p>
          </div>
        ) : (
          filtered.map((doc) => (
            <DocCard
              key={doc.id}
              doc={doc}
              bodegaNombre={bodegaMap.get(doc.bodega_id) || "—"}
              onDeleted={fetchDocumentos}
              onRenamed={fetchDocumentos}
            />
          ))
        )}
      </main>

      {/* Upload Dialog */}
      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Subir documento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Nombre
              </label>
              <input
                type="text"
                value={uploadNombre}
                onChange={(e) => setUploadNombre(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/20"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Tipo
              </label>
              <select
                value={uploadTipo}
                onChange={(e) => setUploadTipo(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/20"
              >
                {DOCUMENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Bodega / Proveedor *
              </label>
              <div className="flex gap-2">
                <select
                  value={uploadBodegaId}
                  onChange={(e) => setUploadBodegaId(e.target.value)}
                  className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/20"
                >
                  <option value="">Seleccionar...</option>
                  {bodegas.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.nombre}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowNewBodega(true)}
                  className="px-2.5 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm font-bold hover:bg-accent transition-colors shrink-0"
                  title="Crear nueva bodega"
                >
                  +
                </button>
              </div>
              {showNewBodega && (
                <div className="mt-2 p-3 border border-border rounded-lg bg-secondary/30 space-y-2">
                  <label className="text-xs text-muted-foreground block">
                    Nombre nueva bodega *
                  </label>
                  <input
                    type="text"
                    value={newBodegaNombre}
                    onChange={(e) => setNewBodegaNombre(e.target.value)}
                    placeholder="Ej: Vinofilos, Premium Drinks..."
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/20"
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => { setShowNewBodega(false); setNewBodegaNombre(""); }}
                      className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      disabled={!newBodegaNombre.trim() || creatingBodega}
                      onClick={handleCreateBodega}
                      className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {creatingBodega ? "Creando..." : "Crear"}
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Fecha documento
              </label>
              <input
                type="date"
                value={uploadFecha}
                onChange={(e) => setUploadFecha(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/20"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Etiquetas (separadas por comas)
              </label>
              <input
                type="text"
                value={uploadEtiquetas}
                onChange={(e) => setUploadEtiquetas(e.target.value)}
                placeholder="tarifa, 2025, tinto..."
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/20"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Notas
              </label>
              <textarea
                value={uploadNotas}
                onChange={(e) => setUploadNotas(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 resize-none"
              />
            </div>
            <button
              onClick={handleUpload}
              disabled={uploading || !uploadBodegaId}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {uploading ? "Subiendo..." : "Guardar documento"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Extraction Modal */}
      <Dialog open={showExtraction} onOpenChange={setShowExtraction}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">Datos extraídos</DialogTitle>
          </DialogHeader>
          {extracting ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Analizando PDF con IA...</p>
            </div>
          ) : extractedData.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No se encontraron datos de vinos en el documento.</p>
          ) : (
            <div className="space-y-4 pt-2">
              {extractedData.map((vino, i) => (
                <ExtractedVinoCard
                  key={i}
                  vino={vino}
                  bodegas={bodegas}
                  onSaved={() => {
                    setExtractedData((prev) => prev.filter((_, j) => j !== i));
                    if (extractedData.length <= 1) setShowExtraction(false);
                  }}
                />
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DocCard({
  doc,
  bodegaNombre,
  onDeleted,
  onRenamed,
}: {
  doc: Documento;
  bodegaNombre: string;
  onDeleted: () => void;
  onRenamed: () => void;
}) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editNombre, setEditNombre] = useState(doc.nombre);
  const [savingName, setSavingName] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      if (doc.storage_path) {
        await supabase.storage.from("documentos").remove([doc.storage_path]);
      }
      const { error } = await supabase.from("documentos").delete().eq("id", doc.id);
      if (error) throw error;
      toast.success("Documento eliminado");
      onDeleted();
    } catch (e: any) {
      toast.error(e.message || "Error al eliminar");
    } finally {
      setDeleting(false);
      setShowConfirm(false);
    }
  };

  const handleRename = async () => {
    if (!editNombre.trim()) return;
    setSavingName(true);
    try {
      const { error } = await supabase
        .from("documentos")
        .update({ nombre: editNombre.trim() })
        .eq("id", doc.id);
      if (error) throw error;
      toast.success("Nombre actualizado");
      setShowEdit(false);
      onRenamed();
    } catch (e: any) {
      toast.error(e.message || "Error al renombrar");
    } finally {
      setSavingName(false);
    }
  };

  return (
    <>
      <div
        className="group w-full text-left bg-card rounded-lg p-4 shadow-sm border border-border animate-fade-in cursor-pointer hover:border-primary/30 transition-colors"
        onClick={() => { setEditNombre(doc.nombre); setShowEdit(true); }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate mb-1">
              {doc.nombre}
            </h3>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
              <span className="px-1.5 py-0.5 bg-secondary rounded text-xs font-medium">
                {getTypeLabel(doc.tipo)}
              </span>
              <span>{bodegaNombre}</span>
              {doc.fecha_documento && (
                <>
                  <span className="text-border">·</span>
                  <span>
                    {new Date(doc.fecha_documento).toLocaleDateString("es-ES")}
                  </span>
                </>
              )}
              <span className="text-border">·</span>
              <span>{formatSize(doc.tamano_bytes)}</span>
            </div>
            {doc.etiquetas && doc.etiquetas.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {doc.etiquetas.map((tag, i) => (
                  <span
                    key={i}
                    className="px-1.5 py-0.5 bg-accent rounded text-xs text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); setShowConfirm(true); }}
              className="p-1.5 rounded-lg text-muted-foreground/0 group-hover:text-destructive hover:bg-destructive/10 transition-all"
              title="Eliminar documento"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <FileText className="w-5 h-5 text-muted-foreground/40" />
          </div>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle className="font-display text-base">Eliminar documento</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            ¿Eliminar <strong>{doc.nombre}</strong>? Esta acción no se puede deshacer.
          </p>
          <div className="flex gap-2 justify-end pt-2">
            <button
              onClick={() => setShowConfirm(false)}
              className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {deleting ? "Eliminando..." : "Eliminar"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit name dialog */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display">Editar documento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Nombre visible</label>
              <input
                type="text"
                value={editNombre}
                onChange={(e) => setEditNombre(e.target.value)}
                placeholder="Ej: Tajinaste — Ficha técnica 2026"
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/20"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Archivo original: {doc.storage_path?.split("/").pop() || "—"}
              </p>
            </div>
            <button
              onClick={handleRename}
              disabled={savingName || !editNombre.trim()}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {savingName ? "Guardando..." : "Guardar nombre"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ExtractedVinoCard({
  vino,
  bodegas,
  onSaved,
}: {
  vino: any;
  bodegas: { id: string; nombre: string }[];
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [action, setAction] = useState<"link" | "new" | "bodega" | null>(null);

  const handleCreateBodega = async () => {
    if (!vino.bodega) return;
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from("bodegas")
        .insert({ nombre: vino.bodega })
        .select("id")
        .single();
      if (error) throw error;
      toast.success(`Bodega "${vino.bodega}" creada`);
      onSaved();
    } catch (e: any) {
      toast.error(e.message || "Error");
    } finally {
      setSaving(false);
    }
  };

  const handleLinkToExisting = async () => {
    if (!vino.fuzzyMatch?.matchedId) return;
    setSaving(true);
    try {
      const updates: any = {};
      if (vino.precio) updates.precio_coste = vino.precio;
      if (vino.uvas) updates.uvas = vino.uvas;
      if (vino.do) updates.do = vino.do;
      if (vino.anada) updates.anada = vino.anada;
      if (vino.existingBodega) updates.bodega_id = vino.existingBodega.id;

      const { error } = await supabase
        .from("vinos")
        .update(updates)
        .eq("id", vino.fuzzyMatch.matchedId);
      if (error) throw error;
      toast.success(`Vino "${vino.fuzzyMatch.matchedName}" actualizado`);
      onSaved();
    } catch (e: any) {
      toast.error(e.message || "Error");
    } finally {
      setSaving(false);
    }
  };

  const handleAddNew = async () => {
    setSaving(true);
    try {
      const bodegaId = vino.existingBodega?.id || null;
      const { error } = await supabase.from("vinos").insert({
        nombre: vino.nombre || "Sin nombre",
        tipo: "tinto",
        isla: "Tenerife",
        do: vino.do || null,
        uvas: vino.uvas || null,
        anada: vino.anada || null,
        precio_coste: vino.precio || null,
        bodega_id: bodegaId,
      });
      if (error) throw error;
      toast.success(`Vino "${vino.nombre}" añadido`);
      onSaved();
    } catch (e: any) {
      toast.error(e.message || "Error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-3">
      <div className="space-y-1">
        <h4 className="text-sm font-semibold text-foreground">{vino.nombre || "—"}</h4>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {vino.bodega && <span>🏠 {vino.bodega}{vino.existingBodega ? " ✓" : ""}</span>}
          {vino.do && <span>📍 {vino.do}</span>}
          {vino.uvas && <span>🍇 {vino.uvas}</span>}
          {vino.anada && <span>📅 {vino.anada}</span>}
          {vino.precio && <span>💰 {vino.precio}€</span>}
        </div>
        {vino.fuzzyMatch && (
          <p className="text-xs text-primary mt-1">
            Coincide con: <strong>{vino.fuzzyMatch.matchedName}</strong> ({Math.round(vino.fuzzyMatch.similarity * 100)}%)
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {vino.bodega && !vino.existingBodega && (
          <button
            onClick={handleCreateBodega}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary text-secondary-foreground text-xs font-medium rounded-lg hover:bg-accent transition-colors disabled:opacity-50"
          >
            <Plus className="w-3 h-3" />
            Crear bodega
          </button>
        )}
        {vino.fuzzyMatch && (
          <button
            onClick={handleLinkToExisting}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Check className="w-3 h-3" />
            Vincular a existente
          </button>
        )}
        <button
          onClick={handleAddNew}
          disabled={saving}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary text-secondary-foreground text-xs font-medium rounded-lg hover:bg-accent transition-colors disabled:opacity-50"
        >
          <Plus className="w-3 h-3" />
          Añadir como nuevo
        </button>
      </div>
    </div>
  );
}
