import { Component } from '@angular/core';
import { Event, NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router } from '@angular/router';
import { SpinnerService } from '../services/spinner.service';
import { SidebarService } from '../services/sidebar.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-pages',
  templateUrl: './pages.component.html',
  styleUrls: ['./pages.component.css']
})
export class PagesComponent {
  isCollapsed: boolean = true;
  currentDate: Date = new Date();

  constructor(
    private router: Router, 
    private spinnerService: SpinnerService,
    public sidebarService: SidebarService,
    public authService: AuthService
  ) {
    this.sidebarService.isCollapsed$.subscribe(collapsed => {
      this.isCollapsed = collapsed;
    });

    this.router.events.subscribe((event: Event) => {
      switch (true) {
        case event instanceof NavigationStart:
          this.spinnerService.show();
          break;

        case event instanceof NavigationEnd:
        case event instanceof NavigationCancel:
        case event instanceof NavigationError:
          this.spinnerService.hide();
          break;
      }
    });
  }
}
