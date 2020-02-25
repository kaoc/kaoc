import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { animate, state, style, transition, trigger } from '@angular/animations';

import { MemberService } from '../member.service';
import { Member } from '../Member';
import { MatDialog } from '@angular/material';
import { EditMemberComponent } from '../edit-member/edit-member.component';
import { AngularFireFunctions } from '@angular/fire/functions';
import { first } from 'rxjs/operators';
import { analytics } from 'firebase';
import { Router } from '@angular/router';

@Component({
  selector: 'list-member-profiles',
  templateUrl: './list-member-profiles.component.html',
  styleUrls: ['./list-member-profiles.component.css']
})

export class ListMemberProfilesComponent implements OnInit {
  dataSource: MatTableDataSource<Member>;
  // columnsToDisplay: string[] = ['id','memberId','firstName', 'lastName', 'emailId', 'mobileNo' ,'membershipType' ,'action' ];

  expandedElement: Member | null;
  columnsToDisplay: string[] = ['firstName'];

  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  members: Member[];
  editState: boolean = false;
  memberToEdit: Member;

  constructor(private memberService: MemberService,
    public dialog: MatDialog,
    private ngFireFunctions: AngularFireFunctions,
    private router: Router) { }

  ngOnInit() {
    this.memberService.getAllMembers().subscribe(members => {
      // console.log (members);
      this.dataSource = new MatTableDataSource(members);
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
      this.dataSource.filterPredicate = (member: Member, filter: string) => {
        if (member) {
          const fullName = member.firstName + ' ' + member.lastName;
          if (fullName.toLowerCase().indexOf(filter.toLowerCase()) >= 0) {
            return true;
          }
          if (member.emailId && member.emailId.toLowerCase().indexOf(filter) >= 0) {
            return true;
          }

          if (member.phoneNumber && String(member.phoneNumber).indexOf(filter) >= 0) {
            return true;
          }
        }
        return false;
      };
    });
  }

  getMembershipDetails(member: Member) {
     this.memberService.getMemberDetails(member);
   }

  openEditDialog(member: Member) {
    console.log('memberProfile' + JSON.stringify(member));
    const dialogRef = this.dialog.open(EditMemberComponent, {
      width: '400px',
      height: '400px',
      panelClass: 'kaoc-modalbox',
      data: { membertoedit: member }
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The member profile edit dialog was closed');
    });
  }

  applyFilter(filterValue: string) {
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }
}
