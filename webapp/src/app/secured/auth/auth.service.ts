import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { BehaviorSubject } from 'rxjs';
import { UserInfo } from 'firebase';
import { AngularFirestore } from '@angular/fire/firestore';
import { Member } from 'src/app/membership/Member';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private firebaseUserSource = new BehaviorSubject<UserInfo>(undefined);
  public firebaseUser = this.firebaseUserSource.asObservable();

  private kaocUserSource = new BehaviorSubject<Member>(undefined);
  public kaocUser = this.kaocUserSource.asObservable();

  private attempt = 0;

  /**
   * Constructor
   *
   * @param fireAuth - Angular Fire Auth Service.
   * @param firestoreDB - Angular Firestore Database Reference.
   */
  constructor(private fireAuth: AngularFireAuth, private fireStoreDB: AngularFirestore) {
    fireAuth.user.subscribe((fireUser: UserInfo) => {
      this.firebaseUserSource.next(fireUser);
      if (fireUser) {
        this.loadKaocUser(fireUser.uid);
      } else {
        this.kaocUserSource.next(null);
      }
    });
  }

  /**
   * Returns the current logged in user.
   */
  getFirebaseUser(): UserInfo {
    return this.firebaseUserSource.getValue();
  }

  /**
   * Returns the related Kaoc user object for the current logged
   * in user.
   */
  getKaocUser(): Member {
    return this.kaocUserSource.getValue();
  }

  /**
   * Loads the KAOC User corresponding to the login id.
   * @param loginId
   */
  private loadKaocUser(loginId: string): void {
    this.fireStoreDB.firestore
      .collection('kaocUsers')
      .where('loginId', '==', loginId)
      .limit(1)
      .get()
      .then(querySnapshot => {
          if (!querySnapshot.empty) {
            querySnapshot.forEach(userDoc => {
              const kaocUserData = userDoc.data();
              console.debug(`Kaoc User Loaded for account ${JSON.stringify(kaocUserData)}`);
              this.kaocUserSource.next(kaocUserData as Member);
            });
          } else {
            // Maybe this is the first time user is loggin in.
            // It might take a few seconds before the Kaoc user
            // record is created. Reload after sometime?

            if (this.attempt < 5) {
              this.attempt++;
              window.setTimeout(this.loadKaocUser.bind(this, loginId), 2000);
            } else {
              console.error('Failed to find kaoc user information related to the current user');
              this.kaocUserSource.next(null);
            }
          }
      }).catch(e => {
        console.error('Failed to retreive kaoc user info ', e);
        this.kaocUserSource.next(null);
      });
  }
}
