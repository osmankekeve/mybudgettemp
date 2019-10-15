import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { auth } from 'firebase/app';
import { AngularFireAuth } from '@angular/fire/auth';
import {AngularFirestore} from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {

  constructor(public angularFireAuth: AngularFireAuth,
              public router: Router,
              public authService: AuthenticationService,
              public db: AngularFirestore
  ) {
    this.angularFireAuth.authState.subscribe(userResponse => {
      if (userResponse) {
        localStorage.setItem('user', JSON.stringify(userResponse));
      } else {
        localStorage.setItem('user', null);
      }
    });
  }

  async login(email: string, password: string) {
    return await this.angularFireAuth.auth.signInWithEmailAndPassword(email, password);
  }

  async register(email: string, password: string) {
    return await this.angularFireAuth.auth.createUserWithEmailAndPassword(email, password);
  }

  async sendEmailVerification() {
    return await this.angularFireAuth.auth.currentUser.sendEmailVerification();
  }

  async sendPasswordResetEmail(passwordResetEmail: string) {
    return await this.angularFireAuth.auth.sendPasswordResetEmail(passwordResetEmail);
  }

  async logout() {
    return await this.angularFireAuth.auth.signOut();
  }

  isUserLoggedIn() {
    return JSON.parse(localStorage.getItem('user'));
  }

  isEmployeeLoggedIn() {
    return JSON.parse(localStorage.getItem('employee'));
  }

  async loginWithGoogle() {
    return await this.angularFireAuth.auth.signInWithPopup(new auth.GoogleAuthProvider());
  }

  public getUid(): string {
    const user = JSON.parse(localStorage.getItem('user'));
    return user.uid;

  }

  employeeLogin(email: string, password: string): any {
    return new Promise((resolve, reject) => {
      this.db.collection('tblProfile',
        ref => ref.where('userPrimaryKey', '==', this.getUid()).where('mailAddress', '==', email).where('password', '==', password)
      ).get().toPromise().then(snapshot => {
        if (snapshot.size > 0) {
          snapshot.forEach(doc => {
            localStorage.setItem('employee', JSON.stringify(doc.id));
            resolve(doc.id);
          });
        } else {
          localStorage.setItem('employee', null);
          resolve(null);
        }
      });
    });
  }
}
