import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { EventService } from '../event.service';
import { Event, EventPricing } from '../Event';
import { MatSnackBar } from '@angular/material';
import { MembershipPricing } from '../Membership';
import { MemberService } from '../member.service';
import { MatSliderChange } from '@angular/material';
import { Router } from '@angular/router';
import { EVENT_TICKETS, SECURED_CONTEXT, PROFILE } from 'src/app/URLConstants';

@Component({
  selector: 'member-payment',
  templateUrl: './member-payment.component.html',
  styleUrls: ['./member-payment.component.scss']
})
export class MemberPaymentComponent implements OnInit {
    paymentType: string = "Event"; // default payment type.
    eventId: string;
    event: Event;
    eventPricing: EventPricing;
    numAdultTickets: number = 0;
    numKidsTickets: number = 0;
    totalEventTicketCost: number = 0;

    membershipType: string
    membershipPricing: MembershipPricing;

    constructor(
        private eventService: EventService,
        private activatedRoute: ActivatedRoute,
        private snackBar: MatSnackBar,
        private membersService: MemberService,
        private router:Router
    ) {
        this.paymentType = this.activatedRoute.snapshot.paramMap.get('paymentType');
        let paymentMeta = this.activatedRoute.snapshot.paramMap.get('paymentMeta');

        if (this.paymentType === 'Event') {
            this.eventId = paymentMeta;
            this.eventService
                .getUpcomingEventsById(this.eventId)
                .then(event=>this.event = event)
                .catch(e => {
                    this.snackBar.open(`Failed to load event details`);
                    console.error(`Failed to load details for event with id ${this.eventId}`);
                });
            eventService.getEventPricing(this.eventId).then(eventPricing=>{
                this.eventPricing = eventPricing;
            }).catch(e => {
                console.error(`Failed to load pricing for event ${this.eventId}. `);
                this.snackBar.open(`Failed to load event pricing information`);
            })
        } else if(this.paymentType === 'Membership') {
            this.membershipType = paymentMeta;
            this.membersService
            .getMembershipPricing()
            .then(membershipPricing=>{
                this.membershipPricing = membershipPricing;
            }).catch(e=>{
                console.error(`Failed to load pricing for membership `);
                this.snackBar.open(`Failed to load membership pricing information`);
            })
        } else {
            console.error(`Invalid payment type ${this.paymentType}. Only Event & Membership payments are supported`);
            this.snackBar.open(`Invalid payment type ${this.paymentType}. Only Event & Membership payments are supported`);
        }
    }

    handlePaypalStatusEvent(event) {
        let navigationPath = null;
        if(this.paymentType == 'Event') {
            // navigate user to event tickets page so that the ticket can be displayed back.
            navigationPath = `${SECURED_CONTEXT}/${EVENT_TICKETS}`;
        } else {
            // Membership payment complete - navigate user back to profile page.
            navigationPath = `${SECURED_CONTEXT}/${PROFILE}`;
        }

        this.router.navigate([navigationPath]).then(status=>{
            if(!status) {
              console.error(`Navigation Failed`);
            }
        });
    }

    updatePaymentAmount() {
      let adultPricing = this.eventPricing.adult * this.numAdultTickets;
      let kidsPricing = this.eventPricing.child * this.numKidsTickets;
      this.totalEventTicketCost = adultPricing + kidsPricing;
    }

    updateAdultCheckIn(event:MatSliderChange) {
        this.numAdultTickets = event.value;
        this.updatePaymentAmount();
    }

    updateKidCheckIn(event:MatSliderChange) {
        this.numKidsTickets = event.value;
        this.updatePaymentAmount();
    }

    ngOnInit(): void {
    }
}
