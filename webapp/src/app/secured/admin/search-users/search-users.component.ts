import { Component, OnInit } from '@angular/core';
import { Member } from 'src/app/membership/Member';

@Component({
  selector: 'app-search-users',
  templateUrl: './search-users.component.html',
  styleUrls: ['./search-users.component.css']
})
export class SearchUsersComponent implements OnInit {

  userSearchResults: Member[];


  constructor() { }

  ngOnInit() {
  }

  applyFilter(filterVal) {

  }

}
