import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-scanner',
  templateUrl: './scanner.component.html',
  styleUrls: ['./scanner.component.scss']
})
export class ScannerComponent implements OnInit {

  scanResult = '';
  redirectURL = '/secured/admin/viewmemberprofile/';

  constructor(private router: Router) { }

  ngOnInit(): void {
  }

  onCodeResult(result: string) {
    this.scanResult = result.replace('kaocMemberId:', '');
    this.redirectURL = this.redirectURL + this.scanResult;
  }

}
