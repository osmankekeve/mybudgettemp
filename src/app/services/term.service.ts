import { TermModel } from './../models/term-model';
import {Injectable} from '@angular/core';
import {AngularFirestore, AngularFirestoreCollection, CollectionReference, Query} from '@angular/fire/firestore';
import {Observable} from 'rxjs/Observable';
import {CustomerModel} from '../models/customer-model';
import {map, mergeMap} from 'rxjs/operators';
import {combineLatest} from 'rxjs';
import {PaymentModel} from '../models/payment-model';
import {AuthenticationService} from './authentication.service';
import {LogService} from './log.service';
import {SettingService} from './setting.service';
import {PaymentMainModel} from '../models/payment-main-model';
import {ProfileService} from './profile.service';
import {currencyFormat, getPaymentTypes, getStatus, getString, isNullOrEmpty} from '../core/correct-library';
import {CustomerService} from './customer.service';
import {AccountTransactionService} from './account-transaction.service';
import {ActionService} from './action.service';

@Injectable({
  providedIn: 'root'
})
export class TermService {
  listCollection: AngularFirestoreCollection<TermModel>;
  mainList$: Observable<TermModel[]>;
  tableName = 'tblTerm';

  constructor(public authService: AuthenticationService, public sService: SettingService, public cusService: CustomerService,
              public logService: LogService, public eService: ProfileService, public db: AngularFirestore,
              public atService: AccountTransactionService, protected actService: ActionService) { }

  async addItem(record: TermModel) {
    return await this.listCollection.add(Object.assign({}, record));
  }

  async removeItem(record: TermModel) {
    return await this.db.collection(this.tableName).doc(record.primaryKey).delete();
  }

  async updateItem(record: TermModel) {
    return await this.db.collection(this.tableName).doc(record.primaryKey).update(Object.assign({}, record));
  }

  async setItem(record: TermModel, primaryKey: string) {
    return await this.listCollection.doc(primaryKey).set(Object.assign({}, record));
  }

  checkForSave(record: TermModel): Promise<string> {
    return new Promise((resolve, reject) => {
      resolve(null);
    });
  }

  checkForRemove(record: TermModel): Promise<string> {
    return new Promise((resolve, reject) => {
      resolve(null);
    });
  }

  checkFields(model: TermModel): TermModel {
    const cleanModel = this.clearSubModel();

    return model;
  }

  clearSubModel(): TermModel {
    const returnData = new TermModel();
    returnData.primaryKey = null;
    returnData.invoicePrimaryKey = '-1';
    returnData.termAmount = 0;
    returnData.dayCount = 0;
    returnData.termDate = Date.now();
    returnData.insertDate = Date.now();

    return returnData;
  }

  getItem(primaryKey: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.collection(this.tableName).doc(primaryKey).get().toPromise().then(async doc => {
        if (doc.exists) {
          const data = doc.data() as TermModel;
          data.primaryKey = doc.id;

          resolve(Object.assign({data}));
        } else {
          resolve(null);
        }
      });
    });
  }
}
