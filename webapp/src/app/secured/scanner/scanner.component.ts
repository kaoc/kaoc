import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ADMIN_MEMBER_CHECKIN, ADMIN_TICKET_CHECKIN, ADMIN_VIEW_MEMBER_PROFILE_PREFIX, SECURED_CONTEXT } from '../../URLConstants';

const KAOC_MEMBER_ID_REGEX = /^kaocMemberId:(?<memberId>.+)$/;
const KAOC_MEMBER_EVENT_CHECKIN_REGEX = /^kaocEventCheckIn:kaocMemberId:(?<memberId>.+):kaocEventId:(?<eventId>.+)$/;
const KAOC_TICKET_EVENT_CHECKIN_REGEX = /^kaocEventCheckIn:kaocEventTicketId:(?<ticketId>.+)$/;

@Component({
  selector: 'app-scanner',
  templateUrl: './scanner.component.html',
  styleUrls: ['./scanner.component.scss']
})
export class ScannerComponent implements OnInit {

  scanResult = '';

  constructor(private router: Router) { }

  ngOnInit(): void {
  }

  onCodeResult(result: string) {
    if (result) {
      this.scanResult = result;
      const memberIdMatch = KAOC_MEMBER_ID_REGEX.exec(result);
      if (memberIdMatch) {
          const memberId = memberIdMatch.groups.memberId;
          this.router.navigate([`${SECURED_CONTEXT}/${ADMIN_VIEW_MEMBER_PROFILE_PREFIX}`, memberId]);
      } else {

        const memberEventCheckInMatch = KAOC_MEMBER_EVENT_CHECKIN_REGEX.exec(result);

        if (memberEventCheckInMatch) {
          this.scanResult = `Code Match Found for Member Event Check-In`;
          //alert(`Code Match Found for Event Check-In`);
          const memberId = memberEventCheckInMatch.groups.memberId;
          const eventId = memberEventCheckInMatch.groups.eventId;
          this.router.navigate([`${SECURED_CONTEXT}/${ADMIN_MEMBER_CHECKIN}`, {memberId, eventId}]).then(status=>{
            if(!status) {
              this.scanResult = `Navigation Failed`;
              //alert(`Navigation Failed`);
            }
          });
        } else {
          const ticketEventCheckInMatch = KAOC_TICKET_EVENT_CHECKIN_REGEX.exec(result);
          if(ticketEventCheckInMatch) {
              const ticketId = ticketEventCheckInMatch.groups.ticketId;
              this.scanResult = `Code Match found for Ticket Check-In ${ticketId}`
              this.router.navigate([`${SECURED_CONTEXT}/${ADMIN_TICKET_CHECKIN}`, {ticketId}]).then(status=>{
                if(!status) {
                  this.scanResult = `Navigation Failed`;
                  //alert(`Navigation Failed`);
                } else {
                  this.scanResult = `Navigation complete to ${SECURED_CONTEXT}/${ADMIN_TICKET_CHECKIN}`;
                }
              });

          }
          this.scanResult = `NO Match Found`;
          //alert(`NOT MATCH for Event Check-In`);
          console.error(`Unsupported QR Code ${result}`);
        }
      }
    }
  }

}
