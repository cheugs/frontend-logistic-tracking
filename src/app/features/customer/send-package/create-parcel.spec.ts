import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SendPackageComponent } from './send-package.component';

describe('SendPackageComponent', () => {
  let component: SendPackageComponent;
  let fixture: ComponentFixture<SendPackageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SendPackageComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SendPackageComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
