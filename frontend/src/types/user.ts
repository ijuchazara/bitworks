export interface User {
  id: number;
  username: string;
  client_id: number;
  status: string;
  created_at: string; // ISO 8601 string from datetime
  client_code?: string;
  client_name?: string;
}

export interface UserCreate {
  username: string;
  client_id: number;
  status?: string;
}

export interface UserUpdate {
  username?: string;
  client_id?: number;
  status?: string;
}
