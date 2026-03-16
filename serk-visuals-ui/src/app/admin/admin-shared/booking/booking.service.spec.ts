import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import { AdminApiService } from './booking.service';

describe('AdminApiService', () => {
  let service: AdminApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient()] });
    service = TestBed.inject(AdminApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
