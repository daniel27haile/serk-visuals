import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PricingConfig } from '../models/pricing-config.model';

const BASE       = `${environment.apiUrl}/pricing-config`;
const ADMIN_BASE = `${environment.apiUrl}/admin/pricing-config`;

@Injectable({ providedIn: 'root' })
export class PricingConfigService {
  private http = inject(HttpClient);

  getConfig(sessionType: string): Observable<PricingConfig> {
    return this.http.get<PricingConfig>(`${BASE}/${encodeURIComponent(sessionType)}`);
  }

  getAllConfigs(): Observable<PricingConfig[]> {
    return this.http.get<PricingConfig[]>(ADMIN_BASE);
  }

  updateConfig(sessionType: string, config: Partial<PricingConfig>): Observable<PricingConfig> {
    return this.http.put<PricingConfig>(
      `${ADMIN_BASE}/${encodeURIComponent(sessionType)}`,
      config,
    );
  }
}
