import { Component, OnInit } from '@angular/core';
import { EventService } from '../event.service';
import { AuthService } from '../auth/auth.service';
import { MemberService } from '../member.service';
import { Event } from '../Event';
import { Membership } from '../Membership';

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
    memberEventCheckInQRCodeImage: string = null;
    eventMemberCheckInQRCodeMap: any = {};
    kaocUserId: string;

    constructor(private eventService: EventService, authService: AuthService, private memberService : MemberService) {
        eventService
              .getUpcomingEvents()
              .then(events=>{
                  this.upcomingEvents=events
                  this.eventsLoaded = true;
                  return this.loadMemberEventCheckInForUpcomingEvents();
              });

        eventService
              .getPastEvents()
              .then(events=>{
                  this.pastEvents=events;
                  this.pastEventsLoaded=true;
              });
        authService.kaocUser.subscribe(kaocUser => {
          if (kaocUser) {
              this.kaocUserId = kaocUser.kaocUserId;
              this.loadMembershipDetails(kaocUser.kaocUserId);
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

    loadMemberEventCheckIn(kaocUserId, kaocEventId) {
        return this.eventService
                  .getMemberEventCheckInQRCode(kaocUserId, kaocEventId)
                  .then(qrCodeData=>{
                    this.eventMemberCheckInQRCodeMap[kaocEventId] = qrCodeData.qrCodeImage;
                });
    }

    ngOnInit(): void {
    }

}
