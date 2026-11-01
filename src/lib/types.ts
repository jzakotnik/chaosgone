export type Box = {
  id: number;
  name: string;
  icon: string;
  color: string;
  created_at: string;
  item_count?: number;
};

export type Item = {
  id: number;
  box_id: number;
  box_name?: string;
  name: string;
  quantity: number | null;
  ean: string | null;
  description: string;
  notes: string;
  /** A set of different small things kept together (e.g. assorted dowels and screws). */
  is_collection: boolean;
  /** Created by batch import and not looked at by a human yet. */
  needs_review: boolean;
  created_at: string;
  updated_at: string;
  photos: string[];
};

export type ItemInput = {
  box_id: number;
  name: string;
  quantity?: number | null;
  ean?: string | null;
  description?: string;
  notes?: string;
  is_collection?: boolean;
  needs_review?: boolean;
  photos?: string[];
};
