export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      bodegas: {
        Row: {
          activa: boolean | null
          condiciones: string | null
          contacto_email: string | null
          contacto_nombre: string | null
          contacto_tel: string | null
          created_at: string | null
          distribuidor: string | null
          distribuidor_tel: string | null
          do: string | null
          id: string
          isla: string | null
          nombre: string
          notas: string | null
          tipo_entidad: string
          valoracion: number | null
          web: string | null
        }
        Insert: {
          activa?: boolean | null
          condiciones?: string | null
          contacto_email?: string | null
          contacto_nombre?: string | null
          contacto_tel?: string | null
          created_at?: string | null
          distribuidor?: string | null
          distribuidor_tel?: string | null
          do?: string | null
          id?: string
          isla?: string | null
          nombre: string
          notas?: string | null
          tipo_entidad?: string
          valoracion?: number | null
          web?: string | null
        }
        Update: {
          activa?: boolean | null
          condiciones?: string | null
          contacto_email?: string | null
          contacto_nombre?: string | null
          contacto_tel?: string | null
          created_at?: string | null
          distribuidor?: string | null
          distribuidor_tel?: string | null
          do?: string | null
          id?: string
          isla?: string | null
          nombre?: string
          notas?: string | null
          tipo_entidad?: string
          valoracion?: number | null
          web?: string | null
        }
        Relationships: []
      }
      documentos: {
        Row: {
          bodega_id: string | null
          created_at: string | null
          etiquetas: string[] | null
          fecha_documento: string | null
          id: string
          mime_type: string | null
          nombre: string
          notas: string | null
          procesado: boolean | null
          storage_path: string | null
          tamano_bytes: number | null
          tipo: string
          vino_id: string | null
        }
        Insert: {
          bodega_id?: string | null
          created_at?: string | null
          etiquetas?: string[] | null
          fecha_documento?: string | null
          id?: string
          mime_type?: string | null
          nombre: string
          notas?: string | null
          procesado?: boolean | null
          storage_path?: string | null
          tamano_bytes?: number | null
          tipo: string
          vino_id?: string | null
        }
        Update: {
          bodega_id?: string | null
          created_at?: string | null
          etiquetas?: string[] | null
          fecha_documento?: string | null
          id?: string
          mime_type?: string | null
          nombre?: string
          notas?: string | null
          procesado?: boolean | null
          storage_path?: string | null
          tamano_bytes?: number | null
          tipo?: string
          vino_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documentos_bodega_id_fkey"
            columns: ["bodega_id"]
            isOneToOne: false
            referencedRelation: "bodegas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_vino_id_fkey"
            columns: ["vino_id"]
            isOneToOne: false
            referencedRelation: "vinos"
            referencedColumns: ["id"]
          },
        ]
      }
      imagenes: {
        Row: {
          alt_text: string | null
          created_at: string | null
          id: string
          principal: boolean | null
          storage_path: string
          tipo: string
          url_publica: string | null
          vino_id: string
        }
        Insert: {
          alt_text?: string | null
          created_at?: string | null
          id?: string
          principal?: boolean | null
          storage_path: string
          tipo: string
          url_publica?: string | null
          vino_id: string
        }
        Update: {
          alt_text?: string | null
          created_at?: string | null
          id?: string
          principal?: boolean | null
          storage_path?: string
          tipo?: string
          url_publica?: string | null
          vino_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "imagenes_vino_id_fkey"
            columns: ["vino_id"]
            isOneToOne: false
            referencedRelation: "vinos"
            referencedColumns: ["id"]
          },
        ]
      }
      maridajes: {
        Row: {
          descripcion: string | null
          en_carta: boolean | null
          generado_ia: boolean | null
          id: string
          orden: number | null
          plato: string
          vino_id: string
        }
        Insert: {
          descripcion?: string | null
          en_carta?: boolean | null
          generado_ia?: boolean | null
          id?: string
          orden?: number | null
          plato: string
          vino_id: string
        }
        Update: {
          descripcion?: string | null
          en_carta?: boolean | null
          generado_ia?: boolean | null
          id?: string
          orden?: number | null
          plato?: string
          vino_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "maridajes_vino_id_fkey"
            columns: ["vino_id"]
            isOneToOne: false
            referencedRelation: "vinos"
            referencedColumns: ["id"]
          },
        ]
      }
      pedido_lineas: {
        Row: {
          cantidad: number
          cantidad_rec: number | null
          id: string
          notas: string | null
          pedido_id: string
          precio_ud: number
          vino_id: string
        }
        Insert: {
          cantidad: number
          cantidad_rec?: number | null
          id?: string
          notas?: string | null
          pedido_id: string
          precio_ud: number
          vino_id: string
        }
        Update: {
          cantidad?: number
          cantidad_rec?: number | null
          id?: string
          notas?: string | null
          pedido_id?: string
          precio_ud?: number
          vino_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pedido_lineas_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedido_lineas_vino_id_fkey"
            columns: ["vino_id"]
            isOneToOne: false
            referencedRelation: "vinos"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos: {
        Row: {
          bodega_id: string
          created_at: string | null
          documento_id: string | null
          estado: string | null
          factura_ref: string | null
          fecha_entrega: string | null
          fecha_pedido: string | null
          id: string
          importe_total: number | null
          notas: string | null
        }
        Insert: {
          bodega_id: string
          created_at?: string | null
          documento_id?: string | null
          estado?: string | null
          factura_ref?: string | null
          fecha_entrega?: string | null
          fecha_pedido?: string | null
          id?: string
          importe_total?: number | null
          notas?: string | null
        }
        Update: {
          bodega_id?: string
          created_at?: string | null
          documento_id?: string | null
          estado?: string | null
          factura_ref?: string | null
          fecha_entrega?: string | null
          fecha_pedido?: string | null
          id?: string
          importe_total?: number | null
          notas?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_pedidos_documento"
            columns: ["documento_id"]
            isOneToOne: false
            referencedRelation: "documentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_bodega_id_fkey"
            columns: ["bodega_id"]
            isOneToOne: false
            referencedRelation: "bodegas"
            referencedColumns: ["id"]
          },
        ]
      }
      price_history: {
        Row: {
          campo: string
          created_at: string | null
          id: string
          motivo: string | null
          pedido_id: string | null
          usuario: string | null
          valor_anterior: number | null
          valor_nuevo: number
          vino_id: string
        }
        Insert: {
          campo: string
          created_at?: string | null
          id?: string
          motivo?: string | null
          pedido_id?: string | null
          usuario?: string | null
          valor_anterior?: number | null
          valor_nuevo: number
          vino_id: string
        }
        Update: {
          campo?: string
          created_at?: string | null
          id?: string
          motivo?: string | null
          pedido_id?: string | null
          usuario?: string | null
          valor_anterior?: number | null
          valor_nuevo?: number
          vino_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_history_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_history_vino_id_fkey"
            columns: ["vino_id"]
            isOneToOne: false
            referencedRelation: "vinos"
            referencedColumns: ["id"]
          },
        ]
      }
      puntuaciones: {
        Row: {
          anada: number | null
          fecha: string | null
          guia: string
          id: string
          nota: string | null
          puntuacion: number | null
          vino_id: string
        }
        Insert: {
          anada?: number | null
          fecha?: string | null
          guia: string
          id?: string
          nota?: string | null
          puntuacion?: number | null
          vino_id: string
        }
        Update: {
          anada?: number | null
          fecha?: string | null
          guia?: string
          id?: string
          nota?: string | null
          puntuacion?: number | null
          vino_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "puntuaciones_vino_id_fkey"
            columns: ["vino_id"]
            isOneToOne: false
            referencedRelation: "vinos"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movimientos: {
        Row: {
          cantidad: number
          fecha: string | null
          id: string
          motivo: string | null
          notas: string | null
          pedido_id: string | null
          precio_ud: number | null
          tipo: string
          usuario: string | null
          vino_id: string
        }
        Insert: {
          cantidad: number
          fecha?: string | null
          id?: string
          motivo?: string | null
          notas?: string | null
          pedido_id?: string | null
          precio_ud?: number | null
          tipo: string
          usuario?: string | null
          vino_id: string
        }
        Update: {
          cantidad?: number
          fecha?: string | null
          id?: string
          motivo?: string | null
          notas?: string | null
          pedido_id?: string | null
          precio_ud?: number | null
          tipo?: string
          usuario?: string | null
          vino_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_movimientos_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movimientos_vino_id_fkey"
            columns: ["vino_id"]
            isOneToOne: false
            referencedRelation: "vinos"
            referencedColumns: ["id"]
          },
        ]
      }
      ventas: {
        Row: {
          cantidad: number
          created_at: string | null
          fecha: string
          id: string
          notas: string | null
          precio_coste: number | null
          precio_venta: number | null
          servicio: string | null
          vino_id: string
        }
        Insert: {
          cantidad: number
          created_at?: string | null
          fecha: string
          id?: string
          notas?: string | null
          precio_coste?: number | null
          precio_venta?: number | null
          servicio?: string | null
          vino_id: string
        }
        Update: {
          cantidad?: number
          created_at?: string | null
          fecha?: string
          id?: string
          notas?: string | null
          precio_coste?: number | null
          precio_venta?: number | null
          servicio?: string | null
          vino_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ventas_vino_id_fkey"
            columns: ["vino_id"]
            isOneToOne: false
            referencedRelation: "vinos"
            referencedColumns: ["id"]
          },
        ]
      }
      vinos: {
        Row: {
          anada: number | null
          bodega_id: string | null
          created_at: string | null
          descripcion_corta: string | null
          descripcion_en: string | null
          descripcion_larga: Json | null
          do: string | null
          estado: string | null
          foto_url: string | null
          id: string
          isla: string
          isla_normalizada: string | null
          margen_objetivo: number | null
          nombre: string
          notas_internas: string | null
          precio_carta: number | null
          precio_coste: number | null
          stock_actual: number | null
          tipo: string
          updated_at: string | null
          uvas: string | null
        }
        Insert: {
          anada?: number | null
          bodega_id?: string | null
          created_at?: string | null
          descripcion_corta?: string | null
          descripcion_en?: string | null
          descripcion_larga?: Json | null
          do?: string | null
          estado?: string | null
          foto_url?: string | null
          id?: string
          isla: string
          isla_normalizada?: string | null
          margen_objetivo?: number | null
          nombre: string
          notas_internas?: string | null
          precio_carta?: number | null
          precio_coste?: number | null
          stock_actual?: number | null
          tipo: string
          updated_at?: string | null
          uvas?: string | null
        }
        Update: {
          anada?: number | null
          bodega_id?: string | null
          created_at?: string | null
          descripcion_corta?: string | null
          descripcion_en?: string | null
          descripcion_larga?: Json | null
          do?: string | null
          estado?: string | null
          foto_url?: string | null
          id?: string
          isla?: string
          isla_normalizada?: string | null
          margen_objetivo?: number | null
          nombre?: string
          notas_internas?: string | null
          precio_carta?: number | null
          precio_coste?: number | null
          stock_actual?: number | null
          tipo?: string
          updated_at?: string | null
          uvas?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vinos_bodega_id_fkey"
            columns: ["bodega_id"]
            isOneToOne: false
            referencedRelation: "bodegas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
