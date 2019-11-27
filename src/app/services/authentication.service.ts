import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { auth } from 'firebase/app';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore } from '@angular/fire/firestore';
import {ProfileModel} from '../models/profile-model';
import { ProfileMainModel } from '../models/profile-main-model';
import { ProfileService } from './profile.service';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {

  constructor(public angularFireAuth: AngularFireAuth,
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
    if (localStorage.getItem('user')) {
      return JSON.parse(localStorage.getItem('user'));
    } else {
      return null;
    }
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

  public getEid(): string {
    const user = JSON.parse(localStorage.getItem('employee')) as ProfileMainModel;
    return user.data.primaryKey;
  }

  clearProfileModel(): ProfileModel {
    const returnData = new ProfileModel();
    returnData.primaryKey = null;
    returnData.userPrimaryKey = this.getUid();
    returnData.insertDate = Date.now();

    return returnData;
  }

  clearProfileMainModel(): ProfileMainModel {
    const returnData = new ProfileMainModel();
    returnData.data = this.clearProfileModel();
    returnData.typeTr = 'admin';
    returnData.actionType = 'added';
    return returnData;
  }

  employeeLogin(email: string, password: string): any {
    return new Promise((resolve, reject) => {
      this.db.collection('tblProfile',
        ref => ref.where('userPrimaryKey', '==', this.getUid()).where('mailAddress', '==', email).where('password', '==', password)
      ).get().toPromise().then(snapshot => {
        if (snapshot.size > 0) {
          snapshot.forEach(doc => {
            const data = doc.data() as ProfileModel;
            data.primaryKey = doc.id;

            const returnData = this.clearProfileMainModel();
            if (data.type === 'admin') {
              returnData.typeTr = 'Administrator';
            } else if (data.type === 'manager') {
              returnData.typeTr = 'Yönetici';
            } else {
              returnData.typeTr = 'Kullanıcı';
            }
            returnData.data = data;
            localStorage.setItem('employee', JSON.stringify(returnData));
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
