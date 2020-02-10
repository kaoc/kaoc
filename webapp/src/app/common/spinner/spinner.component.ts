import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { PaymentService } from 'src/app/payment/payment.service';

@Component({
  selector: 'spinner',
  templateUrl: './spinner.component.html',
  styleUrls: ['./spinner.component.css']
})
export class SpinnerComponent implements OnInit {
  color = 'primary';
  mode = 'indeterminate';
  value = 25;
  

  constructor( public dialogRef: MatDialogRef<SpinnerComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public paymentService: PaymentService) {
      dialogRef.disableClose = true;
     }

  ngOnInit() {
     
     
  }
   
}
