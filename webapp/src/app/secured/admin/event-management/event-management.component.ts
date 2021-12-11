import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../auth/auth.service';
import { EventService } from '../../event.service';
import { MemberService } from '../../member.service';
import { Event } from '../../Event';
import { Membership } from '../../Membership';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'event-management',
  templateUrl: './event-management.component.html',
  styleUrls: ['./event-management.component.scss']
})
export class EventManagementComponent implements OnInit {

    upcomingEvents: Event[];
    pastEvents: Event[];
    eventsLoaded: boolean = false;
    pastEventsLoaded: boolean = false;

    constructor(private eventService: EventService, authService: AuthService, private memberService : MemberService, private snackBar: MatSnackBar) {
        eventService
              .getUpcomingEvents()
              .then(events => {
                  this.upcomingEvents=events
                  this.eventsLoaded = true;

                  // load the full details
                  let fullDetailPromises = [];
                  events.forEach(event=> {
                    fullDetailPromises.push(eventService.getFullEventDetails(event.kaocEventId));
                  });
                  return Promise.all(fullDetailPromises);
              }).then(fullDetailEvents=>{
                  this.upcomingEvents = fullDetailEvents;
              });

        eventService
              .getPastEvents()
              .then(events=>{
                  this.pastEvents=events;
                  this.pastEventsLoaded=true;

                  // load the full details
                  let fullDetailPromises = [];
                  events.forEach(event=> {
                    fullDetailPromises.push(eventService.getFullEventDetails(event.kaocEventId));
                  });
                  return Promise.all(fullDetailPromises);
              }).then(fullDetailEvents=>{
                this.pastEvents = fullDetailEvents;
              });
    }

    getTotalCheckInCount(event) {
        let totalCount = 0;
        if(event) {
          totalCount = Number(event.totalAdultMemberCheckins || 0)+
                       Number(event.totalChildMemberCheckins || 0)+
                       Number(event.totalAdultEventTicketCheckins || 0)+
                       Number(event.totalChildEventTicketChecks || 0);
        }
        return totalCount;
    }

    confirmAndSendPaasEventEmail(kaocEventId, kaocEventName) {
        if(confirm(`Send Email to all active members with Event details for ${kaocEventName}?`)) {
            this.eventService.sendMemberEventPassEmailToActiveMemberships(kaocEventId).then(status => {
                if(status) {
                    console.log("Email requested for all active members")
                    this.snackBar.open("Email requested for all active members");
                } else {
                    console.log(`Failed to send email for all active members`)
                    this.snackBar.open(`Failed to send email for all active members`);
                }
            }).catch(e=>{
                console.log(`Failed to send email for all active members:`, e);
                this.snackBar.open(`Failed to send email for all active members: ${e}`);
            });
        }
    }

    refreshEventDetails(kaocEventId) {
        this.eventService.getFullEventDetails(kaocEventId).then(fullDetailEvent=>{
            let index = this.upcomingEvents.findIndex(event=> event.kaocEventId == fullDetailEvent.kaocEventId);
            if(index >= 0){
                this.upcomingEvents.splice(index, 1, fullDetailEvent);
                this.upcomingEvents = [...this.upcomingEvents]; // this is for angular to pick up the change
            } else {
                index = this.pastEvents.findIndex(event=>event.kaocEventId == fullDetailEvent.kaocEventId);
                if( index >= 0) {
                  this.pastEvents.splice(index, 1, fullDetailEvent);
                  this.pastEvents = [...this.pastEvents]; // this is for angular to pick up the change
                }
            }
        });
    }

    ngOnInit(): void {
    }
}
