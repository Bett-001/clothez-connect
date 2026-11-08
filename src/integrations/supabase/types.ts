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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      order_items: {
        Row: {
          color: string | null
          id: string
          line_total: number
          order_id: string
          product_id: string | null
          product_image: string | null
          product_name: string
          quantity: number
          size: string | null
          unit_price: number
        }
        Insert: {
          color?: string | null
          id?: string
          line_total: number
          order_id: string
          product_id?: string | null
          product_image?: string | null
          product_name: string
          quantity: number
          size?: string | null
          unit_price: number
        }
        Update: {
          color?: string | null
          id?: string
          line_total?: number
          order_id?: string
          product_id?: string | null
          product_image?: string | null
          product_name?: string
          quantity?: number
          size?: string | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          customer_email: string | null
          customer_id: string
          customer_name: string
          customer_phone: string
          delivery_address: string | null
          delivery_city: string | null
          delivery_fee: number
          fulfillment_method: Database["public"]["Enums"]["fulfillment_method"]
          id: string
          notes: string | null
          order_number: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_reference: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          status: Database["public"]["Enums"]["order_status"]
          store_id: string
          store_notes: string | null
          subtotal: number
          total: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_email?: string | null
          customer_id: string
          customer_name: string
          customer_phone: string
          delivery_address?: string | null
          delivery_city?: string | null
          delivery_fee?: number
          fulfillment_method?: Database["public"]["Enums"]["fulfillment_method"]
          id?: string
          notes?: string | null
          order_number?: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_reference?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          status?: Database["public"]["Enums"]["order_status"]
          store_id: string
          store_notes?: string | null
          subtotal: number
          total: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_email?: string | null
          customer_id?: string
          customer_name?: string
          customer_phone?: string
          delivery_address?: string | null
          delivery_city?: string | null
          delivery_fee?: number
          fulfillment_method?: Database["public"]["Enums"]["fulfillment_method"]
          id?: string
          notes?: string | null
          order_number?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_reference?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          status?: Database["public"]["Enums"]["order_status"]
          store_id?: string
          store_notes?: string | null
          subtotal?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          brand: string | null
          category: string
          colors: string[] | null
          created_at: string
          description: string | null
          featured: boolean
          id: string
          image_url: string | null
          images: string[] | null
          in_stock: boolean
          is_active: boolean
          material: string | null
          name: string
          original_price: number | null
          price: number
          product_type: string | null
          sizes: string[] | null
          stock: number
          store_id: string
          updated_at: string
        }
        Insert: {
          brand?: string | null
          category: string
          colors?: string[] | null
          created_at?: string
          description?: string | null
          featured?: boolean
          id?: string
          image_url?: string | null
          images?: string[] | null
          in_stock?: boolean
          is_active?: boolean
          material?: string | null
          name: string
          original_price?: number | null
          price: number
          product_type?: string | null
          sizes?: string[] | null
          stock?: number
          store_id: string
          updated_at?: string
        }
        Update: {
          brand?: string | null
          category?: string
          colors?: string[] | null
          created_at?: string
          description?: string | null
          featured?: boolean
          id?: string
          image_url?: string | null
          images?: string[] | null
          in_stock?: boolean
          is_active?: boolean
          material?: string | null
          name?: string
          original_price?: number | null
          price?: number
          product_type?: string | null
          sizes?: string[] | null
          stock?: number
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          default_address: string | null
          default_city: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          default_address?: string | null
          default_city?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          default_address?: string | null
          default_city?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      store_reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          rating: number
          reviewer_name: string | null
          store_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          reviewer_name?: string | null
          store_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          reviewer_name?: string | null
          store_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_reviews_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          accepts_cash: boolean
          address: string | null
          banner_url: string | null
          categories: string[]
          city: string | null
          created_at: string
          delivery_fee: number
          description: string | null
          email: string | null
          free_delivery_threshold: number | null
          id: string
          instagram: string | null
          is_featured: boolean
          location: string | null
          logo_url: string | null
          map_url: string | null
          mpesa_account: string | null
          mpesa_paybill: string | null
          mpesa_till: string | null
          name: string
          offers_delivery: boolean
          offers_pickup: boolean
          opening_hours: string | null
          owner_id: string
          phone: string | null
          rejection_reason: string | null
          status: Database["public"]["Enums"]["store_status"]
          tagline: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          accepts_cash?: boolean
          address?: string | null
          banner_url?: string | null
          categories?: string[]
          city?: string | null
          created_at?: string
          delivery_fee?: number
          description?: string | null
          email?: string | null
          free_delivery_threshold?: number | null
          id?: string
          instagram?: string | null
          is_featured?: boolean
          location?: string | null
          logo_url?: string | null
          map_url?: string | null
          mpesa_account?: string | null
          mpesa_paybill?: string | null
          mpesa_till?: string | null
          name: string
          offers_delivery?: boolean
          offers_pickup?: boolean
          opening_hours?: string | null
          owner_id: string
          phone?: string | null
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["store_status"]
          tagline?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          accepts_cash?: boolean
          address?: string | null
          banner_url?: string | null
          categories?: string[]
          city?: string | null
          created_at?: string
          delivery_fee?: number
          description?: string | null
          email?: string | null
          free_delivery_threshold?: number | null
          id?: string
          instagram?: string | null
          is_featured?: boolean
          location?: string | null
          logo_url?: string | null
          map_url?: string | null
          mpesa_account?: string | null
          mpesa_paybill?: string | null
          mpesa_till?: string | null
          name?: string
          offers_delivery?: boolean
          offers_pickup?: boolean
          opening_hours?: string | null
          owner_id?: string
          phone?: string | null
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["store_status"]
          tagline?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cancel_order: {
        Args: { _order_id: string }
        Returns: undefined
      }
      get_public_stores: {
        Args: never
        Returns: {
          accepts_cash: boolean
          address: string | null
          avg_rating: number | null
          banner_url: string | null
          categories: string[]
          city: string | null
          created_at: string
          delivery_fee: number
          description: string | null
          free_delivery_threshold: number | null
          id: string
          instagram: string | null
          is_featured: boolean
          location: string | null
          logo_url: string | null
          map_url: string | null
          mpesa_account: string | null
          mpesa_paybill: string | null
          mpesa_till: string | null
          name: string
          offers_delivery: boolean
          offers_pickup: boolean
          opening_hours: string | null
          product_count: number
          review_count: number
          status: Database["public"]["Enums"]["store_status"]
          tagline: string | null
          updated_at: string
          whatsapp: string | null
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      place_orders: {
        Args: {
          _customer_email: string
          _customer_name: string
          _customer_phone: string
          _delivery_address: string
          _delivery_city: string
          _fulfillment_method: Database["public"]["Enums"]["fulfillment_method"]
          _items: Json
          _notes: string
          _payment_method: Database["public"]["Enums"]["payment_method"]
        }
        Returns: Database["public"]["Tables"]["orders"]["Row"][]
      }
      submit_payment_reference: {
        Args: { _order_id: string; _reference: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "store_owner" | "user"
      fulfillment_method: "delivery" | "pickup"
      order_status:
        | "pending"
        | "confirmed"
        | "processing"
        | "shipped"
        | "delivered"
        | "cancelled"
      payment_method: "mpesa" | "cash"
      payment_status:
        | "unpaid"
        | "pending_verification"
        | "paid"
        | "failed"
        | "refunded"
      store_status: "pending" | "approved" | "rejected"
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
    Enums: {
      app_role: ["admin", "store_owner", "user"],
      fulfillment_method: ["delivery", "pickup"],
      order_status: ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"],
      payment_method: ["mpesa", "cash"],
      payment_status: ["unpaid", "pending_verification", "paid", "failed", "refunded"],
      store_status: ["pending", "approved", "rejected"],
    },
  },
} as const
