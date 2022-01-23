import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

@Component({
  selector: 'confirm-del',
  templateUrl: './confirm-del.component.html',
  styleUrls: ['./confirm-del.component.css']
})
export class ConfirmDelComponent implements OnInit {

  constructor( public dialogRef: MatDialogRef<ConfirmDelComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) { }

  ngOnInit() {
   console.log('data.firstname=' + this.data.firstname);
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
