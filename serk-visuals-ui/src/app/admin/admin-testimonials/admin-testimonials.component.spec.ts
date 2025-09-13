import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminTestimonialsComponent } from './admin-testimonials.component';

describe('AdminTestimonialsComponent', () => {
  let component: AdminTestimonialsComponent;
  let fixture: ComponentFixture<AdminTestimonialsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminTestimonialsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminTestimonialsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
