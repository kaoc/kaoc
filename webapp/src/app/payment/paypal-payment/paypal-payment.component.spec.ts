import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PaypalPaymentComponent } from './paypal-payment.component';

describe('PaypalPaymentComponent', () => {
  let component: PaypalPaymentComponent;
  let fixture: ComponentFixture<PaypalPaymentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PaypalPaymentComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PaypalPaymentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
