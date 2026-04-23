import { Injectable, signal, computed } from '@angular/core';
import { ParcelWizardState, ParcelQuoteResponse, DeliveryMode, PackageSize } from '../models/parcel.model';
import { ParcelService } from '../../shared/services/parcel.service';
import { catchError, tap } from 'rxjs/operators';
import { of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ParcelWizardService {
  private readonly initialState: ParcelWizardState = {
    step: 1,
    sourceAgencyId: null,
    destAgencyId: null,
    receiverName: '',
    receiverPhone: '',
    weight: 1.0,
    fragility: 1,
    quote: null,
    deliveryMode: 'INSTANT',
    packageSize: 'SMALL'
  };

  readonly state = signal<ParcelWizardState>(this.initialState);

  // Computed signals for UI
  readonly currentStep = computed(() => this.state().step);
  readonly canProceedToQuote = computed(() => 
    !!this.state().sourceAgencyId && 
    !!this.state().destAgencyId && 
    !!this.state().receiverName && 
    !!this.state().receiverPhone
  );

  constructor(private parcelService: ParcelService) {}

  updateState(patch: Partial<ParcelWizardState>) {
    this.state.update(s => ({ ...s, ...patch }));
  }

  nextStep() {
    this.state.update(s => ({ ...s, step: s.step + 1 }));
  }

  prevStep() {
    this.state.update(s => ({ ...s, step: Math.max(1, s.step - 1) }));
  }

  fetchQuote() {
    const s = this.state();
    if (!s.sourceAgencyId || !s.destAgencyId) return;

    this.parcelService.getQuote({
      sourceAgencyId: s.sourceAgencyId,
      destAgencyId: s.destAgencyId,
      weight: s.weight,
      fragility: s.fragility
    }).pipe(
      tap(quote => this.updateState({ quote })),
      catchError(err => {
        console.error('Failed to fetch quote', err);
        return of(null);
      })
    ).subscribe();
  }

  reset() {
    this.state.set(this.initialState);
  }
}
