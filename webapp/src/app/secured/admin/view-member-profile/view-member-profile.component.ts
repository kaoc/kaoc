import { Component, OnInit } from '@angular/core';
import { AuthService, UserInfoExt } from '../../auth/auth.service';
import { Member } from '../../Member';
import { Event, EventTicket } from '../../Event';
import { AngularFireFunctions } from '@angular/fire/functions';
import { MatSnackBar } from '@angular/material';
import { MemberService } from '../../member.service';
import { EventService } from '../../event.service';
import { Membership } from '../../Membership';
import { Router, ActivatedRoute } from '@angular/router';
import { ADMIN_MEMBER_CHECKIN, ADMIN_TICKET_CHECKIN, SECURED_CONTEXT } from 'src/app/URLConstants';

@Component({
  selector: 'view-member-profile',
  templateUrl: './view-member-profile.component.html',
  styleUrls: ['./view-member-profile.component.scss']
})
export class ViewMemberProfileComponent implements OnInit {
    kaocUser: Member;
    kaocMembers: Member[];
    kaocUserId: string;
    membership: Membership;
    upcomingEvents: Event[];
    upcomingEventIdMap: Map<string, Event> = new Map();
    purchasedEventTickets: EventTicket[];
    EMAIL_REGEXP = /^([a-zA-Z0-9_\-\.]+)@([a-zA-Z0-9_\-\.]+)\.([a-zA-Z]{2,5})$/;

    profileState = 'loading';
    emailIdToLink: string;
    validEmailIdToLink = false;
    membershipDetailsLoaded = false;
    isAdminView = false;

    constructor(
        private router: Router,
        private activatedRoute: ActivatedRoute,
        private authService: AuthService,
        private fns: AngularFireFunctions,
        private snackBar: MatSnackBar,
        private memberService: MemberService,
        private eventService: EventService) {

            const kaocUserIdQuery = this.activatedRoute.snapshot.paramMap.get('id');
            if (kaocUserIdQuery) {

                // Looking for a specific user profile.
                this.loadMembershipDetails(kaocUserIdQuery)
                    .then(membershipData => {

                    let kaocUser = null;

                    if (membershipData
                        && membershipData.members
                        && membershipData.members.length > 0) {
                        kaocUser = membershipData.members.find(member => member.kaocUserId === kaocUserIdQuery);
                    }

                    if (kaocUser) {
                      this.profileState = 'kaocUserFound';
                      this.kaocUser = kaocUser;
                      this.kaocUserId = kaocUser.kaocUserId;
                    } else {
                        this.profileState = 'kaocUserNotFound';
                    }
                }).catch(e => {
                    console.error(`Failed to load user profile for kaocUserId: ${this.kaocUserId}`);
                });

                // Load the upcoming events
                this.eventService
                    .getUpcomingEvents()
                    .then(events => this.upcomingEvents =  events)
                    .catch(e => {
                        this.upcomingEvents = null;
                    }).then(events => {
                        if(this.upcomingEvents) {
                            let upcomingEventIds = [];
                            this.upcomingEvents.forEach(event=>{
                                upcomingEventIds.push(event.kaocEventId);
                                this.upcomingEventIdMap.set(event.kaocEventId, event);
                            });
                            return this.eventService.getPurchasedEventTickets(kaocUserIdQuery, upcomingEventIds, false);
                        }

                        return [];
                    }).then(purchasedEventTickets => {
                        this.purchasedEventTickets = purchasedEventTickets;
                    });
            } else {
                this.profileState = 'kaocUserFound';
            }
    }

    performEventMemberCheckIn(kaocUserId, kaocEventId) {
        const redirectURL = `/${SECURED_CONTEXT}/${ADMIN_MEMBER_CHECKIN}`
            .replace(':memberId', kaocUserId)
            .replace(':eventId', kaocEventId);
        this.router.navigateByUrl(redirectURL);
    }

    performEventTicketCheckIn(kaocEventTicketId) {
        const redirectURL = `/${SECURED_CONTEXT}/${ADMIN_TICKET_CHECKIN}`.replace(':ticketId', kaocEventTicketId)
        this.router.navigateByUrl(redirectURL);
    }

    loadMembershipDetails(kaocUserId: string): Promise<Membership> {
        return this.memberService.getMembershipData(kaocUserId)
            .then(membership => {
                this.membership = membership;
                this.membershipDetailsLoaded = true;
                return membership;
            })
            .catch(e => {
                this.membership = null;
                this.membershipDetailsLoaded = true;
                return null;
            });
    }

    editUserProfile() {
        if (this.kaocUserId) {
            this.router.navigateByUrl('/secured/user/memberprofile/' + this.kaocUserId);
        }
    }

    ngOnInit(): void {
    }
}
