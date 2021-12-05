import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {MemberService} from '../../member.service';
import {Member} from '../../Member';
import {Router} from '@angular/router';
import _ from 'lodash';
import {MatDialog, MatTableDataSource} from '@angular/material';

@Component({
  selector: 'app-list-member-profiles',
  templateUrl: './list-member-profiles.component.html',
  styleUrls: ['./list-member-profiles.component.scss']
})

export class ListMemberProfilesComponent implements OnInit {
  columnsToDisplay: string[] = ['firstName'];
  membershipReportYears: string[] = ['2021', '2020'];
  membershipReportYear: number = 2021;
  members: Member[];
  membersCpy: Member[];
  pageOfItems: Array<any>;
  isAsc: boolean;
  @Input() enableFilter: boolean;

  constructor(private memberService: MemberService,
              private router: Router) { }

  ngOnInit() {
    this.memberService.getAllMembers().subscribe(members => {
      this.members = members;
      this.membersCpy = this.members = _.sortBy(this.members, ['firstName']);
      this.isAsc = true;
    });
  }

  sort() {
    if (this.isAsc) {
      this.membersCpy = this.members =  _.orderBy(this.members, ['firstName'], ['desc']);
    } else {
      this.membersCpy = this.members =  _.sortBy(this.members, ['firstName']);
    }
    this.isAsc = !this.isAsc;
  }

  getMembershipDetails(member: Member) {
    this.router.navigate(['secured/admin/viewmemberprofile', member.docId]);
  }

  onChangePage(pageOfItems: Array<any>) {
    // update current page of items
    this.pageOfItems = pageOfItems;
  }

  downloadMembershipReport() {
    let membershipYear = this.membershipReportYear;
    this.memberService.getMembershipReport(membershipYear).then(membershipReportRecords=>{
      let csvReports = [];
      csvReports.push(['First Name', 'Last Name', 'Email Id','Age Group', 'Membership Type','Membership Id', 'Legacy Membership Id', 'Payment Id', 'Payment Amount', 'Payment Method', 'Payment Notes','External Payment Ref', 'Payment Time'].join());
      membershipReportRecords.forEach(memRecord=>{
        csvReports.push([
            memRecord.firstName,
            memRecord.lastName,
            memRecord.emailId,
            memRecord.ageGroup,
            memRecord.membershipType,
            memRecord.kaocMembershipId,
            memRecord.legacyMembershipId,
            memRecord.kaocPaymentId,
            memRecord.paymentAmount,
            memRecord.paymentMethod,
            memRecord.paymentNotes,
            memRecord.paymentExternalSystemRef,
            this.formatDateTime(memRecord.paymentTime)
        ].join());
      });

      let csvData = csvReports.join('\n');

      var a = document.createElement('a');
      var blob = new Blob([csvData], {'type':'text/csv'});
      a.href = window.URL.createObjectURL(blob);
      a.download = `KAOC_Membership_Report_${membershipYear}.csv`;
      a.click();
    });
  }

  formatDateTime(epochMillis) {
    let dateString = '';
    if(epochMillis) {
      let date = new Date();
      date.setTime(epochMillis);
      dateString = date.toLocaleString();
    }
    return dateString;
  }

  applyFilter(filterValue: string) {
    // this.members.filter = filterValue.trim().toLowerCase();
    this.members = this.pageOfItems = this.membersCpy.filter(t => (
      (t.firstName.toLowerCase().includes(filterValue.trim().toLowerCase()) || t.firstName.includes(filterValue))
      || (t.lastName.toLowerCase().includes(filterValue.trim().toLowerCase()) || t.lastName.includes(filterValue))
      || (t.emailId ? (t.emailId.toLowerCase().includes(filterValue.trim().toLowerCase()) || t.emailId.includes(filterValue)) : null)
      || (t.phoneNumber ? (t.phoneNumber.toString().includes(filterValue.trim())) : null)
    ));
  }
}
