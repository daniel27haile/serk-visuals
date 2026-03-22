import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

interface SignResponse {
  url: string;       // S3 presigned PUT URL — for upload only, never for display
  key: string;       // S3 object key — pass to backend create/update endpoints
  publicUrl: string; // CloudFront URL — stable display URL, derived server-side from CDN_URL
  expiresIn: number;
  contentType: string;
}

export interface UploadResult {
  key: string;       // S3 object key — pass to backend as imageKey/thumbKey
  publicUrl: string; // CloudFront URL — use for immediate display in UI
}

const SIGN_URL = `${environment.apiUrl}/api/uploads/sign`;

@Injectable({ providedIn: 'root' })
export class UploadService {
  private http = inject(HttpClient);

  /**
   * Uploads a file directly to S3 via presigned URL.
   * 1. Gets presigned PUT URL and stable CloudFront URL from backend
   * 2. PUTs the file directly to S3 (awaits completion)
   * 3. Returns { key, publicUrl }:
   *    - key       → pass to backend create/update as imageKey/thumbKey
   *    - publicUrl → use immediately in UI for image display (CloudFront URL)
   */
  async upload(file: File, folder = 'uploads'): Promise<UploadResult> {
    const sign = await firstValueFrom(
      this.http.post<SignResponse>(
        SIGN_URL,
        { contentType: file.type, folder },
        { withCredentials: true }
      )
    );

    if (!sign.publicUrl) {
      console.error('[UploadService] Backend did not return publicUrl — CDN_URL may not be set on the server');
    }

    // Use fetch directly to avoid Angular interceptors adding auth cookies to the S3 PUT request
    const res = await fetch(sign.url, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type },
    });

    if (!res.ok) {
      console.error(`[UploadService] S3 PUT failed: ${res.status} ${res.statusText}`);
      throw new Error(`S3 upload failed: ${res.status} ${res.statusText}`);
    }

    return { key: sign.key, publicUrl: sign.publicUrl };
  }
}
