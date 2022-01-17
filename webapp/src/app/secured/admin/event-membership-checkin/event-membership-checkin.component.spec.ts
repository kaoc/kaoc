import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EventMembershipCheckinComponent } from './event-membership-checkin.component';

describe('CheckinComponent', () => {
  let component: EventMembershipCheckinComponent;
  let fixture: ComponentFixture<EventMembershipCheckinComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EventMembershipCheckinComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EventMembershipCheckinComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
