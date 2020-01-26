import { Component, OnInit, Inject } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

@Component({
  selector: 'edit-member',
  templateUrl: './edit-member.component.html',
  styleUrls: ['./edit-member.component.css']
})
export class EditMemberComponent implements OnInit {

  saved= false;
  memberdet;
  memberForm: FormGroup;
  public selection: string;
  
  constructor(
    public dialogRef: MatDialogRef<EditMemberComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder) {}


    ngOnInit() {
      console.log('EditMemberComponent::Record to be edited' + JSON.stringify(this.data));
      console.log('memberId=' +  this.data.membertoedit.memberId );
      console.log('firstName=' + this.data.membertoedit.firstName );

     
      this.memberForm = this.fb.group({
        id: { value: this.data.membertoedit.id , disabled: true} ,
        memberId: { value: this.data.membertoedit.memberId , disabled: true} ,
        firstName: { value: this.data.membertoedit.firstName , disabled: true} ,
        lastName: { value: this.data.membertoedit.lastName , disabled: true} ,
        emailId: { value: this.data.membertoedit.emailId , disabled: true} ,
        mobileNo: { value: this.data.membertoedit.mobileNo , disabled: true} ,
        membershipType: { value: this.data.membertoedit.membershipType , disabled: true} 
      }); 
 
    }

    saveMemberInfo() {
      this.memberdet=JSON.stringify(this.memberForm.value);
      this.saved=true;
     
      //this.memberService.addMember(this.member);
    }

  onNoClick(): void {
    this.dialogRef.close();
  }

}
