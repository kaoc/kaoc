import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators, FormControl} from '@angular/forms';
import { MemberService } from '../member.service';
import { Member } from '../Member';


@Component({
  selector: 'member-profile',
  templateUrl: './member-profile.component.html',
  styleUrls: ['./member-profile.component.css']
})
export class MemberProfileComponent implements OnInit {
  isLinear = true;
  saved= false;
  memberdet;
  paymentdet;
  memberForm: FormGroup;
  paymentForm: FormGroup;
  paymentList: string[] = ['Cash', 'Cheque', 'Square', 'Paypal', 'Zelle', 'Other'];
   
  member: Member = {
    firstName:'',
    lastName:'',
    emailId:'',
    mobileNo:'',
    memberId:'',
    preferredNotification:''
  }

  constructor(private _formBuilder: FormBuilder ,
              private memberService: MemberService) {}

  ngOnInit() {

 this.memberForm = this._formBuilder.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      mobileNo: ['', Validators.required],
      emailId: ['',  Validators.email],
      memberId:  new FormControl(''),
    }); 

   /*   this.memberInfo = new FormGroup({
      firstName:  new FormControl(),
      lastName:  new FormControl(''),
      mobileNo:  new FormControl(''), 
      emailId:  new FormControl(''),
      memberId:  new FormControl(''),
     
    }); 

    this.paymentForm = new FormGroup({
      membershipType:  new FormControl('') ,
      referenceNo:  new FormControl('') ,
      paymode:  new FormControl('')
    }); */

    this.paymentForm = this._formBuilder.group({
      membershipType:  ['', Validators.required] ,
      referenceNo:  '',
      memo:  '',
      paymode:  ['', Validators.required]
    }); 

   /*  this.memberInfo = this._formBuilder.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      mobileNo: ['', Validators.required],
      emailId: ['', Validators.required ],
      toppings:[''],
    }); */
   
  }

  saveMemberInfo() {
    console.log(JSON.stringify(this.memberForm.value));
    console.log(JSON.stringify(this.paymentForm.value));
    this.memberdet=JSON.stringify(this.memberForm.value);
    this.paymentdet=JSON.stringify(this.paymentForm.value);

   /* this.member.firstName=this.memberForm.get('firstName').value ;
    this.member.lastName=this.memberForm.get('lastName').value ;
    this.member.mobileNo=this.memberForm.get('mobileNo').value ;
    this.member.emailId=this.memberForm.get('emailId').value ;
    this.member.preferredNotification='Email' ; */

    this.saved=true;
    this.memberForm.reset;
    this.paymentForm.reset;
    //this.memberService.addMember(this.member);
  }

}
