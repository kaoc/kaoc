import { ActivatedRoute } from '@angular/router';
import { EventService } from './../event.service';
import { Membership } from './../Membership';
import { MemberService } from './../member.service';
import { Component, OnInit } from '@angular/core';
import { Member } from '../Member';
import { Event } from '../Event';
import { MatSlider, MatSliderChange } from '@angular/material';
import { MemberEventCheckIn } from '../MemberEventCheckIn';

@Component({
  selector: 'app-checkin',
  templateUrl: './checkin.component.html',
  styleUrls: ['./checkin.component.scss']
})
export class CheckinComponent implements OnInit {

  kaocUser: Member;
  kaocEvent: Event;
  kaocUserId: string;
  membership: Membership;
  profileState = '';
  membershipDetailsLoaded = false;
  memberEventCheckIns: MemberEventCheckIn[];
  queryByMemberId = '';
  eventId = '';
  isCheckInSuccess = false;
  checkInAPIProgress = false;
  isCheckInFailure = false;
  checkInNumAdults: number = 0;
  checkInNumKids: number = 0;
  validCheckIn: boolean = false;

  constructor(
    private memberService: MemberService,
    private eventService: EventService,
    private activatedRoute: ActivatedRoute
  ) {

    this.queryByMemberId = this.activatedRoute.snapshot.paramMap.get('memberId');
    this.eventId = this.activatedRoute.snapshot.paramMap.get('eventId');

    // Load Member & Membership Details
    this.profileState = 'loading';
    this.loadMembershipDetails(this.queryByMemberId).then(membershipData => {
      let kaocUser = null;

      if (membershipData
          && membershipData.members
          && membershipData.members.length > 0) {
          kaocUser = membershipData.members.find(member => member.kaocUserId === this.queryByMemberId);
          console.log(kaocUser);

          if(membershipData.membership) {
            let membershipType = membershipData.membership.membershipType || 'FAMILY';
            if(membershipType.toLowerCase() == 'individual') {
              this.checkInNumAdults = 1;
              this.checkInNumKids = 0;
            } else {
              this.checkInNumAdults = 2;
              this.checkInNumKids = 2;
            }
            this.reEvaluateCheckInButton();
          }
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

    this.fetchPriorMemberCheckIns();

    // Get Event Details.
    this.eventService.getUpcomingEventsById(this.eventId).then(event=>this.kaocEvent = event);

  }

  fetchPriorMemberCheckIns() {
    this.eventService
      .getMemberEventCheckinDetails(this.queryByMemberId, this.eventId)
      .then(memberEventCheckIns => {
        if(memberEventCheckIns) {
          memberEventCheckIns.sort((c1, c2)=>c1.checkInTime - c2.checkInTime);
          this.memberEventCheckIns = memberEventCheckIns;
        }
      })
      .catch(e => {
        this.memberEventCheckIns = null;
      });
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
    this.eventService.performMemberEventCheckIn(
      this.queryByMemberId,
      this.eventId,
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
        this.fetchPriorMemberCheckIns();
      }
    });
  }



  ngOnInit(): void {
  }

}
