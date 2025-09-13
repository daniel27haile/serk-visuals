// src/app/contact-us/contact-us.model.ts
export interface ContactRequest {
  fullName: string;
  email: string;
  subject: string;
  message: string;
  // Honeypot (bots will fill; humans won't). Leave empty from UI.
  hp?: string;
}

export interface ContactResponse {
  id: string;
  message: string;
  data?: unknown;
}

export interface ApiError {
  error: string;
  details?: Array<{ path?: string[]; message?: string }>;
}
