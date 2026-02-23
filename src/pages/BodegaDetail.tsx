import { useParams, useNavigate } from "react-router-dom";
import { useBodegaDetail } from "@/hooks/useBodegas";
import { useState, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Save, ExternalLink, Phone, Mail, Trash2 } from "lucide-react";
import { toast } from "sonner";
import StarRating from "@/components/StarRating";
import { calcMarginReal, getMarginStatus, getMarginColor } from "@/lib/margins";
import { useMarginSettings } from "@/hooks/useMarginSettings";

interface VinoRow {
  id: string;
  nombre: string;
  tipo: string;
  precio_carta: number | null;
  precio_coste: number | null;
  stock_actual: number | null;
}

export default function BodegaDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { bodega, loading, updateBodega } = useBodegaDetail(id);
  const { getMarginFor } = useMarginSettings();

  const [nombre, setNombre] = useState("");
  const [isla, setIsla] = useState("");
  const [dop, setDop] = useState("");
  const [web, setWeb] = useState("");
  const [contactoNombre, setContactoNombre] = useState("");
  const [contactoTel, setContactoTel] = useState("");
  const [contactoEmail, setContactoEmail] = useState("");
  const [distribuidor, setDistribuidor] = useState("");
  const [distribuidorTel, setDistribuidorTel] = useState("");
  const [valoracion, setValoracion] = useState(0);
  const [condiciones, setCondiciones] = useState("");
  const [notas, setNotas] = useState("");
  const [vinos, setVinos] = useState<VinoRow[]>([]);

  useEffect(() => {
    if (!bodega) return;
    setNombre(bodega.nombre);
    setIsla(bodega.isla || "");
    setDop(bodega.do || "");
    setWeb(bodega.web || "");
    setContactoNombre(bodega.contacto_nombre || "");
    setContactoTel(bodega.contacto_tel || "");
    setContactoEmail(bodega.contacto_email || "");
    setDistribuidor(bodega.distribuidor || "");
    setDistribuidorTel(bodega.distribuidor_tel || "");
    setValoracion(bodega.valoracion || 0);
    setCondiciones(bodega.condiciones || "");
    setNotas(bodega.notas || "");
  }, [bodega]);

  // Fetch wines for this bodega
  useEffect(() => {
    if (!id) return;
    supabase
      .from("vinos")
      .select("id, nombre, tipo, precio_carta, precio_coste, stock_actual")
      .eq("bodega_id", id)
      .order("nombre")
      .then(({ data }) => {
        if (data) setVinos(data);
      });
  }, [id]);

  const handleSave = async () => {
    const { error } = await updateBodega({
      nombre,
      isla: isla || null,
      do: dop || null,
      web: web || null,
      contacto_nombre: contactoNombre || null,
      contacto_tel: contactoTel || null,
      contacto_email: contactoEmail || null,
      distribuidor: distribuidor || null,
      distribuidor_tel: distribuidorTel || null,
      valoracion: valoracion || null,
      condiciones: condiciones || null,
      notas: notas || null,
    });
    if (error) {
      toast.error("Error al guardar");
    } else {
      toast.success("Bodega guardada");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Cargando...</p>
      </div>
    );
  }

  if (!bodega) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Bodega no encontrada</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container max-w-2xl py-3 flex items-center gap-3">
          <button
            onClick={() => navigate("/bodegas")}
            className="p-2 -ml-2 rounded-lg hover:bg-accent transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="font-display text-lg font-bold text-foreground truncate">
            Ficha de bodega
          </h1>
        </div>
      </header>

      <main className="container max-w-2xl py-6 space-y-6 animate-fade-in">
        {/* Datos básicos */}
        <div className="bg-card rounded-xl border border-border p-4 space-y-4">
          <h2 className="font-display text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Datos básicos
          </h2>
          <FieldInput label="Nombre" value={nombre} onChange={setNombre} />
          <FieldInput label="Isla" value={isla} onChange={setIsla} />
          <FieldInput label="D.O." value={dop} onChange={setDop} />
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Web</label>
            <div className="flex gap-2">
              <input
                type="url"
                value={web}
                onChange={(e) => setWeb(e.target.value)}
                className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20"
              />
              {web && (
                <a
                  href={web.startsWith("http") ? web : `https://${web}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-secondary hover:bg-accent transition-colors shrink-0"
                >
                  <ExternalLink className="w-4 h-4 text-muted-foreground" />
                </a>
              )}
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">
              Valoración interna
            </label>
            <StarRating value={valoracion} onChange={setValoracion} />
          </div>
        </div>

        {/* Contacto */}
        <div className="bg-card rounded-xl border border-border p-4 space-y-4">
          <h2 className="font-display text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Contacto
          </h2>
          <FieldInput label="Nombre contacto" value={contactoNombre} onChange={setContactoNombre} />
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Teléfono</label>
            <div className="flex gap-2">
              <input
                type="tel"
                value={contactoTel}
                onChange={(e) => setContactoTel(e.target.value)}
                className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20"
              />
              {contactoTel && (
                <a
                  href={`tel:${contactoTel}`}
                  className="p-2 rounded-lg bg-secondary hover:bg-accent transition-colors shrink-0"
                >
                  <Phone className="w-4 h-4 text-muted-foreground" />
                </a>
              )}
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Email</label>
            <div className="flex gap-2">
              <input
                type="email"
                value={contactoEmail}
                onChange={(e) => setContactoEmail(e.target.value)}
                className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20"
              />
              {contactoEmail && (
                <a
                  href={`mailto:${contactoEmail}`}
                  className="p-2 rounded-lg bg-secondary hover:bg-accent transition-colors shrink-0"
                >
                  <Mail className="w-4 h-4 text-muted-foreground" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Distribuidor */}
        <div className="bg-card rounded-xl border border-border p-4 space-y-4">
          <h2 className="font-display text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Distribuidor
          </h2>
          <FieldInput label="Nombre distribuidor" value={distribuidor} onChange={setDistribuidor} />
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Teléfono distribuidor</label>
            <div className="flex gap-2">
              <input
                type="tel"
                value={distribuidorTel}
                onChange={(e) => setDistribuidorTel(e.target.value)}
                className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20"
              />
              {distribuidorTel && (
                <a
                  href={`tel:${distribuidorTel}`}
                  className="p-2 rounded-lg bg-secondary hover:bg-accent transition-colors shrink-0"
                >
                  <Phone className="w-4 h-4 text-muted-foreground" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Condiciones & Notas */}
        <div className="bg-card rounded-xl border border-border p-4 space-y-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              Condiciones comerciales
            </label>
            <textarea
              value={condiciones}
              onChange={(e) => setCondiciones(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 bg-background border border-border rounded-lg text-[15px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 resize-none"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              Notas internas
            </label>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 bg-background border border-border rounded-lg text-[15px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 resize-none"
            />
          </div>
        </div>

        {/* Vinos de esta bodega */}
        {vinos.length > 0 && (
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <h2 className="font-display text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Vinos en carta ({vinos.length})
              </h2>
            </div>
            <div className="divide-y divide-border">
              {vinos.map((vino) => {
                const marginTarget = getMarginFor(vino.tipo);
                const marginReal = calcMarginReal(vino.precio_carta, vino.precio_coste);
                const marginStatus = getMarginStatus(marginReal, marginTarget);

                return (
                  <div key={vino.id} className="px-4 py-3 flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {vino.nombre}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 text-sm">
                      <span className="text-muted-foreground">
                        {vino.stock_actual ?? 0} ud.
                      </span>
                      {vino.precio_carta && (
                        <span className="font-medium text-foreground">
                          {vino.precio_carta}€
                        </span>
                      )}
                      {marginReal !== null && (
                        <span
                          className="font-medium text-xs"
                          style={{ color: getMarginColor(marginStatus) }}
                        >
                          {marginReal.toFixed(0)}%
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Save */}
        <button
          onClick={handleSave}
          className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-lg font-medium hover:opacity-90 transition-opacity"
        >
          <Save className="w-4 h-4" />
          Guardar
        </button>

        {/* Delete */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium text-destructive border border-destructive/30 hover:bg-destructive/10 transition-colors">
              <Trash2 className="w-4 h-4" />
              Eliminar bodega
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar esta bodega?</AlertDialogTitle>
              <AlertDialogDescription>
                Los vinos vinculados quedarán sin bodega asignada. Esta acción no se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={async () => {
                  // Unlink wines
                  await supabase
                    .from("vinos")
                    .update({ bodega_id: null })
                    .eq("bodega_id", id!);
                  // Delete bodega
                  const { error } = await supabase
                    .from("bodegas")
                    .delete()
                    .eq("id", id!);
                  if (error) {
                    toast.error("Error al eliminar");
                  } else {
                    toast.success("Bodega eliminada");
                    navigate("/bodegas");
                  }
                }}
              >
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
}

function FieldInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20"
      />
    </div>
  );
}
