export interface ClientAttributeData {
  template_id: number;
  value: string;
}

export interface Client {
  id: number;
  client_code: string;
  name: string;
  status: string;
  created_at: string; // ISO 8601 string from datetime
}

export interface ClientCreate {
  client_code: string;
  name: string;
  attributes?: ClientAttributeData[];
}

export interface ClientUpdate {
  name?: string;
  status?: string;
  attributes?: ClientAttributeData[];
}
