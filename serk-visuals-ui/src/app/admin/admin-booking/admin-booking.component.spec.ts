import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';

import { AdminBookingComponent } from './admin-booking.component';

describe('BookingComponent', () => {
  let component: AdminBookingComponent;
  let fixture: ComponentFixture<AdminBookingComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminBookingComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminBookingComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    // No detectChanges — prevents ngOnInit from calling the bookings API and subscribing to filters
  });

  afterEach(() => {
    httpMock.match(() => true); // drain any pending requests
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
