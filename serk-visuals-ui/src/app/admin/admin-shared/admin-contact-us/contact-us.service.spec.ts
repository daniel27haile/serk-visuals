import { TestBed } from '@angular/core/testing';

import { ContactUsService } from './contact-us.service';

describe('UsersService', () => {
  let service: ContactUsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ContactUsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
