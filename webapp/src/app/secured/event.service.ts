import { PaymentService } from '../payment/payment.service';
import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Event } from './Event';
import { MemberEventCheckIn } from './MemberEventCheckIn';
import { AngularFireFunctions } from '@angular/fire/functions';

@Injectable({
  providedIn: 'root'
})
export class EventService {
    upcomingEventsPromise: Promise<Event[]>;

    constructor(public db: AngularFirestore,
      private ngFireFunctions: AngularFireFunctions,
      private paymentService: PaymentService) {
        this.upcomingEventsPromise = this.ngFireFunctions
            .httpsCallable('getUpcomingEvents')({})
            .toPromise().then(upcomingEvents => {
                console.log('Obtained upcoming events');
                if(upcomingEvents) {
                    upcomingEvents.forEach(event=>{
                        if(event.geoLocation) {
                            event.mapsLink = `https://www.google.com/maps/search/?api=1&query=${event.geoLocation._latitude},${event.geoLocation._longitude}`;
                        }
                    });
                }
                return upcomingEvents;
            }).catch(e => {
                console.error(`Error fetching upcoming events`);
                throw e;
            });
    }

    getUpcomingEvents(): Promise<Event[]> {
      return this.upcomingEventsPromise;
    }

    /**
     * Returns the event by the given id.
     *
     * @param kaocEventId
     * @returns
     */
    getUpcomingEventsById(kaocEventId): Promise<Event> {
      return this.upcomingEventsPromise.then(events=>{
        if(events) {
          return events.find(event=>event.kaocEventId == kaocEventId);
        }
        return null;
      });
    }

    performMemberEventCheckIn(kaocUserId: string, kaocEventId: string, numAdults: number, numChildren: number): Promise<boolean> {
        return this.ngFireFunctions
                    .httpsCallable('performMemberEventCheckIn')({kaocUserId, kaocEventId, numAdults, numChildren})
                    .toPromise().then(upcomingEvents => {
                        console.log('User succesfully checked in for event');
                        return true;
                    }).catch(e => {
                        console.error(`Error checking in user for event`);
                        throw e;
                    });
    }

    /**
     * Returns the check in details for the given user for a given event.
     *
     * @param kaocUserId
     * @param kaocEventId
     * @returns
     */
     getMemberEventCheckInQRCode(kaocUserId, kaocEventId): Promise<any> {
        return this.ngFireFunctions
            .httpsCallable('getMemberEventCheckInQRCode')({kaocUserId, kaocEventId})
            .toPromise().then(eventCheckInQRCodeData => {
                console.log('Obtained member event checkin qr code data');
                return eventCheckInQRCodeData;
            }).catch(e => {
                console.error(`Error fetching member event checkin qr code data for ${kaocUserId} and event ${kaocEventId}`);
                throw e;
            });
    }

    /**
     * Returns the check in details for the given user for a given event.
     *
     * @param kaocUserId
     * @param kaocEventId
     * @returns
     */
    getMemberEventCheckinDetails(kaocUserId, kaocEventId): Promise<MemberEventCheckIn[]> {
      return this.ngFireFunctions
              .httpsCallable('getMemberEventCheckinDetails')({kaocUserId, kaocEventId})
              .toPromise().then(userEventCheckins => {
                  console.log('Retrieved member event check-ins');
                  return userEventCheckins;
              }).catch(e => {
                  console.error(`Error retrieving member event check-ins`);
                  throw e;
              });
    }

    /**
     * Sends event emails to all active members
     *
     * @param kaocEventId
     * @returns
     */
     sendMemberEventPassEmailToActiveMemberships(kaocEventId): Promise<boolean> {
        return this.ngFireFunctions
              .httpsCallable('sendMemberEventPassEmailToActiveMemberships')({kaocEventId})
              .toPromise().then(status => {
                  console.log('Sent Event Email to all active members');
                  return true;
              }).catch(e => {
                  console.error(`Error sending event email to all active members`);
                  throw e;
              });
    }
}
