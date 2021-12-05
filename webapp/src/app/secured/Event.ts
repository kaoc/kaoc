export class Event {
    kaocEventId:string;
    endTime: number;
    eventImageUrl: string;
    eventThumbnailUrl: string;
    geoLocation: GeoPoint;
    location: string;
    name: string;
    startTime: number;
    totalAdultEventTicketCheckins: number;
    totalAdultMemberCheckins: number;
    totalChildEventTicketChecks: number;
    totalChildMemberCheckins: number;
}

export class GeoPoint {
    _latititude: number;
    _longitude: number;
}
