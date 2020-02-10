import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl, FormArray } from '@angular/forms';
import { MemberService } from '../member.service';
import { Membership } from '../Membership';
import { Member } from '../Member';
import {MatTableDataSource} from '@angular/material/table';
import { MatSort } from '@angular/material';

@Component({
  selector: 'member-profile',
  templateUrl: './member-profile.component.html',
  styleUrls: ['./member-profile.component.css']
})
export class MemberProfileComponent implements OnInit {
  dataSource: MatTableDataSource<any>; 
   @ViewChild(MatSort, {static: true}) sort: MatSort;

  isLinear = true;
  saved = false;

  displayedColumns: string[] = ['index','emailId', 'firstName', 'lastName', 'phoneNumber','adultFlag' ,'action'];


  memberdet;
  paymentdet;

  memberForm: FormGroup;
  memberDetForm: FormGroup;

  paymentForm: FormGroup;
  public carForm: FormGroup;
  paymentList: string[] = ['Cash', 'Cheque', 'Square'];
  membershipAmt;
  member: Member[];
  members: FormArray;
  membersdet: FormArray;

  memberDet = {
    members: [{
    firstName: '',
    lastName: '',
    phoneNumber: '',
    emailId: '',
    adultFlag:''
  }]
}

  data = {
    members: [{
      firstName: '',
      lastName: '',
      phoneNumber: '',
      emailId: ''
    }],

    membership: {
      membershipType: ''
    }
  }

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
      emailId: ['', Validators.required],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      phoneNumber: ['', Validators.required],
    });

    this.memberDetForm = this.formBuilder.group({
      emailId: ['', Validators.required],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      phoneNumber: ['', Validators.required],
      adultFlag: '',
    });
   
  

   }

  createMember(): FormGroup {
    return this.formBuilder.group({
      emailId: '',
      firstName: '',
      lastName: '',
      phoneNumber: '',
      adultFlag: '',
    });
  }

  addMember( index) {
    console.log("index="+index);
    console.log("Member Details:" + JSON.stringify(this.memberForm.value));

    this.data.members[index]=this.memberForm.value;
 
    console.log("After adding Member Details:" + JSON.stringify(this.data.members));
    console.log("Member Details array size:" +  this.data.members.length);
    this.dataSource = new MatTableDataSource(this.data.members);
    this.dataSource.sort = this.sort; 
  }

 /* addRow () {
   
    if (this.memberDetForm.invalid) {
      console.log('Member Detail form is invalid')
      return ;
    }

    this.membersdet = this.memberDetForm.get('membersdet') as FormArray;
    this.membersdet.push(this.createMember());
    console.log('memberdet form value = ' + JSON.stringify(this.memberDetForm.value));
 }*/

  addFamily() {
    if (this.memberDetForm.invalid) {
      console.log('Member Detail form is invalid')
      return ;
    }

    this.data.members.push(this.memberDetForm.value);
    //this.membersdet = this.memberDetForm.get('membersdet') as FormArray;
    //this.membersdet.push(this.createMember());
    
  this.dataSource = new MatTableDataSource(this.data.members);
  this.dataSource.sort = this.sort; 
    console.log("After adding Member Details:" + JSON.stringify(this.data.members));
    console.log("Member Details array size:" +  this.data.members.length);
  }

  
}
