import { Member } from "./Member";

export class Event {
    kaocEventId:string;
    endTime: number;
    eventImageUrl: string;
    eventThumbnailUrl: string;
    geoLocation: GeoPoint;
    location: string;
    name: string;
    membershipAccessIncluded: boolean;
    description:string;
    startTime: number;
    totalAdultEventTicketCheckins: number;
    totalAdultMemberCheckins: number;
    totalChildEventTicketChecks: number;
    totalChildMemberCheckins: number;
    mapsLink:string;
    eventPhotos: string;
}

export class GeoPoint {
    _latitude: number;
    _longitude: number;
}

export interface EventPricing {
  adult: number;
  child: number;
}

export class EventTicket {
    kaocEventTicketId: string;
    kaocUserId: string;
    kaocEventId: string;
    numAdults: number;
    numChildren: number;
    paymentStatus: string;
    qrCodeDataURL: string;
}

export class EventTicketDetails {
  kaocEventTicketId: string;
  kaocUser: Member;
  kaocEvent: Event;
  numAdults: number;
  numChildren: number;
  paymentStatus: string;
}
