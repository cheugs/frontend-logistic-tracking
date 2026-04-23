import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrackParcelComponent } from './track-parcel.component';

describe('TrackParcelComponent', () => {
  let component: TrackParcelComponent;
  let fixture: ComponentFixture<TrackParcelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrackParcelComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TrackParcelComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
