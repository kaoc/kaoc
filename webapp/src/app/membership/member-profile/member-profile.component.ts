import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl, FormArray, AbstractControl } from '@angular/forms';
import { MemberService } from '../member.service';
import { Membership } from '../Membership';
import { Member } from '../Member';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort, MatStepper } from '@angular/material';

@Component({
  selector: 'member-profile',
  templateUrl: './member-profile.component.html',
  styleUrls: ['./member-profile.component.css']
})
export class MemberProfileComponent implements OnInit {
  dataSource: MatTableDataSource<any>;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild('stepper', { static: true }) stepper: MatStepper;

  errorMsg: string = '';
  paymentErrorMsg: string = '';
  isLinear = true;
  memberDetFormError = false;
  saved = false;

  displayedColumns: string[] = ['index', 'emailId', 'firstName', 'lastName', 'phoneNumber', 'adultFlag', 'action'];

  membershipTypeForm: FormGroup;
  memberForm: FormGroup;
  memberDetForm: FormGroup;
  paymentForm: FormGroup;
  paymentList: string[] = ['Cash', 'Check', 'Square'];
  membershipAmt: number = 0;
  memberShip: Membership;

  memberdet;
  paymentdet;


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
      emailId: ['', Validators.email],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      phoneNumber: ['', Validators.required],
      adultFlag: 'Adult',
    });

    this.memberDetForm = this.formBuilder.group({
      emailId: '',
      firstName: '',
      lastName: '',
      phoneNumber: '',
      adultFlag: '',
    });

    this.paymentForm = this.formBuilder.group({
      paymentMethod: ['', Validators.required],
      paymentAmount: '0',
      paymentExternalSystemRef: '',
      paymentNotes: '',
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

  phoneNumberPatternValidator(formControl: AbstractControl) {
    if (!formControl.parent) {
      return null;
    }

    if (formControl.parent.get('phoneNumber').value) {
      console.log('in phoneNumberPatternValidator ' + Validators.pattern(formControl.value));
      return Validators.pattern(formControl.value);
    }
    return null;
  }

  setPaymentAmount() {

    console.log('setPaymentAmount.membershipType=' + this.membershipTypeForm.controls.membershipType.value);
    if (this.membershipTypeForm.controls.membershipType.value === 'SRCITIZEN') {
      this.membershipAmt = 35;
    } else if (this.membershipTypeForm.controls.membershipType.value === 'INDIVIDUAL') {
      this.membershipAmt = 55;
    } else if (this.membershipTypeForm.controls.membershipType.value === 'FAMILY') {
      this.membershipAmt = 95;
    }
    this.paymentForm.controls.paymentAmount.patchValue(this.membershipAmt);

  }

  addMember(index, stepperIndex) {
    console.log("index=" + index);
    this.data.members[index] = this.memberForm.value;
    this.setMatTable();
    this.setStepper(stepperIndex);
  }

  addFamily(stepperIndex) {
    this.errorMsg = "";
    

    console.log("this.memberDetForm.controls.adultFlag.value=" + this.memberDetForm.controls.adultFlag.value);
    if (this.memberDetForm.controls.adultFlag.value == 'Adult') {


      console.log("this.memberDetForm.controls.emailId.value=" + JSON.stringify(this.memberDetForm.value));

      if (this.memberDetForm.controls.emailId.value === '' || this.memberDetForm.controls.emailId.value === null ||
        this.memberDetForm.controls.firstName.value === '' || this.memberDetForm.controls.firstName.value === null ||
        this.memberDetForm.controls.lastName.value === '' || this.memberDetForm.controls.lastName.value ===null ||
        this.memberDetForm.controls.phoneNumber.value === '' || this.memberDetForm.controls.phoneNumber.value===null
      ) {
        this.errorMsg = 'All fields are mandatory for Adult group';
        this.memberDetFormError = true;
        return;
      } else {
        this.data.members.push(this.memberDetForm.value);
        this.memberDetForm.reset();
        this.memberDetFormError = false;
        console.log('memberDetForm validated for adult group');
      }

    } else if (this.memberDetForm.controls.adultFlag.value === 'Child') {
      console.log("else this.memberDetForm.controls.adultFlag.value=" + this.memberDetForm.controls.adultFlag.value);

      if (this.memberDetForm.controls.firstName.value === ''  || this.memberDetForm.controls.lastName.value === '' ||
      this.memberDetForm.controls.firstName.value === null  || this.memberDetForm.controls.lastName.value === null ) {
        this.errorMsg = 'Name is mandatory for Child group';
        this.memberDetFormError = true;
        return;
      } else {
        this.data.members.push(this.memberDetForm.value);
        this.memberDetForm.reset();
        this.memberDetFormError = false;
        console.log('all good');
      }
    }

    if (this.memberDetForm.controls.emailId.value) {
      if (!this.validateEmail(this.memberDetForm.controls.emailId.value)) {
        this.errorMsg = "Invalid Email id";
        this.memberDetFormError = true;
        return;
      }
    }

    // if (this.memberDetForm.controls.phoneNumber.value) {
    //   this.validationPhone(this.memberDetForm);
    // }

    if (!this.memberDetForm.valid) { 
      console.log('Invalid memberDet form');
      return;
    }

    this.setMatTable();
    this.setStepper(stepperIndex);


  }

  deleteMember(index) {
    console.log('deleteMember member at index=' + index);
    this.data.members.splice(index, 1);
    this.setMatTable();
  }

  setStepper(index: number) {
    this.stepper.selectedIndex = index;
  }

  goTo(index: number) {
    this.setStepper(index);
  }

  setMatTable() {
    this.dataSource = new MatTableDataSource(this.data.members);
    this.dataSource.sort = this.sort;
  }

  submitPayment() {
    this.paymentErrorMsg = "";
    if (this.paymentForm.invalid) {
      console.log('paymentForm is invalid')
      return;
    } else {
      if (this.paymentForm.controls.paymentMethod.value === 'Check'
        && this.paymentForm.controls.paymentExternalSystemRef.value === '') {
        this.paymentErrorMsg = 'Transaction Reference No mandatory for Check Payment';
        return;
      }

      console.log('this.data.members' + JSON.stringify(this.data.members));
      console.log('membershipTypeForm details' + JSON.stringify(this.membershipTypeForm.value));
      console.log('paymentForm details' + JSON.stringify(this.paymentForm.value));

      this.service.addMember(this.data.members, this.membershipTypeForm.value, this.paymentForm.value);
    }
  }

  validateEmail(emailId) {
    this.errorMsg = "";
    this.memberDetFormError = false;

    console.log("In validateEmail emailId=" + emailId.indexOf("@"));
    if (emailId && emailId.indexOf("@") == -1) {
      return false;
    }

    return true;
  }

  //validationPhone(frm) {
  // mobileNo.pattern('^\d{3}-\d{3}-\d{4}$')

  // console.log('pattern=' + frm.controls.phoneNumber.value.match('^\d{3}-\d{3}-\d{4}$'));
  // }
  /* if ( ) {
     console.log('Valid mobile pattern');
     return true;
  } else {
    console.log('Invalid mobile pattern');
    this.errorMsg="Invalid Email id ";
    this.memberDetFormError=true;
    return false;
  } */
}
