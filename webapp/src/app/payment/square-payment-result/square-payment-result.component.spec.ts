import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SquarePaymentResultComponent } from './square-payment-result.component';

describe('SquarePaymentResultComponent', () => {
  let component: SquarePaymentResultComponent;
  let fixture: ComponentFixture<SquarePaymentResultComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SquarePaymentResultComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SquarePaymentResultComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
