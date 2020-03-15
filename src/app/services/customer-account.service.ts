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
import {currencyFormat, getCurrencyTypes} from '../core/correct-library';
import {CustomerService} from './customer.service';
import {PaymentMainModel} from '../models/payment-main-model';
import {PaymentModel} from '../models/payment-model';
import {CustomerAccountModel} from '../models/customer-account-model';
import {CustomerAccountMainModel} from '../models/customer-main-account-model';

@Injectable({
  providedIn: 'root'
})
export class CustomerAccountService {
  listCollection: AngularFirestoreCollection<CustomerAccountModel>;
  mainList$: Observable<CustomerAccountMainModel[]>;
  customerMap = new Map();
  tableName = 'tblAccounts';

  constructor(public authService: AuthenticationService, public sService: SettingService, public cusService: CustomerService,
              public logService: LogService, public eService: ProfileService, public db: AngularFirestore) {

    if (this.authService.isUserLoggedIn()) {
      this.cusService.getAllItems().subscribe(list => {
        this.customerMap.clear();
        list.forEach(item => {
          this.customerMap.set(item.primaryKey, item);
        });
      });
    }
  }

  async addItem(record: CustomerAccountMainModel) {
    await this.logService.sendToLog(record, 'insert', 'collection');
    return await this.listCollection.add(Object.assign({}, record.data));
  }

  async removeItem(record: CustomerAccountMainModel) {
    await this.logService.sendToLog(record, 'delete', 'collection');
    return await this.db.collection(this.tableName).doc(record.data.primaryKey).delete();
  }

  async updateItem(record: CustomerAccountMainModel) {
    await this.logService.sendToLog(record, 'update', 'collection');
    return await this.db.collection(this.tableName).doc(record.data.primaryKey).update(Object.assign({}, record.data));
  }

  async setItem(record: CustomerAccountMainModel, primaryKey: string) {
    await this.logService.sendToLog(record, 'insert', 'collection');
    return await this.listCollection.doc(primaryKey).set(Object.assign({}, record.data));
  }

  clearSubModel(): CustomerAccountModel {

    const returnData = new CustomerAccountModel();
    returnData.primaryKey = null;
    returnData.customerPrimaryKey = '-1';
    returnData.userPrimaryKey = this.authService.getUid();
    returnData.name = '';
    returnData.currencyCode = 'lira';
    returnData.description = '';
    returnData.insertDate = Date.now();

    return returnData;
  }

  clearMainModel(): CustomerAccountMainModel {
    const returnData = new CustomerAccountMainModel();
    returnData.data = this.clearSubModel();
    returnData.customer = null;
    returnData.actionType = 'added';
    returnData.currencyTr = getCurrencyTypes().get(returnData.data.currencyCode);
    return returnData;
  }

  checkFields(model: CustomerAccountModel): CustomerAccountModel {
    const cleanModel = this.clearSubModel();
    if (model.customerPrimaryKey === undefined) { model.customerPrimaryKey = cleanModel.customerPrimaryKey; }
    if (model.name === undefined) { model.name = cleanModel.name; }
    if (model.currencyCode === undefined) { model.currencyCode = cleanModel.currencyCode; }
    if (model.description === undefined) { model.description = cleanModel.description; }
    return model;
  }

  getItem(primaryKey: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.collection(this.tableName).doc(primaryKey).get().toPromise().then(doc => {
        if (doc.exists) {
          const data = doc.data() as CustomerAccountModel;
          data.primaryKey = doc.id;

          const returnData = new CustomerAccountMainModel();
          returnData.data = this.checkFields(data);
          returnData.data = data;
          returnData.customer = this.customerMap.get(returnData.data.customerPrimaryKey);
          returnData.currencyTr = getCurrencyTypes().get(returnData.data.currencyCode);

          resolve(Object.assign({returnData}));
        } else {
          resolve(null);
        }
      });
    });
  }

  getMainItems(): Observable<CustomerAccountMainModel[]> {
    this.listCollection = this.db.collection(this.tableName,
      ref => ref.where('userPrimaryKey', '==', this.authService.getUid()));
    this.mainList$ = this.listCollection.stateChanges().pipe(map(changes  => {
      return changes.map( change => {
        const data = change.payload.doc.data() as CustomerAccountModel;
        data.primaryKey = change.payload.doc.id;

        const returnData = new CustomerAccountMainModel();
        returnData.data = this.checkFields(data);
        returnData.actionType = change.type;
        returnData.data = data;
        returnData.customer = this.customerMap.get(returnData.data.customerPrimaryKey);
        returnData.currencyTr = getCurrencyTypes().get(returnData.data.currencyCode);

        return this.db.collection('tblCustomer').doc(data.customerPrimaryKey).valueChanges()
          .pipe(map( (customer: CustomerModel) => {
            returnData.customer = customer !== undefined ? customer : undefined;
            return Object.assign({returnData}); }));
      });
    }), flatMap(feeds => combineLatest(feeds)));
    return this.mainList$;
  }

}
