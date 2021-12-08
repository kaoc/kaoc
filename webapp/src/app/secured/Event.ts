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
}

export class GeoPoint {
    _latitude: number;
    _longitude: number;
}
