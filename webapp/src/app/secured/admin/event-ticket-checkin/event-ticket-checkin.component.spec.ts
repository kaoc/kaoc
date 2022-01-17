import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EventTicketCheckinComponent } from './event-ticket-checkin.component';

describe('EventTicketCheckinComponent', () => {
  let component: EventTicketCheckinComponent;
  let fixture: ComponentFixture<EventTicketCheckinComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EventTicketCheckinComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EventTicketCheckinComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
