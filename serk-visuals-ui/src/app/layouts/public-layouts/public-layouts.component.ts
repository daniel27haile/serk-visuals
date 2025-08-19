import { Component } from '@angular/core';
import { HeaderComponent } from "../../header/header.component";
import { RouterOutlet } from "@angular/router";
import { FooterComponent } from "../../footer/footer.component";

@Component({
  selector: 'app-public-layouts',
  standalone: true,
  imports: [HeaderComponent, RouterOutlet, FooterComponent],
  templateUrl: './public-layouts.component.html',
  styleUrl: './public-layouts.component.scss'
})
export class PublicLayoutsComponent {

}
