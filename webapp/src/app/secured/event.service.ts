import { PaymentService } from '../payment/payment.service';
import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Event, EventPricing, EventTicket, EventTicketDetails } from './Event';
import { MemberEventCheckIn } from './MemberEventCheckIn';
import { AngularFireFunctions } from '@angular/fire/functions';

@Injectable({
  providedIn: 'root'
})
export class EventService {
    upcomingEventsPromise: Promise<Event[]> = null;
    pastEventsPromise: Promise<Event[]> = null;

    constructor(public db: AngularFirestore,
      private ngFireFunctions: AngularFireFunctions,
      private paymentService: PaymentService) {
    }

    getUpcomingEvents(): Promise<Event[]> {
      if(this.upcomingEventsPromise == null) {
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
      return this.upcomingEventsPromise;
    }

    getPastEvents(): Promise<Event[]> {
      if(this.pastEventsPromise == null) {
        this.pastEventsPromise = this.ngFireFunctions
            .httpsCallable('getPastEvents')({})
            .toPromise().then(upcomingEvents => {
                console.log('Obtained past events');
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
      return this.pastEventsPromise;
    }

    /**
     * Returns the event by the given id.
     *
     * @param kaocEventId
     * @returns
     */
    getUpcomingEventsById(kaocEventId): Promise<Event> {
      this.getUpcomingEvents();
      return this.upcomingEventsPromise.then(events=>{
        if(events) {
          return events.find(event=>event.kaocEventId == kaocEventId);
        }
        return null;
      });
    }

    getPurchasedEventTickets(kaocUserId: string, kaocEventIds: string[], includeQRCode: boolean): Promise<EventTicket[]> {
      return this.ngFireFunctions
        .httpsCallable('getPurchasedEventTickets')({kaocUserId, kaocEventIds, includeQRCode})
        .toPromise().then(eventTickets => {
            console.log(`Succesfully purchased event tickets for user ${kaocUserId}`);
            return eventTickets;
        }).catch(e => {
            console.error(`Error retrieving purchased event tickets for user ${kaocUserId}`);
            throw e;
        });
  }

    performEventMemberCheckIn(kaocUserId: string, kaocEventId: string, numAdults: number, numChildren: number): Promise<boolean> {
        return this.ngFireFunctions
                    .httpsCallable('performEventMemberCheckIn')({kaocUserId, kaocEventId, numAdults, numChildren})
                    .toPromise().then(upcomingEvents => {
                        console.log('User succesfully checked in for event');
                        return true;
                    }).catch(e => {
                        console.error(`Error checking in user for event`);
                        throw e;
                    });
    }

    performEventTicketCheckIn(kaocEventTicketId: string, numAdults: number, numChildren: number): Promise<boolean> {
      return this.ngFireFunctions
                  .httpsCallable('performEventTicketCheckIn')({kaocEventTicketId, numAdults, numChildren})
                  .toPromise().then(status => {
                      console.log('User succesfully checked in for event using ticket');
                      return true;
                  }).catch(e => {
                      console.error(`Error checking in user for event using ticket`);
                      throw e;
                  });
    }

    getEventTicketDetails(kaocEventTicketId): Promise<EventTicketDetails> {
        return this.ngFireFunctions
                .httpsCallable('getEventTicketDetails')({kaocEventTicketId})
                .toPromise().then(eventTicketDetails => {
                    console.log(`Succesfully retrieved event ticket details for ticket id ${kaocEventTicketId}`);
                    return eventTicketDetails;
                }).catch(e => {
                    console.error(`Error retrieving event ticket details for ticket id ${kaocEventTicketId}`);
                    throw e;
                });
  }


    /**
     * Returns the event by the given id.
     *
     * @param kaocEventId
     * @returns
     */
    getFullEventDetails(kaocEventId): Promise<Event> {
          return this.ngFireFunctions
          .httpsCallable('getFullEventDetails')({kaocEventId})
          .toPromise().then(fullEventDetails => {
              console.log('Retreived full event details');
              return fullEventDetails;
          }).catch(e => {
              console.error(`Error gettting full event details`);
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

    getEventPricing(kaocEventId): Promise<EventPricing> {
      return this.ngFireFunctions
                    .httpsCallable('getEventPricing')({kaocEventId})
                    .toPromise()
                    .catch(e=> {
                    return {
                      'adult': 20,
                      'child': 15
                    }
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
