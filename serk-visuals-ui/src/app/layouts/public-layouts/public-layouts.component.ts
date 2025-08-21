import { Component } from '@angular/core';
import { HeaderComponent } from "../../header/header.component";
import { RouterOutlet } from "@angular/router";
import { FooterComponent } from "../../footer/footer.component";
import { GalleryPage } from "../../pages/gallery/gallery.component";
import { BookingFormPage } from "../../pages/booking/booking.component";
import { AboutUsComponent } from "../../pages/about-us/about-us.component";
import { ContactUsComponent } from "../../pages/contact-us/contact-us.component";

@Component({
  selector: 'app-public-layouts',
  standalone: true,
  imports: [HeaderComponent, RouterOutlet, FooterComponent, GalleryPage, BookingFormPage, AboutUsComponent, ContactUsComponent],
  templateUrl: './public-layouts.component.html',
  styleUrl: './public-layouts.component.scss'
})
export class PublicLayoutsComponent {

}
