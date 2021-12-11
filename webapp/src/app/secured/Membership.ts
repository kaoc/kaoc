import { Member } from './Member';

export interface Membership {
    membership:MembershipDet,
    pastMembership:PastMembershipDet,
    members: Member[];
    payment: PaymentDet
  }

  export interface MembershipDet {
    membershipType:string;
    paymentStatus: string;
    kaocMembershipId: string;
  }

  export interface MembershipReportDetails {
    firstName:string;
    lastName: string;
    emailId: string;
    ageGroup: string;
    phoneNumber: string;
    membershipType: string;
    paymentStatus: string;
    legacyMembershipId: string;
    kaocMembershipId: string;
    paymentMethod: string;
    paymentAmount: string;
    paymentNotes: string;
    paymentExternalSystemRef: string;
    kaocPaymentId: string;
    paymentTime:number;
  }

  export interface PastMembershipDet {
    membershipType:string;
    paymentStatus: string;
    kaocMembershipId: string;
  }

  export interface PaymentDet {
    paymentMethod:string;
    paymentAmount:string;
    paymentNotes:string;
    paymentStatus:string;
    paymentExternalSystemRef:string;
    kaocPaymentId:string;
  }

  export interface MembershipPricing {
    family: number;
    individual: number;
    seniorCitizen: number;
  }
