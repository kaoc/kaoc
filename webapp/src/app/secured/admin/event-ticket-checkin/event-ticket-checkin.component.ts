import { ActivatedRoute } from '@angular/router';
import { EventService } from '../../event.service';
import { Membership } from '../../Membership';
import { MemberService } from '../../member.service';
import { Component, OnInit } from '@angular/core';
import { Member } from '../../Member';
import { Event, EventTicketDetails } from '../../Event';
import { MatSlider, MatSliderChange } from '@angular/material';
import { EventCheckIn } from '../../EventCheckIn';

@Component({
  selector: 'event-ticket-checkin',
  templateUrl: './event-ticket-checkin.component.html',
  styleUrls: ['./event-ticket-checkin.component.scss']
})
export class EventTicketCheckinComponent implements OnInit {

    kaocUser: Member;
    kaocEvent: Event;
    ticketLookupState = '';
    ticketCheckIns: EventCheckIn[];
    eventTicketId = '';
    eventTicketDetails:EventTicketDetails;
    isCheckInSuccess = false;
    checkInAPIProgress = false;
    isCheckInFailure = false;
    checkInNumAdults: number = 0;
    checkInNumKids: number = 0;
    maxNumAdults: number = 0;
    maxNumChildren: number = 0;
    validCheckIn: boolean = false;

    constructor(
      private eventService: EventService,
      private activatedRoute: ActivatedRoute) {

        // Load Ticket Details
        this.ticketLookupState = 'loading';
        this.eventTicketId = this.activatedRoute.snapshot.paramMap.get('ticketId');
        this.eventService.getEventTicketDetails(this.eventTicketId).then(details=>{
            this.eventTicketDetails = details;
            this.kaocEvent = details.kaocEvent;
            this.kaocUser = details.kaocUser;
            this.checkInNumAdults = this.eventTicketDetails.numAdults;
            this.checkInNumKids = this.eventTicketDetails.numChildren;
            this.maxNumAdults = this.eventTicketDetails.numAdults;
            this.maxNumChildren = this.eventTicketDetails.numChildren;
            this.reEvaluateCheckInButton();
            this.ticketLookupState = 'ticketFound';
        }).catch(e => {
            console.error(`Failed to load ticket details for id : ${this.eventTicketId}`);
            this.ticketLookupState = 'ticketNotFound';
        })

      this.fetchPriorTicketCheckIns();
    }

    fetchPriorTicketCheckIns() {
        this.eventService
          .getEventTicketCheckinDetails(this.eventTicketId)
          .then(memberEventCheckIns => {
              if(memberEventCheckIns) {
                  memberEventCheckIns.sort((c1, c2)=>c1.checkInTime - c2.checkInTime);
                  this.ticketCheckIns = memberEventCheckIns;
              }
          })
          .catch(e => {
              this.ticketCheckIns = null;
          });
    }

    reEvaluateCheckInButton() {
        this.validCheckIn = (this.checkInNumAdults + this.checkInNumKids) > 0;
    }

    updateAdultCheckIn(event:MatSliderChange) {
        this.checkInNumAdults = event.value;
        this.reEvaluateCheckInButton()
    }

    updateKidCheckIn(event:MatSliderChange) {
        this.checkInNumKids = event.value;
        this.reEvaluateCheckInButton()
    }


    performUserEventCheckIn() {
        if(!this.validCheckIn) {
          return;
        }
        this.checkInAPIProgress = true;
        this.eventService.performEventTicketCheckIn(
            this.eventTicketId,
            this.checkInNumAdults,
            this.checkInNumKids
        ).then(() => {
            this.isCheckInSuccess = true;
            this.checkInAPIProgress = false;
            this.isCheckInFailure = false;
        }).catch(e => {
            this.checkInAPIProgress = false;
            this.isCheckInSuccess = false;
            this.isCheckInFailure = true;
        }).then(x => {
            if(this.isCheckInSuccess) {
                // Reload prior member check-ins
                this.fetchPriorTicketCheckIns();
            }
        });
    }
    ngOnInit(): void {
    }
}
