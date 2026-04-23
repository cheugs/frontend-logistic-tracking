import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

// interface Slide {
//   step: number; total: number;
//   illustration: 'truck' | 'pickup' | 'qr';
//   title: string; body: string;
// }

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './onboarding.component.html',
  styleUrls: ['./onboarding.component.scss']
})
export class OnboardingComponent {
  current = signal(0);

//   slides: Slide[] = [
//     { step:1, total:3, illustration:'truck',
//       title:'Sending Parcels Has Never Been This Stress-Free',
//       body:'Easily send your packages to friends, family, or customers in just a few taps.' },
//     { step:2, total:3, illustration:'pickup',
//       title:'Your Package Is Here, Pick It Up Easily from the Rider',
//       body:'Simply confirm with the rider and pick up your package quickly and safely.' },
//     { step:3, total:3, illustration:'qr',
//       title:'Scan the QR Code to Confirm Pickup or Delivery',
//       body:'Easily scan the QR code to confirm delivery. This helps us ensure your package is correct.' },
//   ];


 slides = [
    { key:'truck',  headline:'Sending Parcels Has Never Been This Stress-Free',  body:'Easily send your packages to friends, family, or customers in just a few taps.' },
    { key:'rider',  headline:'Your Package Is Here, Pick It Up Easily from the Rider', body:'Simply confirm with the rider and pick up your package quickly and safely.' },
    { key:'qr',     headline:'Scan the QR Code to Confirm Pickup or Delivery',   body:'Easily scan the QR code to confirm delivery. This helps us ensure your package is correct.' },
  ];
  constructor(private router: Router) {}

  next()     { if (this.current() < this.slides.length-1) this.current.update(v=>v+1); else this.router.navigate(['/login']); }
  skip()     { this.router.navigate(['/login']); }
  goLogin()    { this.router.navigate(['/login']); }
  goRegister() { this.router.navigate(['/register']); }
}