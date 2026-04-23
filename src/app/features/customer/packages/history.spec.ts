import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PackagesComponent } from './packages.component';

describe('History', () => {
  let component: PackagesComponent;
  let fixture: ComponentFixture<PackagesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PackagesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PackagesComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
