import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { auth } from 'firebase/app';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore } from '@angular/fire/firestore';
import { ProfileModel } from '../models/profile-model';
import { ProfileMainModel } from '../models/profile-main-model';
import { ProfileService } from './profile.service';
import { LogService } from './log.service';
import {getUserTypes} from '../core/correct-library';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {

  constructor(protected angularFireAuth: AngularFireAuth,
              protected db: AngularFirestore
  ) {
    this.angularFireAuth.authState.subscribe(userResponse => {
      if (userResponse) {
        sessionStorage.setItem('user', JSON.stringify(userResponse));
      } else {
        sessionStorage.setItem('user', null);
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
    if (sessionStorage.getItem('user')) {
      return JSON.parse(sessionStorage.getItem('user'));
    } else {
      return null;
    }
  }

  isEmployeeLoggedIn() {
    return JSON.parse(sessionStorage.getItem('employee'));
  }

  async loginWithGoogle() {
    return await this.angularFireAuth.auth.signInWithPopup(new auth.GoogleAuthProvider());
  }

  public getUid(): string {
    const user = JSON.parse(sessionStorage.getItem('user'));
    return user.uid;
  }

  public getEid(): string {
    const user = JSON.parse(sessionStorage.getItem('employee')) as ProfileMainModel;
    return user.data.primaryKey;
  }

  checkFields(model: ProfileModel): ProfileModel {
    const cleanModel = this.clearProfileModel();
    if (model.employeePrimaryKey === undefined) {
      model.employeePrimaryKey = '-1';
    }
    if (model.longName === undefined) { model.longName = cleanModel.longName; }
    if (model.mailAddress === undefined) { model.mailAddress = cleanModel.mailAddress; }
    if (model.phone === undefined) { model.phone = cleanModel.phone; }
    if (model.password === undefined) { model.password = cleanModel.password; }
    if (model.type === undefined) { model.type = cleanModel.type; }
    if (model.isActive === undefined) { model.isActive = cleanModel.isActive; }
    if (model.pathOfProfilePicture === undefined) { model.pathOfProfilePicture = cleanModel.pathOfProfilePicture; }

    return model;
  }

  clearProfileModel(): ProfileModel {
    const returnData = new ProfileModel();
    returnData.primaryKey = null;
    returnData.longName = '';
    returnData.mailAddress = '';
    returnData.phone = '';
    returnData.password = '';
    returnData.type = 'user';
    returnData.pathOfProfilePicture = '../../assets/images/users.png';
    returnData.isActive = true;
    returnData.userPrimaryKey = this.getUid();
    returnData.insertDate = Date.now();

    return returnData;
  }

  clearProfileMainModel(): ProfileMainModel {
    const returnData = new ProfileMainModel();
    returnData.data = this.clearProfileModel();
    returnData.typeTr = getUserTypes().get(returnData.data.type);
    returnData.actionType = 'added';
    returnData.isActiveTr = returnData.data.isActive === true ? 'Aktif' : 'Pasif';
    return returnData;
  }

  employeeLogin(email: string, password: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.collection('tblProfile',
        ref => ref.where('userPrimaryKey', '==', this.getUid())
          .where('mailAddress', '==', email)
          .where('password', '==', password)
      ).get().toPromise().then(snapshot => {
        if (snapshot.size > 0) {
          snapshot.forEach(doc => {
            const data = doc.data() as ProfileModel;
            data.primaryKey = doc.id;

            const returnData = this.clearProfileMainModel();
            returnData.data = this.checkFields(data);
            returnData.typeTr = getUserTypes().get(returnData.data.type);
            sessionStorage.setItem('employee', JSON.stringify(returnData));
            resolve(doc.id);
          });
        } else {
          sessionStorage.setItem('employee', null);
          reject('Mail adresi ve şifrenizi kontrol ediniz.');
        }
      });
    });
  }
}
