import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import { BookingsService } from './booking.service';

describe('BookingsService', () => {
  let service: BookingsService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient()] });
    service = TestBed.inject(BookingsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
