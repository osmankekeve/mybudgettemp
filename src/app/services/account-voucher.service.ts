import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { Observable } from 'rxjs/Observable';
import { CustomerModel } from '../models/customer-model';
import { map, flatMap } from 'rxjs/operators';
import { combineLatest } from 'rxjs';
import { AuthenticationService } from './authentication.service';
import { AccountVoucherModel } from '../models/account-voucher-model';
import { LogService } from './log.service';
import {SettingService} from './setting.service';
import {ProfileService} from './profile.service';
import {AccountVoucherMainModel} from '../models/account-voucher-main-model';
import {currencyFormat} from '../core/correct-library';
import {CollectionMainModel} from '../models/collection-main-model';
import {CollectionModel} from '../models/collection-model';
import {CustomerService} from './customer.service';

@Injectable({
  providedIn: 'root'
})
export class AccountVoucherService {
  listCollection: AngularFirestoreCollection<AccountVoucherModel>;
  mainList$: Observable<AccountVoucherMainModel[]>;
  customerList$: Observable<CustomerModel[]>;
  employeeMap = new Map();
  customerMap = new Map();
  tableName = 'tblAccountVoucher';

  constructor(public authService: AuthenticationService, public sService: SettingService, public cusService: CustomerService,
              public logService: LogService, public eService: ProfileService, public db: AngularFirestore) {
    if (this.authService.isUserLoggedIn()) {
      this.eService.getItems().subscribe(list => {
        this.employeeMap.clear();
        this.employeeMap.set('-1', 'Tüm Kullanıcılar');
        list.forEach(item => {
          this.employeeMap.set(item.primaryKey, item.longName);
        });
      });
      this.cusService.getAllItems().subscribe(list => {
        this.customerMap.clear();
        list.forEach(item => {
          this.customerMap.set(item.primaryKey, item);
        });
      });
    }
  }

  async addItem(record: AccountVoucherMainModel) {
    await this.logService.sendToLog(record.data, 'insert', 'accountVoucher');
    await this.sService.increaseAccountVoucherNumber();
    return await this.listCollection.add(Object.assign({}, record.data));
  }

  async removeItem(record: AccountVoucherMainModel) {
    await this.logService.sendToLog(record.data, 'delete', 'accountVoucher');
    return await this.db.collection(this.tableName).doc(record.data.primaryKey).delete();
  }

  async updateItem(record: AccountVoucherMainModel) {
    await this.logService.sendToLog(record.data, 'update', 'accountVoucher');
    return await this.db.collection(this.tableName).doc(record.data.primaryKey).update(Object.assign({}, record.data));
  }

  async setItem(record: AccountVoucherMainModel, primaryKey: string) {
    await this.logService.sendToLog(record.data, 'insert', 'accountVoucher');
    await this.sService.increaseAccountVoucherNumber();
    return await this.listCollection.doc(primaryKey).set(Object.assign({}, record.data));
  }

  clearSubModel(): AccountVoucherModel {

    const returnData = new AccountVoucherModel();
    returnData.primaryKey = null;
    returnData.customerCode = '-1';
    returnData.receiptNo = '';
    returnData.type = '-1';
    returnData.userPrimaryKey = this.authService.getUid();
    returnData.employeePrimaryKey = this.authService.getEid();
    returnData.description = '';
    returnData.amount = 0;
    returnData.insertDate = Date.now();

    return returnData;
  }

  clearMainModel(): AccountVoucherMainModel {
    const returnData = new AccountVoucherMainModel();
    returnData.data = this.clearSubModel();
    returnData.customerName = '';
    returnData.employeeName = this.employeeMap.get(returnData.data.employeePrimaryKey);
    returnData.actionType = 'added';
    returnData.amountFormatted = currencyFormat(returnData.data.amount);
    return returnData;
  }

  getItem(primaryKey: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.collection(this.tableName).doc(primaryKey).get().toPromise().then(doc => {
        if (doc.exists) {
          const data = doc.data() as AccountVoucherModel;
          data.primaryKey = doc.id;
          const returnData = new AccountVoucherMainModel();
          returnData.data = data;
          returnData.employeeName = this.employeeMap.get(returnData.data.employeePrimaryKey);
          returnData.amountFormatted = currencyFormat(returnData.data.amount);
          resolve(Object.assign({returnData}));
        } else {
          resolve(null);
        }
      });
    });
  }

  getCustomerItems(customerCode: string): Observable<AccountVoucherMainModel[]> {
    this.listCollection = this.db.collection(this.tableName,
      ref => ref.where('customerCode', '==', customerCode));
    this.mainList$ = this.listCollection.stateChanges().pipe(
      map(changes =>
        changes.map(c => {
          const data = c.payload.doc.data() as AccountVoucherModel;
          data.primaryKey = c.payload.doc.id;
          const returnData = new AccountVoucherMainModel();
          returnData.actionType = c.type;
          returnData.data = data;
          returnData.employeeName = this.employeeMap.get(returnData.data.employeePrimaryKey);
          returnData.amountFormatted = currencyFormat(returnData.data.amount);
          return Object.assign({returnData});
        })
      )
    );
    return this.mainList$;
  }

  getMainItems(): Observable<AccountVoucherMainModel[]> {
    this.listCollection = this.db.collection(this.tableName,
    ref => ref.orderBy('insertDate').where('userPrimaryKey', '==', this.authService.getUid()));
    this.mainList$ = this.listCollection.stateChanges().pipe(map(changes  => {
      return changes.map( change => {
        const data = change.payload.doc.data() as AccountVoucherModel;
        data.primaryKey = change.payload.doc.id;

        const returnData = new AccountVoucherMainModel();
        returnData.actionType = change.type;
        returnData.data = data;
        returnData.employeeName = this.employeeMap.get(returnData.data.employeePrimaryKey);
        returnData.amountFormatted = currencyFormat(returnData.data.amount);

        return this.db.collection('tblCustomer').doc(data.customerCode).valueChanges()
        .pipe(map( (customer: CustomerModel) => {
          returnData.customer = customer !== undefined ? customer : undefined;
          returnData.customerName = customer !== undefined ? customer.name : 'Belirlenemeyen Müşteri Kaydı';
          return Object.assign({returnData}); }));
      });
    }), flatMap(feeds => combineLatest(feeds)));
    return this.mainList$;
  }

  getMainItemsBetweenDates(startDate: Date, endDate: Date): Observable<AccountVoucherMainModel[]> {
    this.listCollection = this.db.collection(this.tableName,
    ref => ref.orderBy('insertDate').startAt(startDate.getTime()).endAt(endDate.getTime())
    .where('userPrimaryKey', '==', this.authService.getUid()));
    this.mainList$ = this.listCollection.stateChanges().pipe(map(changes  => {
      return changes.map( change => {
        const data = change.payload.doc.data() as AccountVoucherModel;
        data.primaryKey = change.payload.doc.id;

        const returnData = new AccountVoucherMainModel();
        returnData.actionType = change.type;
        returnData.data = data;
        returnData.employeeName = this.employeeMap.get(returnData.data.employeePrimaryKey);
        returnData.amountFormatted = currencyFormat(returnData.data.amount);

        return this.db.collection('tblCustomer').doc(data.customerCode).valueChanges()
        .pipe(map( (customer: CustomerModel) => {
          returnData.customer = customer !== undefined ? customer : undefined;
          returnData.customerName = customer !== undefined ? customer.name : 'Belirlenemeyen Müşteri Kayıt';
          return Object.assign({returnData}); }));
      });
    }), flatMap(feeds => combineLatest(feeds)));
    return this.mainList$;
  }

  getMainItemsBetweenDatesAsPromise = async (startDate: Date, endDate: Date):
    Promise<Array<AccountVoucherMainModel>> => new Promise(async (resolve, reject): Promise<void> => {
    try {
      const list = Array<AccountVoucherMainModel>();
      this.db.collection(this.tableName, ref =>
        ref.orderBy('insertDate').startAt(startDate.getTime()).endAt(endDate.getTime()))
        .get().subscribe(snapshot => {
        snapshot.forEach(doc => {
          const data = doc.data() as AccountVoucherModel;
          data.primaryKey = doc.id;

          const returnData = new AccountVoucherMainModel();
          returnData.data = data;
          returnData.actionType = 'added';
          returnData.customer = this.customerMap.get(returnData.data.customerCode);

          list.push(returnData);
        });
        resolve(list);
      });

    } catch (error) {
      console.error(error);
      reject({code: 401, message: 'You do not have permission or there is a problem about permissions!'});
    }
  })
}
