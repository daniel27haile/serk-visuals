import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BookingComponent } from "./pages/booking/booking.component";
import { RouterLink } from '@angular/router';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, BookingComponent, RouterLink],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'serk-visuals-ui';
}
