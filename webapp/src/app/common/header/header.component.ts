import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {

  isKaocCommitteeMember:boolean = true;
  kaocCommitteeMemberAccessType:string = 'RW';

  constructor() { }

  ngOnInit() {
  }

}
