import { Database } from "./database";

export type List = Database["public"]["Tables"]["lists"]["Row"];
export type Task = Database["public"]["Tables"]["tasks"]["Row"];

export type NewList = Database["public"]["Tables"]["lists"]["Insert"];
export type NewTask = Database["public"]["Tables"]["tasks"]["Insert"];

export interface UpdateList {
  name?: string;
  color?: string;
  sort_order?: number;
  icon?: string;
  is_default?: boolean;
}

export type UpdateTask = Database["public"]["Tables"]["tasks"]["Update"];
