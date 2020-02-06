import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl, FormArray } from '@angular/forms';
import { MemberService } from '../member.service';
import { Membership } from '../Membership';


@Component({
  selector: 'member-profile',
  templateUrl: './member-profile.component.html',
  styleUrls: ['./member-profile.component.css']
})
export class MemberProfileComponent implements OnInit {
  isLinear = true;
  saved = false;
  memberdet;
  paymentdet;
  memberForm: FormGroup;
  paymentForm: FormGroup;
  public carForm: FormGroup;
  profileForm: FormGroup;
  paymentList: string[] = ['Cash', 'Cheque', 'Square', 'Paypal', 'Zelle', 'Other'];
  members: FormArray;

  memberShipDet: Membership;

   /* orderForm: FormGroup;
  members: FormArray;

   form: FormGroup;
 
 constructor(private fb: FormBuilder) {
     this.form = this.fb.group({
       membershipType:'',
       members: this.fb.array([]),
     });
     this.addMember();
   }
 
   addMember() {
     const member = this.form.controls.members as FormArray;
     member.push(this.fb.group({
       emailId:'',
       firstName: '',
       lastName: '',
       phoneNumber:''
     }));
   }  */


  constructor(private formBuilder: FormBuilder) { }

  ngOnInit() {
    this.memberForm = this.formBuilder.group({
       membershipType: '',
       members: this.formBuilder.array([this.createMember()])
    });
  }

  createMember(): FormGroup {
    return this.formBuilder.group({
       emailId:'',
       firstName: '',
       lastName: '',
       phoneNumber:''
    });
  }

  addMember(): void {
    this.members = this.memberForm.get('members') as FormArray;
    this.members.push(this.createMember());
  }

  doSubmit() {
    if (this.memberForm.valid) {
      console.log(JSON.stringify(this.memberForm.value));
    }
  }

   
}
