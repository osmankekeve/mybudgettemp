import { Injectable } from '@angular/core';
import {AngularFirestore, AngularFirestoreCollection, CollectionReference, Query} from '@angular/fire/firestore';
import { Observable } from 'rxjs/Observable';
import { CustomerModel } from '../models/customer-model';
import { map, mergeMap } from 'rxjs/operators';
import { combineLatest } from 'rxjs';
import { AuthenticationService } from './authentication.service';
import { AccountVoucherModel } from '../models/account-voucher-model';
import { LogService } from './log.service';
import {SettingService} from './setting.service';
import {ProfileService} from './profile.service';
import {AccountVoucherMainModel} from '../models/account-voucher-main-model';
import {currencyFormat, getAccountVoucherType, getStatus, isNullOrEmpty} from '../core/correct-library';
import {CustomerService} from './customer.service';
import {AccountTransactionService} from './account-transaction.service';
import {ActionService} from './action.service';

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
              public atService: AccountTransactionService, protected actService: ActionService) {
    this.listCollection = this.db.collection(this.tableName);
    if (this.authService.isUserLoggedIn()) {
      this.eService.getItems().toPromise().then(list => {
        this.employeeMap.clear();
        this.employeeMap.set('-1', 'Tüm Kullanıcılar');
        list.forEach(item => {
          this.employeeMap.set(item.primaryKey, item.longName);
        });
      });
      this.cusService.getAllItems().toPromise().then(list => {
        this.customerMap.clear();
        list.forEach(item => {
          this.customerMap.set(item.primaryKey, this.cusService.convertMainModel(item));
        });
      });
    }
  }

  async addItem(record: AccountVoucherMainModel) {
    return await this.listCollection.add(Object.assign({}, record.data))
      .then(async result => {
        await this.logService.addTransactionLog(record, 'insert', 'accountVoucher');
        await this.sService.increaseAccountVoucherNumber();
      });
  }

  async removeItem(record: AccountVoucherMainModel) {
    return await this.db.collection(this.tableName).doc(record.data.primaryKey).delete()
      .then(async result => {
        this.actService.removeActions(this.tableName, record.data.primaryKey);
        await this.logService.addTransactionLog(record, 'delete', 'accountVoucher');
        if (record.data.status === 'approved') {
          await this.atService.removeItem(null, record.data.primaryKey);
        }
      });
  }

  async updateItem(record: AccountVoucherMainModel) {
    return await this.db.collection(this.tableName).doc(record.data.primaryKey).update(Object.assign({}, record.data))
      .then(async value => {
        if (record.data.status === 'approved') {
          const trans = this.atService.clearSubModel();
          trans.primaryKey = record.data.primaryKey;
          trans.receiptNo = record.data.receiptNo;
          trans.transactionPrimaryKey = record.data.primaryKey;
          trans.transactionType = 'accountVoucher';
          trans.transactionSubType = 'accountVoucher';
          trans.parentPrimaryKey = record.data.customerCode;
          trans.parentType = 'customer';
          trans.accountPrimaryKey = record.data.accountPrimaryKey;
          trans.cashDeskPrimaryKey = '-1';
          trans.amount = record.data.type === 'creditVoucher' ? record.data.amount : record.data.amount * -1;
          trans.amountType = record.data.type === 'creditVoucher' ? 'credit' : 'debit';
          trans.insertDate = record.data.insertDate;
          await this.atService.setItem(trans, trans.primaryKey);
          await this.logService.addTransactionLog(record, 'approved', 'accountVoucher');
        } else if (record.data.status === 'rejected') {
          await this.logService.addTransactionLog(record, 'rejected', 'accountVoucher');
        } else {
          await this.logService.addTransactionLog(record, 'update', 'accountVoucher');
        }
      });
  }

  async setItem(record: AccountVoucherMainModel, primaryKey: string) {
    return await this.listCollection.doc(primaryKey).set(Object.assign({}, record.data))
      .then(async value => {
        await this.logService.addTransactionLog(record, 'insert', 'accountVoucher');
        await this.sService.increaseAccountVoucherNumber();
        if (record.data.status === 'approved') {
          const trans = this.atService.clearSubModel();
          trans.primaryKey = record.data.primaryKey;
          trans.receiptNo = record.data.receiptNo;
          trans.transactionPrimaryKey = record.data.primaryKey;
          trans.transactionType = 'accountVoucher';
          trans.transactionSubType = 'accountVoucher';
          trans.parentPrimaryKey = record.data.customerCode;
          trans.parentType = 'customer';
          trans.accountPrimaryKey = record.data.accountPrimaryKey;
          trans.cashDeskPrimaryKey = '-1';
          trans.amount = record.data.type === 'creditVoucher' ? record.data.amount : record.data.amount * -1;
          trans.amountType = record.data.type === 'creditVoucher' ? 'credit' : 'debit';
          trans.insertDate = record.data.insertDate;
          await this.atService.setItem(trans, trans.primaryKey);
          await this.logService.addTransactionLog(record, 'approved', 'accountVoucher');
        } else if (record.data.status === 'rejected') {
          await this.logService.addTransactionLog(record, 'rejected', 'accountVoucher');
        } else {
          // await this.logService.addTransactionLog(record, 'update', 'accountVoucher');
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
    if (model.approveByPrimaryKey === undefined) { model.approveByPrimaryKey = model.employeePrimaryKey; }
    if (model.approveDate === undefined) { model.approveDate = model.insertDate; }
    if (model.recordDate === undefined) { model.recordDate = model.insertDate; }
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
    returnData.approveByPrimaryKey = '-1';
    returnData.approveDate = 0;
    returnData.platform = 'web'; // mobile, web
    returnData.insertDate = Date.now();
    returnData.recordDate = Date.now();

    return returnData;
  }

  clearMainModel(): AccountVoucherMainModel {
    const returnData = new AccountVoucherMainModel();
    returnData.data = this.clearSubModel();
    returnData.customer = this.cusService.clearMainModel();
    returnData.employeeName = this.employeeMap.get(returnData.data.employeePrimaryKey);
    returnData.actionType = 'added';
    returnData.statusTr = getStatus().get(returnData.data.status);
    returnData.typeTr = getAccountVoucherType().get(returnData.data.type);
    returnData.platformTr = returnData.data.platform === 'web' ? 'Web' : 'Mobil';
    returnData.amountFormatted = currencyFormat(returnData.data.amount);
    returnData.approverName = '';
    return returnData;
  }

  getItem(primaryKey: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.collection(this.tableName).doc(primaryKey).get().toPromise().then(async doc => {
        if (doc.exists) {
          const data = doc.data() as AccountVoucherModel;
          data.primaryKey = doc.id;

          const returnData = new AccountVoucherMainModel();
          returnData.data = this.checkFields(data);
          returnData.amountFormatted = currencyFormat(returnData.data.amount);
          returnData.statusTr = getStatus().get(returnData.data.status);
          returnData.typeTr = getAccountVoucherType().get(returnData.data.type);

          const d1 = await this.cusService.getItem(returnData.data.customerCode);
          returnData.customer = this.cusService.convertMainModel(d1.data);

          const d2 = await this.eService.getItem(returnData.data.approveByPrimaryKey, false);
          returnData.approverName = d2 != null ? d2.returnData.data.longName : '';

          const d3 = await this.eService.getItem(returnData.data.employeePrimaryKey, false);
          returnData.employeeName = d3 != null ? d3.returnData.data.longName : '';

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
          returnData.approverName = this.employeeMap.get(returnData.data.approveByPrimaryKey);
          returnData.statusTr = getStatus().get(returnData.data.status);
          returnData.typeTr = getAccountVoucherType().get(returnData.data.type);
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
        returnData.approverName = this.employeeMap.get(returnData.data.approveByPrimaryKey);
        returnData.statusTr = getStatus().get(returnData.data.status);
        returnData.typeTr = getAccountVoucherType().get(returnData.data.type);

        return this.db.collection('tblCustomer').doc(data.customerCode).valueChanges()
        .pipe(map( (customer: CustomerModel) => {
          returnData.customer = customer !== undefined ? this.cusService.convertMainModel(customer) : undefined;
          return Object.assign({returnData}); }));
      });
    }), mergeMap(feeds => combineLatest(feeds)));
    return this.mainList$;
  }

  getMainItemsBetweenDates(startDate: Date, endDate: Date, status: string): Observable<AccountVoucherMainModel[]> {
    this.listCollection = this.db.collection(this.tableName,
    ref => {
      let query: CollectionReference | Query = ref;
      query = query.orderBy('insertDate').where('userPrimaryKey', '==', this.authService.getUid());
      if (startDate !== null) { query = query.startAt(startDate.getTime()); }
      if (endDate !== null) { query = query.endAt(endDate.getTime()); }
      if (status !== null && status !== '-1') { query = query.where('status', '==', status); }
      return query;
    }
    );
    this.mainList$ = this.listCollection.stateChanges().pipe(map(changes  => {
      return changes.map( change => {
        const data = change.payload.doc.data() as AccountVoucherModel;
        data.primaryKey = change.payload.doc.id;

        const returnData = new AccountVoucherMainModel();
        returnData.data = this.checkFields(data);
        returnData.actionType = change.type;
        returnData.employeeName = this.employeeMap.get(returnData.data.employeePrimaryKey);
        returnData.amountFormatted = currencyFormat(returnData.data.amount);
        returnData.approverName = this.employeeMap.get(returnData.data.approveByPrimaryKey);
        returnData.statusTr = getStatus().get(returnData.data.status);
        returnData.typeTr = getAccountVoucherType().get(returnData.data.type);

        return this.db.collection('tblCustomer').doc(data.customerCode).valueChanges()
        .pipe(map( (customer: CustomerModel) => {
          returnData.customer = customer !== undefined ? this.cusService.convertMainModel(customer) : undefined;
          return Object.assign({returnData}); }));
      });
    }), mergeMap(feeds => combineLatest(feeds)));
    return this.mainList$;
  }

  getMainItemsBetweenDatesAsPromise = async (startDate: Date, endDate: Date, status: string):
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
        if (status !== null && status !== '-1' && status !== '-2') {
          query = query.where('status', '==', status);
        }
        return query;
      })
        .get().toPromise().then(snapshot => {
        snapshot.forEach(doc => {
          const data = doc.data() as AccountVoucherModel;
          data.primaryKey = doc.id;

          const returnData = new AccountVoucherMainModel();
          returnData.data = this.checkFields(data);
          returnData.actionType = 'added';
          returnData.customer = this.customerMap.get(returnData.data.customerCode);
          returnData.employeeName = this.employeeMap.get(returnData.data.employeePrimaryKey);
          returnData.approverName = this.employeeMap.get(returnData.data.approveByPrimaryKey);
          returnData.statusTr = getStatus().get(returnData.data.status);
          returnData.typeTr = getAccountVoucherType().get(returnData.data.type);

          list.push(returnData);
        });
        resolve(list);
      });

    } catch (error) {
      console.error(error);
      reject({message: 'Error: ' + error});
    }
  })
}
