import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'profile-link-status',
  templateUrl: './profile-link-status.component.html',
  styleUrls: ['./profile-link-status.component.scss']
})
export class ProfileLinkStatusComponent implements OnInit {

  public message: string;

  constructor(private activatedRoute: ActivatedRoute) {
      const encodedMessage = activatedRoute.snapshot.paramMap.get('encodedMessage');
      if (encodedMessage) {
          this.message = atob(encodedMessage);
      } else {
          this.message = null;
      }
  }

  ngOnInit() {
  }

}
