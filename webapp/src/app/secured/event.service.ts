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

    constructor(public db: AngularFirestore,
      private ngFireFunctions: AngularFireFunctions,
      private paymentService: PaymentService) {
    }

    getUpcomingEvents(): Promise<Event[]> {
        return this.ngFireFunctions
            .httpsCallable('getUpcomingEvents')({})
            .toPromise().then(upcomingEvents => {
                console.log('Obtained upcoming events');
                return upcomingEvents;
            }).catch(e => {
                console.error(`Error fetching upcoming events`);
                throw e;
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
}
