import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ADMIN_VIEW_MEMBER_PROFILE_PREFIX } from '../../URLConstants';

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
          this.router.navigate([`secured/${ADMIN_VIEW_MEMBER_PROFILE_PREFIX}`, memberId]);
      } else {
        const memberEventCheckInMatch = KAOC_MEMBER_EVENT_CHECKIN_REGEX.exec(result);
        if (memberEventCheckInMatch) {
          const memberId = memberEventCheckInMatch.groups.memberId;
          const eventId = memberEventCheckInMatch.groups.eventId;
          // TODO
          // this.router.navigate(['secured/admin/eventCheckIn', memberId, eventId]);
        } else {
          console.error(`Unsupported QR Code ${result}`);
        }
      }
    }
  }

}
