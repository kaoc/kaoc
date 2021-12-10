import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material';
import { MemberService } from '../../member.service';
import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument } from '@angular/fire/firestore';


@Component({
  selector: 'admin-functions',
  templateUrl: './admin-functions.component.html',
  styleUrls: ['./admin-functions.component.scss']
})
export class AdminFunctionsComponent implements OnInit {
  numFailedEmails: number = 0;
  constructor(private memberService: MemberService, private snackBar: MatSnackBar, private firestore: AngularFirestore) {
      this.loadFailedEmailsCount();
  }

  loadFailedEmailsCount() {
      this.memberService.getNumberOfFailedEmails().then(count=>this.numFailedEmails=count);
  }

  retryFailedEmails(limit) {
      this.memberService.retryFailedEmails(limit).then(status=> {
          if(status) {
              console.log(`Retry requested for ${limit} failed emails`)
              this.snackBar.open(`Retry requested for ${limit} failed emails`);
              this.loadFailedEmailsCount();
          } else {
              console.log(`Failed retry request for ${limit} failed emails`)
              this.snackBar.open(`Failed retry request for ${limit} failed emails`);
          }
      }).catch(e=>{
          console.log(`Failed retry request for ${limit} failed emails`, e);
          this.snackBar.open(`Failed retry request for ${limit} failed emails due to ${e}`);
      })
  }

  confirmAndSendMemberInfoEmail() {
      if(confirm(`Send Email to all members with member details?`)) {
          this.memberService.sendMemberDetailsEmailToMembers().then(status => {
              if(status) {
                  console.log("Email requested for all memberss")
                  this.snackBar.open("Email requested for all active members");
              } else {
                  console.log(`Failed to send email for all members`)
                  this.snackBar.open(`Failed to send email for all members`);
              }
          }).catch(e=>{
              console.log(`Failed to send email for all members:`, e);
              this.snackBar.open(`Failed to send email for all members: ${e}`);
          });
      }
  }

  ngOnInit(): void {
  }

}
