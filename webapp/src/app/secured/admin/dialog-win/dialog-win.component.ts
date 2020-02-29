import { Component, OnInit, Inject } from '@angular/core';
import { DialogData } from '../member-profile/member-profile.component';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { Router } from '@angular/router';

@Component({
  selector: 'dialog-win',
  templateUrl: './dialog-win.component.html',
  styleUrls: ['./dialog-win.component.css']
})
export class DialogWinComponent implements OnInit {
  message: string;
  docId : string;
  constructor( public dialogRef: MatDialogRef<DialogWinComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private router:Router) { }

  ngOnInit() {
    console.log('Inside dialogcomponent ' + this.data.message);
    this.message= this.data.message;
    this.docId= this.data.memberDocId;
  }

  onNoClick(): void {
    this.dialogRef.close();
    this.router.navigate(['secured/admin/memberprofile']);
  }

  viewMemberById(docId) {
    this.onNoClick();
    console.log('view MemberbyId :: ' + docId);

     this.router.navigateByUrl('/', {skipLocationChange: true}).then(() =>
    this.router.navigate(['secured/admin/memberprofile', docId]) ); 
    //this.router.navigate(['secured/admin/memberprofile', docId])
  }

}
