import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './bottom-nav.component.html',
  styleUrls: ['./bottom-nav.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BottomNavComponent {
  activeRoute = '';

  constructor(private readonly router: Router) {
    this.router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe((event) => {
      this.activeRoute = (event as NavigationEnd).urlAfterRedirects;
    });
    this.activeRoute = this.router.url;
  }

  isActive(path: string): boolean {
    return this.activeRoute.startsWith(path);
  }
}