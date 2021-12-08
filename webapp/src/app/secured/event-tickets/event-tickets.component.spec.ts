import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EventTicketsComponent } from './event-tickets.component';

describe('EventTicketsComponent', () => {
  let component: EventTicketsComponent;
  let fixture: ComponentFixture<EventTicketsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EventTicketsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EventTicketsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
