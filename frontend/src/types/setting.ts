export interface Setting {
  id: number;
  key: string;
  value: string;
  description?: string;
  updated_at: string; // ISO 8601 string from datetime
}

export interface SettingCreate {
  key: string;
  value: string;
  description?: string;
}

export interface SettingUpdate {
  key?: string;
  value?: string;
  description?: string;
}
