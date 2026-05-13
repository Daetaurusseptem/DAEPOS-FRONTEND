import { Component } from '@angular/core';
import { BackButtonService } from 'src/app/services/back-button.service';

@Component({
  selector: 'app-back-button',
  templateUrl: './back-button.component.html',
  styleUrls: ['./back-button.component.css']
})
export class BackButtonComponent {

  constructor(private backButtonService: BackButtonService) {}

  goBack(): void {
    this.backButtonService.goBack();
  }
}
