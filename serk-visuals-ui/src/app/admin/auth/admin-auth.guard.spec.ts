import { TestBed } from '@angular/core/testing';

import { adminAuthGuard } from './admin-auth.guard';

describe('adminAuthGuard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(adminAuthGuard).toBeTruthy();
  });
});
