import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {MemberService} from '../../member.service';
import {Member} from '../../Member';
import {Router} from '@angular/router';
import _ from 'lodash';
import {MatDialog, MatTableDataSource} from '@angular/material';

@Component({
  selector: 'list-member-profiles',
  templateUrl: './list-member-profiles.component.html',
  styleUrls: ['./list-member-profiles.component.css']
})

export class ListMemberProfilesComponent implements OnInit {
  columnsToDisplay: string[] = ['firstName'];

  members: Member[];
  membersCpy: Member[];
  pageOfItems: Array<any>;
  isAsc: boolean;
  @Input() enableFilter: boolean;

  constructor(private memberService: MemberService,
              private router: Router) {
  }

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
    this.router.navigate(['secured/admin/memberprofile', member.docId]);
  }

  onChangePage(pageOfItems: Array<any>) {
    // update current page of items
    this.pageOfItems = pageOfItems;
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
