import { Component, OnInit } from '@angular/core';
import { AuthService } from './auth/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-secured',
  templateUrl: './secured.component.html',
  styleUrls: ['./secured.component.css']
})
export class SecuredComponent implements OnInit {

  constructor(private authService: AuthService, private router: Router) {
    authService.firebaseUser.subscribe(firebaseUser => {
        if (typeof firebaseUser !== 'undefined') {
            if (firebaseUser != null) {
                router.navigate(['/secured/profile']);
            } else {
              router.navigate(['/secured/login']);
            }
        }
    });
  }

  ngOnInit() {
  }

}
