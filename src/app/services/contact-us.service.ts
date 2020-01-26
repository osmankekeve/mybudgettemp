import { Injectable } from '@angular/core';
import {AngularFirestore, AngularFirestoreCollection, CollectionReference, Query} from '@angular/fire/firestore';
import { Observable } from 'rxjs/Observable';
import { CustomerModel } from '../models/customer-model';
import { map, flatMap } from 'rxjs/operators';
import { combineLatest } from 'rxjs';
import { CollectionModel } from '../models/collection-model';
import { AuthenticationService } from './authentication.service';
import { LogService } from './log.service';
import {SettingService} from './setting.service';
import {CollectionMainModel} from '../models/collection-main-model';
import {ProfileService} from './profile.service';
import {AccountVoucherMainModel} from '../models/account-voucher-main-model';
import {ContactUsMainModel} from "../models/contact-us-main-model";
import {ContactUsModel} from "../models/contact-us-model";
import {ProfileModel} from "../models/profile-model";

@Injectable({
  providedIn: 'root'
})
export class ContactUsService {
  listCollection: AngularFirestoreCollection<ContactUsModel>;
  mainList$: Observable<ContactUsMainModel[]>;
  tableName = 'tblContactUs';

  constructor(public authService: AuthenticationService, public sService: SettingService,
              public logService: LogService, public db: AngularFirestore) {

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
    returnData.employeeName = '';
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
    }), flatMap(feeds => combineLatest(feeds)));
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
    }), flatMap(feeds => combineLatest(feeds)));
    return this.mainList$;
  }

}
