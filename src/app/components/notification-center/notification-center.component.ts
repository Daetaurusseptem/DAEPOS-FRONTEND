import { Component, OnInit, OnDestroy, HostListener, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { NotificationService } from 'src/app/services/notification.service';
import { Subscription, interval } from 'rxjs';
import { startWith, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-notification-center',
  templateUrl: './notification-center.component.html',
  styleUrls: ['./notification-center.component.css']
})
export class NotificationCenterComponent implements OnInit, OnDestroy {
  notifications: any[] = [];
  unreadCount: number = 0;
  showDropdown: boolean = false;
  activeFilter: 'all' | 'unread' = 'all';
  private pollingSub!: Subscription;

  constructor(
    private notificationService: NotificationService,
    private router: Router,
    private elementRef: ElementRef
  ) { }

  ngOnInit(): void {
    // Polling ligero cada 30 segundos
    this.pollingSub = interval(30000)
      .pipe(
        startWith(0),
        switchMap(() => this.notificationService.getMyNotifications())
      )
      .subscribe({
        next: (resp: any) => {
          if (resp.ok) {
            this.notifications = resp.notifications || [];
            this.updateUnreadCount();
          }
        },
        error: (err) => {
          console.error('Error polling notifications:', err);
        }
      });
  }

  ngOnDestroy(): void {
    if (this.pollingSub) {
      this.pollingSub.unsubscribe();
    }
  }

  updateUnreadCount(): void {
    this.unreadCount = this.notifications.filter(n => !n.isRead).length;
  }

  toggleDropdown(): void {
    this.showDropdown = !this.showDropdown;
    // Si se abre, refrescar notificaciones para asegurar tiempo real
    if (this.showDropdown) {
      this.loadNotifications();
    }
  }

  loadNotifications(): void {
    this.notificationService.getMyNotifications().subscribe({
      next: (resp: any) => {
        if (resp.ok) {
          this.notifications = resp.notifications || [];
          this.updateUnreadCount();
        }
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

  handleNotificationClick(notif: any): void {
    // Si no está leída, marcar como leída en backend
    if (!notif.isRead) {
      this.notificationService.markAsRead(notif._id).subscribe({
        next: () => {
          notif.isRead = true;
          this.updateUnreadCount();
        }
      });
    }

    this.showDropdown = false;

    // Navegación profunda al enlace asociado
    if (notif.link) {
      this.router.navigateByUrl(notif.link);
    }
  }

  markAllAsRead(): void {
    if (this.unreadCount === 0) return;

    this.notificationService.markAllAsRead().subscribe({
      next: (resp: any) => {
        if (resp.ok) {
          this.notifications.forEach(n => n.isRead = true);
          this.updateUnreadCount();
        }
      }
    });
  }

  goToNotificationsPage(): void {
    this.showDropdown = false;
    this.router.navigateByUrl('/dashboard/notifications');
  }

  // Cerrar dropdown al hacer click fuera del componente
  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.showDropdown = false;
    }
  }
}
