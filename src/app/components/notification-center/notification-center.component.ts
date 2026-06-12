import { Component, OnInit, OnDestroy, HostListener, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { NotificationService } from 'src/app/services/notification.service';
import { Subscription } from 'rxjs';
import { SocketService } from 'src/app/services/socket.service';

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
  private socketSub!: Subscription;

  constructor(
    private notificationService: NotificationService,
    private socketService: SocketService,
    private router: Router,
    private elementRef: ElementRef
  ) { }

  ngOnInit(): void {
    // Carga inicial
    this.loadNotifications();

    // Escuchar notificaciones en tiempo real vía Socket.IO
    this.socketSub = this.socketService.onEvent<any>('new-notification').subscribe({
      next: (newNotif) => {
        // Añadir al principio de la lista
        this.notifications = [newNotif, ...this.notifications];
        this.updateUnreadCount();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.socketSub) {
      this.socketSub.unsubscribe();
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
