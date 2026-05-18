import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { NotificationService } from 'src/app/services/notification.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-notifications-page',
  templateUrl: './notifications-page.component.html',
  styleUrls: ['./notifications-page.component.css']
})
export class NotificationsPageComponent implements OnInit, OnDestroy {
  notifications: any[] = [];
  isLoading: boolean = true;
  activeFilter: 'all' | 'unread' = 'all';
  unreadCount: number = 0;
  private autoRefreshSub!: any;

  constructor(
    private notificationService: NotificationService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadNotifications();
    
    // Auto refrescar cada 30 segundos en la pantalla completa para ver cambios en tiempo real
    this.autoRefreshSub = setInterval(() => {
      this.loadNotifications(false);
    }, 30000);
  }

  ngOnDestroy(): void {
    if (this.autoRefreshSub) {
      clearInterval(this.autoRefreshSub);
    }
  }

  loadNotifications(showSpinner: boolean = true): void {
    if (showSpinner) this.isLoading = true;
    
    this.notificationService.getMyNotifications().subscribe({
      next: (resp: any) => {
        if (resp.ok) {
          this.notifications = resp.notifications || [];
          this.unreadCount = this.notifications.filter(n => !n.isRead).length;
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading notifications page:', err);
        this.isLoading = false;
      }
    });
  }

  setFilter(filter: 'all' | 'unread'): void {
    this.activeFilter = filter;
  }

  getFilteredNotifications(): any[] {
    if (this.activeFilter === 'unread') {
      return this.notifications.filter(n => !n.isRead);
    }
    return this.notifications;
  }

  markAsRead(notif: any, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    if (!notif.isRead) {
      this.notificationService.markAsRead(notif._id).subscribe({
        next: (resp: any) => {
          if (resp.ok) {
            notif.isRead = true;
            this.unreadCount = this.notifications.filter(n => !n.isRead).length;
          }
        }
      });
    }
  }

  markAllAsRead(): void {
    if (this.unreadCount === 0) return;

    this.notificationService.markAllAsRead().subscribe({
      next: (resp: any) => {
        if (resp.ok) {
          this.notifications.forEach(n => n.isRead = true);
          this.unreadCount = 0;
        }
      }
    });
  }

  handleNotificationClick(notif: any): void {
    if (!notif.isRead) {
      this.notificationService.markAsRead(notif._id).subscribe({
        next: () => {
          notif.isRead = true;
          this.unreadCount = this.notifications.filter(n => !n.isRead).length;
        }
      });
    }

    if (notif.link) {
      this.router.navigateByUrl(notif.link);
    }
  }
}
