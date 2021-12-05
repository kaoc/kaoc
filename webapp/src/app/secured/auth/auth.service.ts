import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { BehaviorSubject } from 'rxjs';
import { UserInfo } from 'firebase';
import { AngularFirestore } from '@angular/fire/firestore';
import { Member } from '../Member';
import { MemberRoles } from '../MemberRoles';

export interface UserInfoExt extends UserInfo {
  emailVerified: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private firebaseUserSource = new BehaviorSubject<UserInfoExt>(undefined);
  public firebaseUser = this.firebaseUserSource.asObservable();

  private kaocUserSource = new BehaviorSubject<Member>(undefined);
  public kaocUser = this.kaocUserSource.asObservable();

  private kaocRolesSource = new BehaviorSubject<MemberRoles>(undefined);
  public kaocRoles = this.kaocRolesSource.asObservable();

  private attempt = 0;

  // A reference to the last requested URL by user.
  public lastRequestedSecuredUrl: string = null;

    /**
     * Constructor
     *
     * @param fireAuth - Angular Fire Auth Service.
     * @param firestoreDB - Angular Firestore Database Reference.
     */
    constructor(private fireAuth: AngularFireAuth, private fireStoreDB: AngularFirestore) {
      fireAuth.user.subscribe((fireUser: UserInfoExt) => {
          this.firebaseUserSource.next(fireUser);
          if (fireUser) {
              this.loadKaocUser(fireUser.uid);
              this.loadKaocRoles(fireUser.uid);
          } else {
              this.kaocUserSource.next(null);
              this.kaocRolesSource.next(null);
          }
      });
    }

    /**
     * Re-loads KAOC User Profile.
     */
    reloadUserProfile() {
        const firebaseUser = this.getFirebaseUser();
        if (firebaseUser && firebaseUser.uid) {
            this.loadKaocUser(firebaseUser.uid);
        }
    }

  /**
   * Returns the current logged in user.
   */
  getFirebaseUser(): UserInfoExt {
    return this.firebaseUserSource.getValue();
  }

  /**
   * Returns the related Kaoc user object for the current logged
   * in user.
   */
  getKaocUser(): Member {
    return this.kaocUserSource.getValue();
  }

  getKaocRoles(): MemberRoles {
    return this.kaocRolesSource.getValue();
  }

  private loadKaocRoles(loginId: string): void {
    this.fireStoreDB.firestore.doc(`/kaocRoles/${loginId}`)
    .get()
    .then(rulesResultSnapShot => {
      if (rulesResultSnapShot.exists) {
        this.kaocRolesSource.next(rulesResultSnapShot.data() as MemberRoles);
      } else {
        this.kaocRolesSource.next(null);
      }
    }).catch(e => {
      console.error('Error retrieving user roles ', e);
    });
  }

  /**
   * Loads the KAOC User corresponding to the login id.
   * @param loginId Login Id
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
              kaocUserData.kaocUserId = userDoc.id;
              console.log(`Kaoc User Loaded for account ${JSON.stringify(kaocUserData)}`);
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
