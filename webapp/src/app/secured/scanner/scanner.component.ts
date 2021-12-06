import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ADMIN_MEMBER_CHECKIN, ADMIN_VIEW_MEMBER_PROFILE_PREFIX, SECURED_CONTEXT } from '../../URLConstants';

const KAOC_MEMBER_ID_REGEX = /^kaocMemberId:(?<memberId>.+)$/;
const KAOC_MEMBER_EVENT_CHECKIN_REGEX = /^kaocEventCheckIn:kaocMemberId:(?<memberId>.+):kaocEventId:(?<eventId>.+)$/;

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
          const memberId = memberEventCheckInMatch.groups.memberId;
          const eventId = memberEventCheckInMatch.groups.eventId;
          const redirectURL = `${SECURED_CONTEXT}/${ADMIN_MEMBER_CHECKIN}`
            .replace(':memberId', memberId)
            .replace(':eventId', eventId);
          this.router.navigateByUrl(redirectURL);
        } else {
          console.error(`Unsupported QR Code ${result}`);
        }
      }
    }
  }

}
