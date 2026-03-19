import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';

import { BookingFormPage } from './booking.component';

describe('BookingComponent', () => {
  let component: BookingFormPage;
  let fixture: ComponentFixture<BookingFormPage>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BookingFormPage],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BookingFormPage);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    // No detectChanges — constructor calls loadFeatured() async; requests are drained in afterEach
  });

  afterEach(() => {
    httpMock.match(() => true); // drain requests queued by the constructor (loadFeatured)
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
