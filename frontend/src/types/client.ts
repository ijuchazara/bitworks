export interface Client {
  id: number;
  client_code: string;
  name: string;
  description?: string | null;
  status: string;
  created_at: string; // ISO 8601 string from datetime
  product_api?: string | null;
  product_list?: string | null;
}

export interface ClientCreate {
  client_code: string;
  name: string;
  description?: string;
  product_api?: string;
  product_list?: string;
  attributes?: { [key: string]: string };
}

export interface ClientUpdate {
  name?: string;
  description?: string;
  status?: string;
  product_api?: string;
  product_list?: string;
  attributes?: { [key: string]: string };
}
