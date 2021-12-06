import { ActivatedRoute } from '@angular/router';
import { EventService } from './../event.service';
import { Membership } from './../Membership';
import { MemberService } from './../member.service';
import { Component, OnInit } from '@angular/core';
import { Member } from '../Member';
import { Event } from '../Event';
import { MemberEventCheckIn } from '../MemberEventCheckIn';

@Component({
  selector: 'app-checkin',
  templateUrl: './checkin.component.html',
  styleUrls: ['./checkin.component.scss']
})
export class CheckinComponent implements OnInit {

  kaocUser: Member;
  kaocUserId: string;
  membership: Membership;
  upcomingEvents: Event[];
  profileState = '';
  membershipDetailsLoaded = false;
  memberEventCheckIn: MemberEventCheckIn[];

  constructor(
    private memberService: MemberService,
    private eventService: EventService,
    private activatedRoute: ActivatedRoute
  ) {
    const queryByMemberId = this.activatedRoute.snapshot.paramMap.get('memberId');
    const eventId = this.activatedRoute.snapshot.paramMap.get('eventId');
    this.loadMembershipDetails(queryByMemberId).then(membershipData => {
      let kaocUser = null;

      if (membershipData
          && membershipData.members
          && membershipData.members.length > 0) {
          kaocUser = membershipData.members.find(member => member.kaocUserId === queryByMemberId);
          console.log(kaocUser);
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

  // For user profile loaded by admin. load the upcoming events
    this.eventService
      .getMemberEventCheckinDetails(queryByMemberId, eventId)
      .then(memberEventCheckIn => this.memberEventCheckIn = memberEventCheckIn)
      .catch(e => {
        this.memberEventCheckIn = null;
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

  performUserEventCheckIn() {
    // Add API here for check in
  }



  ngOnInit(): void {
  }

}
