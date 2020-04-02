import { Injectable } from '@angular/core';
import {AngularFirestore, AngularFirestoreCollection, CollectionReference, Query} from '@angular/fire/firestore';
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
import {currencyFormat, getStatus, isNullOrEmpty} from '../core/correct-library';
import {CustomerService} from './customer.service';
import {CustomerAccountService} from './customer-account.service';
import {AccountTransactionService} from './account-transaction.service';

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
              public logService: LogService, public eService: ProfileService, public db: AngularFirestore,
              public atService: AccountTransactionService) {
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
    return await this.listCollection.add(Object.assign({}, record.data))
      .then(async result => {
        await this.logService.sendToLog(record, 'insert', 'accountVoucher');
        await this.sService.increaseAccountVoucherNumber();
      });
  }

  async removeItem(record: AccountVoucherMainModel) {
    return await this.db.collection(this.tableName).doc(record.data.primaryKey).delete()
      .then(async result => {
        await this.logService.sendToLog(record, 'delete', 'accountVoucher');
        if (record.data.status === 'approved') {
          await this.atService.removeItem(null, record.data.primaryKey);
        }
      });
  }

  async updateItem(record: AccountVoucherMainModel) {
    return await this.db.collection(this.tableName).doc(record.data.primaryKey).update(Object.assign({}, record.data))
      .then(async value => {
        if (record.data.status === 'approved') {
          const trans = {
            primaryKey: record.data.primaryKey,
            userPrimaryKey: record.data.userPrimaryKey,
            receiptNo: record.data.receiptNo,
            transactionPrimaryKey: record.data.primaryKey,
            transactionType: 'accountVoucher',
            parentPrimaryKey: record.data.customerCode,
            parentType: 'customer',
            accountPrimaryKey: record.data.accountPrimaryKey,
            cashDeskPrimaryKey: record.data.cashDeskPrimaryKey,
            amount: record.data.type === 'creditVoucher' ? record.data.amount : record.data.amount * -1,
            amountType: record.data.type === 'creditVoucher' ? 'credit' : 'debit',
            insertDate: record.data.insertDate,
          };
          await this.atService.setItem(trans, trans.primaryKey);
          await this.logService.sendToLog(record, 'approved', 'accountVoucher');
        } else if (record.data.status === 'rejected') {
          await this.logService.sendToLog(record, 'rejected', 'accountVoucher');
        } else {
          await this.logService.sendToLog(record, 'update', 'accountVoucher');
        }
      });
  }

  async setItem(record: AccountVoucherMainModel, primaryKey: string) {
    return await this.listCollection.doc(primaryKey).set(Object.assign({}, record.data))
      .then(async value => {
        await this.logService.sendToLog(record.data, 'insert', 'accountVoucher');
        await this.sService.increaseAccountVoucherNumber();
        if (record.data.status === 'approved') {
          const trans = {
            primaryKey: record.data.primaryKey,
            userPrimaryKey: record.data.userPrimaryKey,
            receiptNo: record.data.receiptNo,
            transactionPrimaryKey: record.data.primaryKey,
            transactionType: 'accountVoucher',
            parentPrimaryKey: record.data.customerCode,
            parentType: 'customer',
            accountPrimaryKey: record.data.accountPrimaryKey,
            cashDeskPrimaryKey: record.data.cashDeskPrimaryKey,
            amount: record.data.type === 'creditVoucher' ? record.data.amount : record.data.amount * -1,
            amountType: record.data.type === 'creditVoucher' ? 'credit' : 'debit',
            insertDate: record.data.insertDate,
          };
          await this.atService.setItem(trans, trans.primaryKey);
          await this.logService.sendToLog(record, 'approved', 'accountVoucher');
        } else if (record.data.status === 'rejected') {
          await this.logService.sendToLog(record, 'rejected', 'accountVoucher');
        } else {
          // await this.logService.sendToLog(record, 'update', 'accountVoucher');
        }
      });
  }

  checkForSave(record: AccountVoucherMainModel): Promise<string> {
    return new Promise((resolve, reject) => {
      if (record.data.customerCode === '' || record.data.customerCode === '-1') {
        reject('Lütfen müşteri seçiniz.');
      } else if (record.data.accountPrimaryKey === '' || record.data.accountPrimaryKey === '-1') {
        reject('Lütfen hesap seçiniz.');
      } else if (record.data.type === '' || record.data.type === '-1') {
        reject('Lütfen fiş tipi seçiniz.');
      } else if (record.data.cashDeskPrimaryKey === '' || record.data.cashDeskPrimaryKey === '-1') {
        reject('Lütfen kasa seçiniz.');
      } else if (record.data.amount <= 0) {
        reject('Tutar sıfırdan büyük olmalıdır.');
      } else if (isNullOrEmpty(record.data.insertDate)) {
        reject('Lütfen kayıt tarihi seçiniz.');
      } else {
        resolve(null);
      }
    });
  }

  checkForRemove(record: AccountVoucherMainModel): Promise<string> {
    return new Promise((resolve, reject) => {
      resolve(null);
    });
  }

  checkFields(model: AccountVoucherModel): AccountVoucherModel {
    const cleanModel = this.clearSubModel();
    if (model.employeePrimaryKey === undefined) { model.employeePrimaryKey = '-1'; }
    if (model.customerCode === undefined) { model.customerCode = cleanModel.customerCode; }
    if (model.accountPrimaryKey === undefined) { model.accountPrimaryKey = cleanModel.accountPrimaryKey; }
    if (model.type === undefined) { model.type = cleanModel.type; }
    if (model.receiptNo === undefined) { model.receiptNo = cleanModel.receiptNo; }
    if (model.description === undefined) { model.description = cleanModel.description; }
    if (model.amount === undefined) { model.amount = cleanModel.amount; }
    if (model.status === undefined) { model.status = cleanModel.status; }
    if (model.platform === undefined) { model.platform = cleanModel.platform; }
    return model;
  }

  clearSubModel(): AccountVoucherModel {

    const returnData = new AccountVoucherModel();
    returnData.primaryKey = null;
    returnData.userPrimaryKey = this.authService.getUid();
    returnData.employeePrimaryKey = this.authService.getEid();
    returnData.customerCode = '-1';
    returnData.accountPrimaryKey = '-1';
    returnData.type = '-1';
    returnData.receiptNo = '';
    returnData.description = '';
    returnData.amount = 0;
    returnData.status = 'waitingForApprove'; // waitingForApprove, approved, rejected
    returnData.platform = 'web'; // mobile, web
    returnData.insertDate = Date.now();

    return returnData;
  }

  clearMainModel(): AccountVoucherMainModel {
    const returnData = new AccountVoucherMainModel();
    returnData.data = this.clearSubModel();
    returnData.customerName = '';
    returnData.employeeName = this.employeeMap.get(returnData.data.employeePrimaryKey);
    returnData.actionType = 'added';
    returnData.statusTr = getStatus().get(returnData.data.status);
    returnData.platformTr = returnData.data.platform === 'web' ? 'Web' : 'Mobil';
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
          returnData.data = this.checkFields(data);
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
          returnData.data = this.checkFields(data);
          returnData.actionType = c.type;
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
        returnData.data = this.checkFields(data);
        returnData.actionType = change.type;
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
        returnData.data = this.checkFields(data);
        returnData.actionType = change.type;
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
      this.db.collection(this.tableName, ref => {
        let query: CollectionReference | Query = ref;
        query = query.orderBy('insertDate').where('userPrimaryKey', '==', this.authService.getUid());
        if (startDate !== null) {
          query = query.startAt(startDate.getTime());
        }
        if (endDate !== null) {
          query = query.endAt(endDate.getTime());
        }
        return query;
      })
        .get().subscribe(snapshot => {
        snapshot.forEach(doc => {
          const data = doc.data() as AccountVoucherModel;
          data.primaryKey = doc.id;

          const returnData = new AccountVoucherMainModel();
          returnData.data = this.checkFields(data);
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
