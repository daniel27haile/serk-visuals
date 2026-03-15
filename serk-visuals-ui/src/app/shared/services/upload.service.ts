import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

interface SignResponse {
  url: string;
  key: string;
  publicUrl: string;
  expiresIn: number;
  contentType: string;
}

const SIGN_URL = `${environment.apiUrl}/api/uploads/sign`;

@Injectable({ providedIn: 'root' })
export class UploadService {
  private http = inject(HttpClient);

  /**
   * Uploads a file directly to S3 via presigned URL.
   * 1. Gets presigned PUT URL from backend
   * 2. PUTs the file directly to S3
   * 3. Returns the S3 object key (pass this to create/update endpoints)
   */
  async upload(file: File, folder = 'uploads'): Promise<string> {
    const sign = await firstValueFrom(
      this.http.post<SignResponse>(
        SIGN_URL,
        { contentType: file.type, folder },
        { withCredentials: true }
      )
    );

    // Use fetch directly to avoid Angular interceptors adding auth cookies to the S3 request
    const res = await fetch(sign.url, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type },
    });

    if (!res.ok) {
      throw new Error(`S3 upload failed: ${res.status} ${res.statusText}`);
    }

    return sign.key;
  }
}
