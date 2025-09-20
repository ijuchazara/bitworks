export interface Template {
  id: number;
  key: string;
  description: string;
  data_type: string;
  status: string;
}

export interface TemplateCreate {
  key: string;
  description: string;
  data_type: string;
  status?: string; // Optional as it has a default value in the backend
}

export interface TemplateUpdate {
  key?: string;
  description?: string;
  data_type?: string;
  status?: string;
}
