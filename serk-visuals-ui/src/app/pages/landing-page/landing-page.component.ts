import { Component } from '@angular/core';
import { BookingComponent } from "../booking/booking.component";

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [BookingComponent],
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.scss'
})
export class LandingPageComponent {

}
