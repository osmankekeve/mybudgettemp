import { Injectable } from '@angular/core';
import {AngularFirestore, AngularFirestoreCollection} from '@angular/fire/firestore';
import { Observable } from 'rxjs/Observable';
import { map, mergeMap } from 'rxjs/operators';
import { combineLatest } from 'rxjs';
import { AuthenticationService } from './authentication.service';
import { LogService } from './log.service';
import {SettingService} from './setting.service';
import {CollectionMainModel} from '../models/collection-main-model';
import {ProfileService} from './profile.service';
import {ContactUsMainModel} from '../models/contact-us-main-model';
import {ContactUsModel} from '../models/contact-us-model';
import {ProfileModel} from '../models/profile-model';

@Injectable({
  providedIn: 'root'
})
export class ContactUsService {
  listCollection: AngularFirestoreCollection<ContactUsModel>;
  mainList$: Observable<ContactUsMainModel[]>;
  employeeMap = new Map();
  tableName = 'tblContactUs';

  constructor(public authService: AuthenticationService, public sService: SettingService,
              public logService: LogService, public db: AngularFirestore, public eService: ProfileService) {
    if (this.authService.isUserLoggedIn()) {
      this.eService.getItems().toPromise().then(list => {
        this.employeeMap.clear();
        this.employeeMap.set('-1', 'Tüm Kullanıcılar');
        list.forEach(item => {
          this.employeeMap.set(item.primaryKey, item.longName);
        });
      });
    }
  }

  async addItem(record: ContactUsMainModel) {
    return await this.listCollection.add(Object.assign({}, record.data));
  }

  async removeItem(record: ContactUsMainModel) {
    return await this.db.collection(this.tableName).doc(record.data.primaryKey).delete();
  }

  async updateItem(record: ContactUsMainModel) {
    return await this.db.collection(this.tableName).doc(record.data.primaryKey).update(Object.assign({}, record.data));
  }

  async setItem(record: ContactUsMainModel, primaryKey: string) {
    return await this.listCollection.doc(primaryKey).set(Object.assign({}, record.data));
  }

  checkForSave(record: ContactUsMainModel): Promise<string> {
    return new Promise((resolve, reject) => {
      if (record.data.content.trim() === '') {
      reject('Lüfen içerik giriniz.');
    } else {
      resolve(null);
    }
    });
  }

  checkForRemove(record: ContactUsMainModel): Promise<string> {
    return new Promise((resolve, reject) => {
      resolve(null);
    });
  }

  clearSubModel(): ContactUsModel {

    const returnData = new ContactUsModel();
    returnData.primaryKey = null;
    returnData.userPrimaryKey = this.authService.getUid();
    returnData.employeePrimaryKey = this.authService.getEid();
    returnData.content = '';
    returnData.insertDate = Date.now();

    return returnData;
  }

  clearMainModel(): ContactUsMainModel {
    const returnData = new ContactUsMainModel();
    returnData.data = this.clearSubModel();
    returnData.employeeName = this.employeeMap.get(returnData.data.employeePrimaryKey);
    returnData.actionType = 'added';
    return returnData;
  }

  getMainItems(): Observable<CollectionMainModel[]> {
    this.listCollection = this.db.collection(this.tableName,
    ref => ref.orderBy('insertDate').where('userPrimaryKey', '==', this.authService.getUid()));
    this.mainList$ = this.listCollection.stateChanges().pipe(map(changes  => {
      return changes.map( change => {
        const data = change.payload.doc.data() as ContactUsModel;
        data.primaryKey = change.payload.doc.id;

        const returnData = new ContactUsMainModel();
        returnData.actionType = change.type;
        returnData.data = data;

        return this.db.collection('tblProfile').doc(data.employeePrimaryKey).valueChanges()
        .pipe(map( (profile: ProfileModel) => {
          returnData.employeeName = profile !== undefined ? profile.longName : 'Belirlenemeyen Müşteri Kaydı';
          return Object.assign({returnData}); }));
      });
    }), mergeMap(feeds => combineLatest(feeds)));
    return this.mainList$;
  }

  getMainItemsBetweenDates(startDate: Date, endDate: Date): Observable<CollectionMainModel[]> {
    this.listCollection = this.db.collection(this.tableName,
      ref => ref.orderBy('insertDate').startAt(startDate.getTime()).endAt(endDate.getTime())
        .where('userPrimaryKey', '==', this.authService.getUid()));
    this.mainList$ = this.listCollection.stateChanges().pipe(map(changes  => {
      return changes.map( change => {
        const data = change.payload.doc.data() as ContactUsModel;
        data.primaryKey = change.payload.doc.id;

        const returnData = new ContactUsMainModel();
        returnData.actionType = change.type;
        returnData.data = data;

        return this.db.collection('tblProfile').doc(data.employeePrimaryKey).valueChanges()
          .pipe(map( (profile: ProfileModel) => {
            returnData.employeeName = profile !== undefined ? profile.longName : 'Belirlenemeyen Müşteri Kaydı';
            return Object.assign({returnData}); }));
      });
    }), mergeMap(feeds => combineLatest(feeds)));
    return this.mainList$;
  }

}
