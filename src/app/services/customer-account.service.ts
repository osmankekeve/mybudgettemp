import { Injectable } from '@angular/core';
import {AngularFirestore, AngularFirestoreCollection, CollectionReference, Query} from '@angular/fire/firestore';
import { Observable } from 'rxjs/Observable';
import { CustomerModel } from '../models/customer-model';
import { map, flatMap } from 'rxjs/operators';
import { combineLatest } from 'rxjs';
import { AuthenticationService } from './authentication.service';
import { LogService } from './log.service';
import {SettingService} from './setting.service';
import {ProfileService} from './profile.service';
import { getCurrencyTypes} from '../core/correct-library';
import {CustomerService} from './customer.service';
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

  getAllItems(customerPrimaryKey: string): Observable<CustomerAccountModel[]> {
    this.listCollection = this.db.collection<CustomerAccountModel>(this.tableName,
      ref => {
        let query: CollectionReference | Query = ref;
        query = query.where('userPrimaryKey', '==', this.authService.getUid());
        if (customerPrimaryKey !== null && customerPrimaryKey !== '-1') {
          query = query.where('customerPrimaryKey', '==', customerPrimaryKey);
        }
        query = query.orderBy('name', 'asc');
        return query;
      });
    return this.listCollection.valueChanges({ idField : 'primaryKey'});
  }

  async addItem(record: CustomerAccountMainModel) {
    await this.logService.sendToLog(record, 'insert', 'customer-account');
    return await this.listCollection.add(Object.assign({}, record.data));
  }

  async removeItem(record: CustomerAccountMainModel) {
    await this.logService.sendToLog(record, 'delete', 'customer-account');
    return await this.db.collection(this.tableName).doc(record.data.primaryKey).delete();
  }

  async updateItem(record: CustomerAccountMainModel) {
    await this.logService.sendToLog(record, 'update', 'customer-account');
    return await this.db.collection(this.tableName).doc(record.data.primaryKey).update(Object.assign({}, record.data));
  }

  async setItem(record: CustomerAccountMainModel) {
    await this.logService.sendToLog(record, 'insert', 'customer-account');
    return await this.listCollection.doc(record.data.primaryKey).set(Object.assign({}, record.data));
  }

  checkForSave(record: CustomerAccountMainModel): Promise<string> {
    return new Promise((resolve, reject) => {
      if (record.data.customerPrimaryKey === '' || record.data.customerPrimaryKey === '-1') {
        reject('Lüfen müşteri seçiniz.');
      } else if (record.data.name === '') {
        reject('Lüfen hesap adı giriniz.');
      } else if (record.data.currencyCode === '' || record.data.currencyCode === '-1') {
        reject('Lütfen döviz seçiniz.');
      }  else {
        resolve(null);
      }
    });
  }

  checkForRemove(record: CustomerAccountMainModel): Promise<string> {
    return new Promise((resolve, reject) => {
      resolve(null);
    });
  }

  checkFields(model: CustomerAccountModel): CustomerAccountModel {
    const cleanModel = this.clearSubModel();
    if (model.customerPrimaryKey === undefined) { model.customerPrimaryKey = cleanModel.customerPrimaryKey; }
    if (model.name === undefined) { model.name = cleanModel.name; }
    if (model.currencyCode === undefined) { model.currencyCode = cleanModel.currencyCode; }
    if (model.description === undefined) { model.description = cleanModel.description; }
    return model;
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
      ref => ref.where('userPrimaryKey', '==', this.authService.getUid()).orderBy('name', 'asc'));
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
