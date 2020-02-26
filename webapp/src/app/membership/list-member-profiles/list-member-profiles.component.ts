import { Component, OnInit, ViewChild } from '@angular/core';
import { MemberService } from '../member.service';
import { Member } from '../Member';

@Component({
  selector: 'list-member-profiles',
  templateUrl: './list-member-profiles.component.html',
  styleUrls: ['./list-member-profiles.component.css']
})

export class ListMemberProfilesComponent implements OnInit {
  columnsToDisplay: string[] = ['firstName'];

  members: Member[];

  constructor(private memberService: MemberService) { }

  ngOnInit() {
      this.memberService.getAllMembers().subscribe(members => {
          // console.log (members);
          this.members = members;
      });
  }
}
