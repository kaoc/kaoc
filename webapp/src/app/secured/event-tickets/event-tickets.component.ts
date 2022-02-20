import { Component, OnInit } from '@angular/core';
import { EventService } from '../event.service';
import { AuthService } from '../auth/auth.service';
import { MemberService } from '../member.service';
import { Event } from '../Event';
import { EventTicket } from '../Event';
import { Membership } from '../Membership';
import { Router } from '@angular/router';
import { PAYMENT, SECURED_CONTEXT } from 'src/app/URLConstants';

@Component({
  selector: 'event-tickets',
  templateUrl: './event-tickets.component.html',
  styleUrls: ['./event-tickets.component.scss']
})
export class EventTicketsComponent implements OnInit {

    upcomingEvents: Event[];
    pastEvents: Event[];
    membershipDetailsLoaded: boolean = false;
    eventsLoaded: boolean = false;
    pastEventsLoaded: boolean = false;
    hasValidMembership: boolean = false;
    eventMemberCheckInQRCodeMap: any = {};
    kaocUserId: string;
    eventPurchasesLoaded: boolean = false;
    eventTicketMap: any = {};
    eventIdMap: Map<string, Event> = new Map();

    constructor(
            private eventService: EventService,
            authService: AuthService, private memberService : MemberService,
            private router: Router) {
        eventService
              .getUpcomingEvents()
              .then(events=>{
                  this.upcomingEvents=events
                  events.forEach(event=>{
                    this.eventIdMap.set(event.kaocEventId, event);
                  })
                  this.eventsLoaded = true;
                  this.loadPurchasedTickets();
                  return this.loadMemberEventCheckInForUpcomingEvents();
              });

        eventService
              .getPastEvents()
              .then(events=>{
                  this.pastEvents=events;
                  events.forEach(event=>{
                    this.eventIdMap.set(event.kaocEventId, event);
                  })
                  this.pastEventsLoaded=true;
              });
        authService.kaocUser.subscribe(kaocUser => {
          if (kaocUser) {
              this.kaocUserId = kaocUser.kaocUserId;
              this.loadMembershipDetails(kaocUser.kaocUserId);
              this.loadPurchasedTickets();
          } else {
            this.membershipDetailsLoaded = true;
          }
      });
    }

    loadMembershipDetails(kaocUserId: string): Promise<Membership> {
      return this.memberService.getMembershipData(kaocUserId)
          .then(membershipData => {
              this.hasValidMembership = membershipData && membershipData.membership && membershipData.membership.paymentStatus == 'Paid';
              this.membershipDetailsLoaded = true;
              return this.hasValidMembership;
          })
          .then(validMembership=>{
            return this.loadMemberEventCheckInForUpcomingEvents();
          })
          .catch(e => {
              this.membershipDetailsLoaded = true;
              return null;
          });
    }

    loadMemberEventCheckInForUpcomingEvents() {
        if(this.hasValidMembership
            && this.upcomingEvents
            && this.upcomingEvents.length > 0) {

          var promises = [];
          this.upcomingEvents.forEach(upcomingEvent => {
              if(upcomingEvent.membershipAccessIncluded) {
                  promises.push(this.loadMemberEventCheckIn(this.kaocUserId, upcomingEvent.kaocEventId));
              }
          });
          return Promise.all(promises);
        }
        return null;
    }

    loadPurchasedTickets() {
        if (this.kaocUserId && this.upcomingEvents && this.upcomingEvents.length > 0) {
            let eventIds = this.upcomingEvents.map(event=>event.kaocEventId);
            this.eventService
              .getPurchasedEventTickets(this.kaocUserId, eventIds, true)
              .then(ticketPurchases=>{
                ticketPurchases.forEach(eventTicket=> {
                    let currEventsArray = this.eventTicketMap[eventTicket.kaocEventId];
                    let newEventsArray = [];
                    if(currEventsArray) {
                        newEventsArray.push.apply(currEventsArray, newEventsArray);
                    }
                    newEventsArray.push(eventTicket);

                    this.eventTicketMap[eventTicket.kaocEventId] = newEventsArray;
                })
                 this.eventPurchasesLoaded = true;
              })
              .catch(e=>{
                this.eventPurchasesLoaded = true;
              });
        }
    }

    loadMemberEventCheckIn(kaocUserId, kaocEventId) {
        return this.eventService
                  .getMemberEventCheckInQRCode(kaocUserId, kaocEventId)
                  .then(qrCodeData=>{
                    this.eventMemberCheckInQRCodeMap[kaocEventId] = qrCodeData.qrCodeImage;
                });
    }

    purchaseEventTickets(kaocEventId) {
        let paymentType = 'Event';
        let paymentMeta = kaocEventId;
        this.router.navigate([`${SECURED_CONTEXT}/${PAYMENT}`, {paymentType, paymentMeta}]).then(status=>{
            if(!status) {
              console.error(`Navigation Failed`);
            }
        });
    }

    ngOnInit(): void {
    }

}
