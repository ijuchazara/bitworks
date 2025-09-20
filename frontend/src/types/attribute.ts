export interface Attribute {
  id: number;
  client_id: number;
  template_id: number;
  value: string;
  updated_at: string; // ISO 8601 string from datetime
  client_code?: string;
  client_name?: string;
  template_key?: string;
  template_description?: string;
  template_data_type?: string;
}

export interface AttributeCreate {
  client_id: number;
  template_id: number;
  value: string;
}

export interface AttributeUpdate {
  client_id?: number;
  template_id?: number;
  value?: string;
}
