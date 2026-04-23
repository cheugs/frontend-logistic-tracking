import {
  Component, AfterViewInit, OnDestroy,
  ElementRef, ViewChild, ChangeDetectionStrategy, signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export class LandingComponent implements AfterViewInit, OnDestroy {
  @ViewChild('heroBox') heroBoxRef!: ElementRef<HTMLDivElement>;

  navScrolled = signal(false);
  private floatFrame = 0;
  private onScroll = () => this.navScrolled.set(window.scrollY > 40);
  private onMouse  = this.handleMouse.bind(this);

  features = [
    { icon: 'radio',  label: 'Live Tracking',      body: 'Every carrier event in under 15ms.' },
    { icon: 'brain',  label: 'Predictive ETA',      body: 'ML models beat carrier estimates by 38%.' },
    { icon: 'globe',  label: '300+ Carriers',       body: 'One integration, any route worldwide.' },
    { icon: 'bell',   label: 'Exception Alerts',    body: 'Fires before your customer ever notices.' },
    { icon: 'layout', label: 'White-label Portal',  body: 'Your brand, your domain, zero front-end code.' },
    { icon: 'shield', label: 'Chain of Custody',    body: 'SOC 2 Type II — immutable audit logs.' },
  ];

  steps = [
    { n: '01', title: 'Connect carriers',   body: '300+ OAuth integrations, live in minutes.' },
    { n: '02', title: 'Events flow in',     body: 'Every scan arrives in milliseconds.' },
    { n: '03', title: 'Rules fire actions', body: 'SLA alerts trigger the moment conditions are met.' },
    { n: '04', title: 'Customers see it',   body: 'Branded portal cuts WISMO tickets by 70%.' },
  ];

  constructor(private router: Router) {}

  ngAfterViewInit(): void {
    window.addEventListener('scroll', this.onScroll, { passive: true });
    document.addEventListener('mousemove', this.onMouse);
    this.startFloat();
    this.initScrollSequence();
  }

  private startFloat(): void {
    let t = 0;
    const tick = () => {
      t += .008;
      const b = this.heroBoxRef?.nativeElement;
      if (b) b.style.transform =
        `rotateX(${-22 + Math.sin(t * .7) * 6}deg) rotateY(${28 + Math.sin(t) * 12}deg)`;
      this.floatFrame = requestAnimationFrame(tick);
    };
    this.floatFrame = requestAnimationFrame(tick);
  }

  private handleMouse(e: MouseEvent): void {
    const b = this.heroBoxRef?.nativeElement;
    if (!b) return;
    const dx = (e.clientX - window.innerWidth  / 2) / (window.innerWidth  / 2);
    const dy = (e.clientY - window.innerHeight / 2) / (window.innerHeight / 2);
    b.style.transition = 'transform 1.2s cubic-bezier(.16,1,.3,1)';
    b.style.transform  = `rotateX(${-22 - dy * 9}deg) rotateY(${28 + dx * 18}deg)`;
    setTimeout(() => { if (b) b.style.transition = ''; }, 1300);
  }

  private initScrollSequence(): void {
    const ease = (t: number) => 1 - Math.pow(1 - Math.max(0, Math.min(t, 1)), 3);
    const spacer = document.querySelector('.seq-spacer') as HTMLElement;
    const box    = document.getElementById('seqBox');
    const cards  = [0,1,2].map(i => document.getElementById('ck'+i));
    const wins   = [[.08,.36],[.30,.58],[.52,.80]];
    if (!spacer || !box) return;
    window.addEventListener('scroll', () => {
      const r    = spacer.getBoundingClientRect();
      const prog = Math.max(0, Math.min(1, -r.top / (spacer.offsetHeight - window.innerHeight)));
      const det  = ease(prog / .30);
      box.style.transform = `translateX(${det*110}px) translateY(${det*72}px) rotateX(${-22+det*14}deg) rotateY(${28+det*44}deg)`;
      wins.forEach(([s,e], i) => {
        const loc = ease((prog - s) / (e - s));
        if (cards[i]) {
          (cards[i] as HTMLElement).style.opacity   = String(loc);
          (cards[i] as HTMLElement).style.transform = `translateX(${(1-loc)*60}px) scale(${.92+loc*.08})`;
        }
      });
    }, { passive: true });
  }

  goToOnboarding(): void { this.router.navigate(['/onboarding']); }
  goToLogin():      void { this.router.navigate(['/login']); }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.floatFrame);
    window.removeEventListener('scroll', this.onScroll);
    document.removeEventListener('mousemove', this.onMouse);
  }
}