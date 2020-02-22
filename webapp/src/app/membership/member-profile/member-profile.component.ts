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
  disablePayButton:boolean= false;
  errorMsg: string = '';
  paymentErrorMsg: string = '';
  //data:any= '';
 
  memberDetFormError = false;
  saved = false;

  displayedColumns: string[] = ['index', 'emailId', 'firstName', 'lastName', 'phoneNumber', 'adultFlag', 'action'];

  membershipTypeForm: FormGroup;
  memberForm: FormGroup;
  memberDetForm: FormGroup;
  paymentForm: FormGroup;
  paymentList: string[] = ['Cash', 'Check', 'Square'];
  membershipAmt: string = '0';
  memberShip: Membership;

  memberdet;
  paymentdet;

  member: Member[];
  members: FormArray;
 
  //Defaults
  familyStepperPaymentBtnLabel: string;
  paymentStepperBtnLabel: string;
  isLinear: boolean;
  memberStatus:string;

  data = {
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
  constructor(private formBuilder: FormBuilder,
    private memberService: MemberService) {
    console.log('Inside MemberProfile constructor. memberService.routedFrom= ' + this.memberService.routedFrom);

    this.setDefaults ();
  }

  setDefaults () {
    this.isLinear = true;
    this.familyStepperPaymentBtnLabel="Skip & Pay";
    this.paymentStepperBtnLabel="Submit Payment";
    this.memberStatus="";
   }
  

  ngOnInit() {



    this.membershipTypeForm = this.formBuilder.group({
      membershipType: '',
    });

    this.memberForm = this.formBuilder.group({
      emailId: ['', Validators.email],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      phoneNumber: ['', Validators.required],
      kaocUserId:'',
      adultFlag: 'Adult',
    });

    this.memberDetForm = this.formBuilder.group({
      emailId: '',
      firstName: '',
      lastName: '',
      phoneNumber: '',
      kaocUserId:'',
      adultFlag: 'Adult',
    });

    this.paymentForm = this.formBuilder.group({
      paymentMethod: ['', Validators.required],
      paymentAmount: '0',
      paymentExternalSystemRef: '',
      paymentNotes: '',
      paymentStatus:'',
      kaocPaymentId:''
    });
 
    if (this.memberService.routedFrom === 'listmembers') {
      console.log("memberService.getMemberDetails response=" + JSON.stringify(this.memberService.membershipDetails));

      if (this.memberService.membershipDetails.pastMembership ) {
        this.disablePayButton= false;
        this.memberStatus='InActive';
        this.membershipTypeForm.controls.membershipType.setValue(this.memberService.membershipDetails.pastMembership.membershipType.toUpperCase());
        console.log("this.memberService.membershipDetails.membershipType" + this.memberService.membershipDetails.pastMembership.membershipType);

      }  else if (this.memberService.membershipDetails.membership) {
        console.log("this.memberService.membershipDetails.membershipType" + this.memberService.membershipDetails.membership.membershipType.toUpperCase());

        this.membershipTypeForm.controls.membershipType.setValue(this.memberService.membershipDetails.membership.membershipType);
      }
      
      if (this.memberService.membershipDetails.payment) {
        console.log("paymentstatus=" + this.memberService.membershipDetails.payment.paymentStatus.toLowerCase());
        if ( this.memberService.membershipDetails.payment.paymentStatus.toLowerCase()==='paid' ) {
          this.disablePayButton= true;
          this.memberStatus='Active';
          this.familyStepperPaymentBtnLabel="View payment";
          this.paymentStepperBtnLabel="Update";
        } else {
          this.memberStatus='InActive';
          this.disablePayButton= false;
        }
       
        this.membershipAmt=this.memberService.membershipDetails.payment.paymentAmount;
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
            this.addMember(0, 0);
          } else {
            console.log('email id from position ' + counter + '=' + this.memberService.membershipDetails.members[counter].emailId)

            this.memberDetForm.controls.emailId.setValue(this.memberService.membershipDetails.members[counter].emailId);
            this.memberDetForm.controls.firstName.setValue(this.memberService.membershipDetails.members[counter].firstName);
            this.memberDetForm.controls.lastName.setValue(this.memberService.membershipDetails.members[counter].lastName);
            this.memberDetForm.controls.phoneNumber.setValue(this.memberService.membershipDetails.members[counter].phoneNumber);
            this.memberDetForm.controls.kaocUserId.setValue(this.memberService.membershipDetails.members[counter].kaocUserId);
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
      this.membershipAmt = '35';
    } else if (this.membershipTypeForm.controls.membershipType.value === 'INDIVIDUAL') {
      this.membershipAmt = '55';
    } else if (this.membershipTypeForm.controls.membershipType.value === 'FAMILY') {
      this.membershipAmt = '95';
    }
    this.paymentForm.controls.paymentAmount.patchValue(this.membershipAmt);

  }

  addMember(index, stepperIndex) {
    console.log("addMember.index=" + index +",stepperIndex=" + stepperIndex );
    this.data.members[index] = this.memberForm.value;
    this.setMatTable();
  //  this.goTo(stepperIndex);
    this.setStepper(stepperIndex);
  }

  addFamily(stepperIndex) {
    this.errorMsg = "";


    console.log("this.memberDetForm.controls.adultFlag.value=" + this.memberDetForm.controls.adultFlag.value);
    if (this.memberDetForm.controls.adultFlag.value == 'Adult') {
      console.log("this.memberDetForm.controls.emailId.value=" + JSON.stringify(this.memberDetForm.value));

      if (this.memberDetForm.controls.emailId.value === '' || this.memberDetForm.controls.emailId.value === null ||
        this.memberDetForm.controls.firstName.value === '' || this.memberDetForm.controls.firstName.value === null ||
        this.memberDetForm.controls.lastName.value === '' || this.memberDetForm.controls.lastName.value === null ||
        this.memberDetForm.controls.phoneNumber.value === '' || this.memberDetForm.controls.phoneNumber.value === null
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

      if (this.memberDetForm.controls.firstName.value === '' || this.memberDetForm.controls.lastName.value === '' ||
        this.memberDetForm.controls.firstName.value === null || this.memberDetForm.controls.lastName.value === null) {
        this.errorMsg = 'Name is mandatory for Child group';
        this.memberDetFormError = true;
        return;
      } else {
        this.addFamilyMember(this.memberDetForm);
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
    //this.goTo(stepperIndex);
    this.setStepper(stepperIndex);
    
  }

  addFamilyMember(memberDetForm) {
    this.data.members.push(memberDetForm.value);
    this.memberDetForm.reset();
    this.memberDetFormError = false;
  }

  deleteMember(index) {
    console.log('deleteMember member at index=' + index);
    this.data.members.splice(index, 1);
    this.setMatTable();
  }

  setStepperIndexFromFormClick(event) {
    this.goTo(event.selectedIndex);
    this.setStepper(event.selectedIndex);
   
  }

  setStepper(index: number) {
    console.log('Stepper index set at ' + index);
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

      this.memberService.addMember(this.data.members, this.membershipTypeForm.value, this.paymentForm.value);
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
