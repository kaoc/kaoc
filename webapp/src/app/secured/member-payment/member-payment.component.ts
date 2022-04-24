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
import { CheckoutItems } from '../Checkout';
import { AuthService } from '../auth/auth.service';
import { timeStamp } from 'console';

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
    checkoutItems: CheckoutItems[];
    eventPricingLoaded: boolean = false;
    paymentComplete: boolean = false;

    membershipType: string
    membershipPricing: MembershipPricing;
    kaocUserId: string;

    constructor(
        private eventService: EventService,
        private activatedRoute: ActivatedRoute,
        private snackBar: MatSnackBar,
        private membersService: MemberService,
        private router:Router,
        authService: AuthService
    ) {
        this.paymentType = this.activatedRoute.snapshot.paramMap.get('paymentType');
        let paymentMeta = this.activatedRoute.snapshot.paramMap.get('paymentMeta');

        authService.kaocUser.subscribe(kaocUser => {
          if (kaocUser) {
              this.kaocUserId = kaocUser.kaocUserId;
          }
        });


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
                this.eventPricingLoaded = true;
            }).catch(e => {
                this.eventPricingLoaded = true;
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
        this.paymentComplete = true;
    }

    acknowledgedPaymentStatus() {
        let loggedIn = !!this.kaocUserId;
        let navigationPath = null;
        if(loggedIn) {
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
        } else {
          // Just show the payment page back.
          // Reset the state
          this.paymentComplete = false;
          this.numAdultTickets = 0;
          this.numAdultTickets = 0;
          this.updatePaymentAmount()
        }
    }

    updatePaymentAmount() {
      let adultPricing = this.eventPricing.adult * this.numAdultTickets;
      let kidsPricing = this.eventPricing.child * this.numKidsTickets;

      let newCheckoutItems:CheckoutItems[] = [];
      for(let i=0; i< this.numAdultTickets; i++) {
          newCheckoutItems.push({
              price: this.eventPricing.adult,
              type: `Adult:${i+1}`
          });
      }

      for(let i=0; i< this.numKidsTickets; i++) {
        newCheckoutItems.push({
            price: this.eventPricing.child,
            type: `Child:${i+1}`
        });
    }

      this.checkoutItems = newCheckoutItems;
      this.totalEventTicketCost = adultPricing + kidsPricing;
    }

    max(val1, val2) {
      return Math.max(val1, val2);
    }

    updateAdultCheckIn(event:MatSliderChange) {
        this.numAdultTickets = event.value;
        this.updatePaymentAmount();
    }

    updateKidCheckIn(event:MatSliderChange) {
        this.numKidsTickets = event.value;
        this.updatePaymentAmount();
    }

    decreaseAdultTickets() {
      this.numAdultTickets = Math.max(this.numAdultTickets-1, 0);
      this.updatePaymentAmount();
    }

    increaseAdultTickets() {
      this.numAdultTickets = Math.min(this.numAdultTickets+1, 20);
      this.updatePaymentAmount();
    }

    decreaseChildTickets() {
      this.numKidsTickets = Math.max(this.numKidsTickets-1, 0);
      this.updatePaymentAmount();
    }

    increaseChildTickets() {
      this.numKidsTickets = Math.min(this.numKidsTickets+1, 20);
      this.updatePaymentAmount();
    }

    ngOnInit(): void {
    }
}
