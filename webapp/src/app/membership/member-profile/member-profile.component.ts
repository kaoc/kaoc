import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl, FormArray } from '@angular/forms';
import { MemberService } from '../member.service';
import { Membership } from '../Membership';
import { Member } from '../Member';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material';

@Component({
  selector: 'member-profile',
  templateUrl: './member-profile.component.html',
  styleUrls: ['./member-profile.component.css']
})
export class MemberProfileComponent implements OnInit {
  dataSource: MatTableDataSource<any>;
  @ViewChild(MatSort, { static: true }) sort: MatSort;

  isLinear = true;
  saved = false;

  displayedColumns: string[] = ['index', 'emailId', 'firstName', 'lastName', 'phoneNumber', 'adultFlag', 'action'];

  membershipTypeForm: FormGroup;
  memberForm: FormGroup;
  memberDetForm: FormGroup;
  paymentForm: FormGroup;
  paymentList: string[] = ['Cash', 'Cheque', 'Square'];
  memberShip: Membership;

  memberdet;
  paymentdet;

  membershipAmt;
  member: Member[];
  members: FormArray;

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

  constructor(private formBuilder: FormBuilder,
    private service: MemberService) { }

  ngOnInit() {

    this.membershipTypeForm = this.formBuilder.group({
      membershipType: '',
    });

    this.memberForm = this.formBuilder.group({
      emailId: ['', Validators.required],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      phoneNumber: ['', Validators.required],
      adultFlag: 'Adult',
    });

    this.memberDetForm = this.formBuilder.group({
      emailId: '',
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      phoneNumber: '',
      adultFlag: '',
    });

    this.paymentForm = this.formBuilder.group({
      paymode: ['', Validators.required],
      amount: '0',
      referenceNo: '',
      memo: '',
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

  setPaymentAmount(membershipType) {

    console.log('setPaymentAmount.membershipType=' + membershipType);
    if (membershipType === 'SRCITIZEN') {
      this.membershipAmt = 35;
    } else if (membershipType === 'INDIVIDUAL') {
      this.membershipAmt = 55;
    } else if (membershipType === 'FAMILY') {
      this.membershipAmt = 95;
    }
    this.paymentForm.controls.amount.patchValue(this.membershipAmt);

  }

  addMember(index) {
    console.log("index=" + index);
    this.data.members[index] = this.memberForm.value;
    this.setMatTable();
  }

  addFamily(action) {

    if (this.memberDetForm.invalid) {
      console.log('Member Detail form is invalid')
      return;
    } else {
      this.data.members.push(this.memberDetForm.value);
      this.memberDetForm.reset();
    }

    this.setMatTable();
    console.log("Creating membership for " + JSON.stringify(this.data));

  }

  deleteMember(index) {
    console.log('deleteMember member at index=' + index);
    this.data.members.splice(index, 1);
    this.setMatTable();
  }

  setMatTable() {
    this.dataSource = new MatTableDataSource(this.data.members);
    this.dataSource.sort = this.sort;
  }

  submitPayment() {
    if (this.paymentForm.invalid) {
      console.log('paymentForm is invalid')
      return;
    } else {
      console.log('this.data.members' + JSON.stringify(this.data.members));
      console.log('membershipTypeForm details' + JSON.stringify(this.membershipTypeForm.value));
      console.log('paymentForm details' + JSON.stringify(this.paymentForm.value));

      this.service.addMember(this.data.members, this.membershipTypeForm.value, this.paymentForm.value);
    }
  }
}
