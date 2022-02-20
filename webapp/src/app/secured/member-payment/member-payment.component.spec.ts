import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MemberPaymentComponent } from './member-payment.component';

describe('MemberPaymentComponent', () => {
  let component: MemberPaymentComponent;
  let fixture: ComponentFixture<MemberPaymentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MemberPaymentComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MemberPaymentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
