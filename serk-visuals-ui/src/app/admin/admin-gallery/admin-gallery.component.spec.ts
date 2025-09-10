import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminGalleryComponent } from './admin-gallery.component';

describe('AdminGalleryComponent', () => {
  let component: AdminGalleryComponent;
  let fixture: ComponentFixture<AdminGalleryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminGalleryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminGalleryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
