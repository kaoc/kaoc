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
 