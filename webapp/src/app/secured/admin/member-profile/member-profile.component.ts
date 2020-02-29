import { Component, OnInit, ViewChild, Inject } from '@angular/core';
import { FormBuilder, FormGroup, ValidatorFn, AbstractControl, Validators, FormArray } from '@angular/forms';
import { MemberService } from '../../member.service';
import { Membership } from '../../Membership';
import { Member } from '../../Member';
import { MatStepper, MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { ActivatedRoute, Router, NavigationEnd, NavigationStart } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

import { DialogWinComponent } from '../dialog-win/dialog-win.component';
import { ConfirmDelComponent } from './confirm-del.component';

export interface DialogData {
  message: string;
  memberDocId: string;
}

@Component({
  selector: 'member-profile',
  templateUrl: './member-profile.component.html',
  styleUrls: ['./member-profile.component.css']
})
export class MemberProfileComponent implements OnInit {
  @ViewChild('stepper', { static: false }) stepper: MatStepper;
  smallScreen: boolean;
  disablePayButton: boolean = false;
  errorMsg: string = '';
  paymentErrorMsg: string = '';
  memberPageTitle: string;
  //data:any= '';

  memberDetFormError = false;
  saved = false;

  displayedColumns: string[] = ['index', 'emailId', 'firstName', 'lastName', 'phoneNumber', 'ageGroup', 'action'];

  membershipTypeForm: FormGroup;
  memberForm: FormGroup;
  memberDetForm: FormGroup;
  paymentForm: FormGroup;
  paymentList: string[] = ['Cash', 'Check', 'Square'];
  membershipAmt: string = '0';
  familyUpdateIndex: number = -1;
  memberShip: Membership;

  memberdet;
  paymentdet;

  member: Member[];
  members: FormArray;

  //Defaults
  familyStepperPaymentBtnLabel: string;
  paymentStepperBtnLabel: string;
  isLinear: boolean;
  memberStatus: string;
  memberPaymentStatus: string;

  data: any;
  queryByMemberId: string;

  constructor(private formBuilder: FormBuilder,
    private memberService: MemberService,
    private route: ActivatedRoute,
    private breakpointObserver: BreakpointObserver,
    public dialog: MatDialog,
    
  ) {

     breakpointObserver.observe([
      Breakpoints.XSmall,
      Breakpoints.Small
    ]).subscribe(result => {
      this.smallScreen = result.matches;
    });
    
       this.setDefaults();
    //console.log('Inside MemberProfile constructor. memberService.routedFrom= ' + this.memberService.routedFrom);

    // const navigation = this.route.getCurrentNavigation();
    // const state = navigation.extras.state as {id: string};
    //this.queryByMemberId = state.id;

    // this.queryByMemberId=this.route.getCurrentNavigation().extras.state.id;
    //this.memberService.routedFrom=route.snapshot.paramMap.get('routeTo');

    this.queryByMemberId = this.route.snapshot.paramMap.get('id');
    console.log('queryByMemberId=' + this.queryByMemberId + 'this.memberService.routedFrom=' + this.memberService.routedFrom);

  }


  setDefaults() {
    console.log("Setting defaults");

    this.memberPageTitle = "Add member";
    this.familyStepperPaymentBtnLabel = "Pay";
    this.paymentStepperBtnLabel = "Submit Payment";
    this.memberStatus = "";
    this.memberPaymentStatus="";
    this.familyUpdateIndex = -1;
   


    this.data = {
      members: [{
        firstName: '',
        lastName: '',
        phoneNumber: '',
        emailId: '',
        kaocUserId: ''
      }],

      membership: {
        membershipType: '',
        paymentStatus: '',
        kaocMembershipId: ''
      }
    }

    this.membershipTypeForm = this.formBuilder.group({
      membershipType: ['', Validators.required]
    });

    this.memberForm = this.formBuilder.group({
      emailId: ['', Validators.email],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      phoneNumber: ['', [Validators.required ,
                        Validators.pattern('^[0-9]*$'),
                        Validators.minLength(10),
                        Validators.maxLength(10),
                        Validators.min(1)]
                   ],
      kaocUserId: '',
      ageGroup: 'Adult',
    });

    this.memberDetForm = this.formBuilder.group({
      emailId: '',
      firstName: '',
      lastName: '',
      phoneNumber: '',
      kaocUserId: '',
      ageGroup: 'Adult',
    });

    this.paymentForm = this.formBuilder.group({
      paymentMethod: ['', Validators.required],
      paymentAmount: '0',
      paymentExternalSystemRef: '',
      paymentNotes: '',
      paymentStatus: '',
      kaocPaymentId: ''
    });

  //  this.membershipTypeForm.reset();
  //  this.memberForm.reset();
  //  this.memberDetForm.reset();
  //  this.paymentForm.reset();
  }

  async ngOnInit() {

    
    console.log('i am in ngOnInit');

    if (this.queryByMemberId !== '' && this.queryByMemberId !== null
      && this.queryByMemberId !== undefined) {
      this.memberPageTitle = "Edit member";
      console.log("Calling this.memberService.getMemberById");

      await this.memberService.getMemberById(this.queryByMemberId);
      console.log("Completed call of this.memberService.getMemberById");
      console.log("memberService.getMemberDetails response=" + JSON.stringify(this.memberService.membershipDetails));

      if (this.memberService.membershipDetails.pastMembership) {
        this.disablePayButton = false;
        this.memberStatus = 'InActive';
        this.memberPaymentStatus= this.memberService.membershipDetails.pastMembership.paymentStatus.toUpperCase();
        this.membershipTypeForm.controls.membershipType.setValue(this.memberService.membershipDetails.pastMembership.membershipType.toUpperCase());
        console.log("this.memberService.membershipDetails.membershipType" + this.memberService.membershipDetails.pastMembership.membershipType);
      } else if (this.memberService.membershipDetails.membership) {
        console.log("this.memberService.membershipDetails.membershipType" + this.memberService.membershipDetails.membership.membershipType.toUpperCase());
        this.memberPaymentStatus= this.memberService.membershipDetails.membership.paymentStatus.toUpperCase();
        this.membershipTypeForm.controls.membershipType.setValue(this.memberService.membershipDetails.membership.membershipType);
      }

      if (this.memberService.membershipDetails.payment) {
        console.log("paymentstatus=" + this.memberService.membershipDetails.payment.paymentStatus.toLowerCase());
        if (this.memberService.membershipDetails.payment.paymentStatus.toLowerCase() === 'paid') {
          this.disablePayButton = true;
          this.memberStatus = 'Active';
          this.familyStepperPaymentBtnLabel = "View payment";
          this.paymentStepperBtnLabel = "Update";
        } else {
          this.memberStatus = 'InActive';
          this.disablePayButton = false;
        }

        this.membershipAmt = this.memberService.membershipDetails.payment.paymentAmount;
        this.paymentForm.setValue(this.memberService.membershipDetails.payment);

      }

      if (this.memberService.membershipDetails.members.length > 0) {

        let counter = 0;
        //******************** No adult flag passed from service so setValue fails */
        //this.memberForm.setValue (this.memberService.membershipDetails.members[0]);

        this.memberService.membershipDetails.members.forEach(element => {
          console.log("counter=" + counter);

          if (counter == 0) {
            this.memberForm.controls.emailId.setValue(this.memberService.membershipDetails.members[counter].emailId);
            this.memberForm.controls.firstName.setValue(this.memberService.membershipDetails.members[counter].firstName);
            this.memberForm.controls.lastName.setValue(this.memberService.membershipDetails.members[counter].lastName);
            this.memberForm.controls.phoneNumber.setValue(this.memberService.membershipDetails.members[counter].phoneNumber);
            this.memberForm.controls.kaocUserId.setValue(this.memberService.membershipDetails.members[counter].kaocUserId);
            this.memberForm.controls.ageGroup.setValue(this.memberService.membershipDetails.members[counter].ageGroup);
            this.setPaymentAmount();
            this.addMember(0, 0);
          } else {
            console.log('email id from position ' + counter + '=' + this.memberService.membershipDetails.members[counter].emailId)

            this.memberDetForm.controls.emailId.setValue(this.memberService.membershipDetails.members[counter].emailId);
            this.memberDetForm.controls.firstName.setValue(this.memberService.membershipDetails.members[counter].firstName);
            this.memberDetForm.controls.lastName.setValue(this.memberService.membershipDetails.members[counter].lastName);
            this.memberDetForm.controls.phoneNumber.setValue(this.memberService.membershipDetails.members[counter].phoneNumber);
            this.memberDetForm.controls.kaocUserId.setValue(this.memberService.membershipDetails.members[counter].kaocUserId);
            this.memberDetForm.controls.ageGroup.setValue(this.memberService.membershipDetails.members[counter].ageGroup);

            this.addFamilyMember(this.memberDetForm);
          }
          counter++;

        });
      }

      console.log('array length ' + this.memberService.membershipDetails.members.length);
      //this.data.members[0]= this.memberService.membershipDetails.members[0];

      // console.log('emailId=' + JSON.stringify(this.data.members[0]  ));

    }
  }


  addMember(index, stepperIndex) {
    console.log("addMember.index=" + index + ",stepperIndex=" + stepperIndex);

    if (!this.membershipTypeForm.valid) {
      console.log('Invalid membershipTypeForm ');
      return;
    }

    if (!this.memberForm.valid) {
      console.log('Invalid memberForm ');
      return;
    }

    this.data.members[index] = this.memberForm.value;
    this.setStepper(stepperIndex);
    this.goTo(stepperIndex);
  }

  addFamily(stepperIndex) {
    this.errorMsg = "";
    this.memberDetFormError = false;
    console.log("addFamily.memberDetForm.controls.ageGroup.value=" + this.memberDetForm.controls.ageGroup.value);
    console.log('this.validateMemberDetForm =' + this.validateMemberDetForm());

    if (this.validateMemberDetForm()) {
      this.data.members.push(this.memberDetForm.value);
      this.memberDetForm.reset();
      this.memberDetFormError = false;
    } else {
      return;
    }

    if (!this.memberDetForm.valid) {
      console.log('Invalid memberDet form');
      return;
    }

    this.setStepper(stepperIndex);
   // this.goTo(stepperIndex);

  }

  validateMemberDetForm() {
    let errCount = 0;
    if (this.memberDetForm.controls.ageGroup.value == 'Adult') {

      console.log("validateMemberDetForm>>> memberDetForm.value=" + JSON.stringify(this.memberDetForm.value));

      if (this.isNullField(this.memberDetForm.controls.emailId.value) || this.isNullField(this.memberDetForm.controls.firstName.value) ||
        this.isNullField(this.memberDetForm.controls.lastName.value) || this.isNullField(this.memberDetForm.controls.phoneNumber.value)
      ) {
        this.errorMsg = 'All fields are mandatory for Adult group';
        this.memberDetFormError = true;
        console.log(this.errorMsg);
        return false;
      } else {
        if (this.validatePhoneNo(this.memberDetForm.controls.phoneNumber.value) == false) {
          this.errorMsg = "Enter a 10 digit phone number";
          this.memberDetFormError = true;
          return false;
        } else {
          this.errorMsg = "";
          this.memberDetFormError = false;
        }

        if (this.validateEmail(this.memberDetForm.controls.emailId.value) == false) {
          this.errorMsg = "Invalid Email id";
          this.memberDetFormError = true;
          return false;
        }

      }

    } else if (this.memberDetForm.controls.ageGroup.value === 'Child') {

      if (this.isNullField(this.memberDetForm.controls.phoneNumber.value)) {
        this.errorMsg = "";
        this.memberDetFormError = false;

      } else {
        if (this.validatePhoneNo(this.memberDetForm.controls.phoneNumber.value) == false) {
          this.errorMsg = "Enter a 10 digit phone number";
          this.memberDetFormError = true;
          errCount++;
        } else {
          this.errorMsg = "";
          this.memberDetFormError = false;

        }
      }

      if (errCount == 0) {
        if (this.isNullField(this.memberDetForm.controls.firstName.value) || this.isNullField(this.memberDetForm.controls.lastName.value)) {
          this.errorMsg = 'Name is mandatory for Child group';
          console.log(this.errorMsg);
          this.memberDetFormError = true;
          errCount++;
        } else {
          if (this.validateEmail(this.memberDetForm.controls.emailId.value) == false) {
            this.errorMsg = "Invalid Email id";
            this.memberDetFormError = true;
            errCount++;
          }
        }
      }
    } else {
      this.errorMsg = 'Select age group';
      this.memberDetFormError = true;
      errCount++;
    }

    if (errCount > 0) {
      return false;
    } else {
      return true;
    }

  }

  addFamilyMember(memberDetForm) {
    this.data.members.push(memberDetForm.value);
    this.memberDetForm.reset();
    this.memberDetFormError = false;
  }


  editMember(element, index) {
    this.memberDetForm.setValue(element);
    this.familyUpdateIndex = index;
  }

  updateMember(index) {
    if (this.validateMemberDetForm()) {
      this.data.members[index] = this.memberDetForm.value;
      this.memberDetForm.reset();
      this.familyUpdateIndex = -1;
    }
  }

  confirmDelete( element , index): void {
    console.log("In confirmDelete ,firstname=" + element.firstName + 
                "lastname="+ element.lastName + "index="+ index);
    const dialogRef = this.dialog.open(ConfirmDelComponent, {
      disableClose: true ,
      width: '350px',
      panelClass:"kaoc-modalbox",
      data: { firstName : element.firstName, 
              lastName : element.lastName  }
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The confirmDelete dialog was closed' + result );

      if (result==='OK') {
        console.log('Delete Member');
        this.deleteMember(index);
      } else {
        console.log('Cancelled Delete');
      }
    });
 
  }

  deleteMember(index) {

    console.log('deleteMember member at index=' + index);
    this.data.members.splice(index, 1);
    this.familyUpdateIndex = -1;
  }

   /*setStepperIndexFromFormClick(event) {
    this.goTo(event.selectedIndex);
    this.setStepper(event.selectedIndex);
  }  */

  goTo(index: number) {
    this.setStepper(index);
  }

  setStepper(index: number) {
    console.log('Stepper index set at ' + index);
    this.stepper.selectedIndex = index;
  }

  setPaymentAmount() {

    console.log('setPaymentAmount.membershipType=' + this.membershipTypeForm.controls.membershipType.value);
    if (this.membershipTypeForm.controls.membershipType.value === 'SRCITIZEN') {
      this.membershipAmt = '35';
    } else if (this.membershipTypeForm.controls.membershipType.value === 'INDIVIDUAL') {
      this.membershipAmt = '55';
    } else if (this.membershipTypeForm.controls.membershipType.value === 'FAMILY') {
      this.membershipAmt = '95';
    }
    this.paymentForm.controls.paymentAmount.patchValue(this.membershipAmt);

  }

  async submitPayment() {
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

     await this.memberService.addMember(this.data.members, this.membershipTypeForm.value, this.paymentForm.value, this.memberStatus);
     console.log ('After submit Payment' + this.memberService.message);

     if (this.memberService.message) {
       this.openDialog(this.memberService.message, this.memberService.kaocUserDocId);
     }
      //this.setDefaults();
    }
  }

  validateEmail(emailId) {

    console.log('in validateEmail ' + emailId);
    this.errorMsg = "";
    this.memberDetFormError = false;
    this.errorMsg.substr
    if (emailId && emailId.indexOf("@") == -1) {
      return false;
    }

    return true;
  }

  isNullField(fieldValue) {

    if (fieldValue === '' || fieldValue === null || fieldValue === undefined) {
      return true;
    } else {
      return false;
    }
  }

 /* validatePhoneNoPattern(mobileNo) {

    let fieldVal = mobileNo;
    if (fieldVal === '' || fieldVal === null || fieldVal === undefined) {
      return true;
    } else {
      console.log('fieldVal.indexOf after 1 ' + fieldVal.indexOf('-', 1));
      console.log('fieldVal.indexOf after 4 ' + fieldVal.indexOf('-', 4));
      console.log('fieldVal.length' + fieldVal.length);

      if (fieldVal.indexOf('-', 1) == 3 && fieldVal.indexOf('-', 4) == 7 && fieldVal.length == 12) {
        var newStr = fieldVal.replace(/-/g, "");
        if (Number(+newStr)) {
          console.log("Number format newStr=" + newStr);
          return true;
        } else {
          console.log("Not a number newStr=" + newStr);
          return false;
        }
      } else {
        console.log('Phone number validation failed');
        return false;
      }
    }
  } */

  validatePhoneNo(mobileNo) {

    let fieldVal = mobileNo;
    if (fieldVal === '' || fieldVal === null || fieldVal === undefined) {
      return true;
    } else {
      console.log('fieldVal.length' + fieldVal.length);

      if (fieldVal.length == 10) {
         if (Number(+fieldVal)) {
          console.log("Number format newStr=" + fieldVal);
          return true;
        } else {
          console.log("Not a number newStr=" + fieldVal);
          return false;
        }
      } else {
        console.log('Enter a 10digit phone number');
        return false;
      }
    }
  }
 
   

  openDialog (messageTxt,docId) {
    console.log('In openDialog, message=' + messageTxt);
    const dialogRef = this.dialog.open(DialogWinComponent, {
      disableClose: true ,
      width: '300px',
      panelClass : 'kaoc-modalbox',
      data: {message:  messageTxt , memberDocId : docId}
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed');
    });
  }
}
 
export class ConfirmDeleteComponent implements OnInit {

  constructor(public dialogRef: MatDialogRef<ConfirmDeleteComponent>,
    ) { }
   
  onNoClick(): void {
      this.dialogRef.close();
   }

  ngOnInit() {
    
   
  }
 

  }