import {Injectable} from '@angular/core';
import {AngularFirestore, AngularFirestoreCollection, CollectionReference, Query} from '@angular/fire/firestore';
import {Observable} from 'rxjs/Observable';
import {CustomerModel} from '../models/customer-model';
import {map, flatMap} from 'rxjs/operators';
import {combineLatest} from 'rxjs';
import {PaymentModel} from '../models/payment-model';
import {AuthenticationService} from './authentication.service';
import {LogService} from './log.service';
import {SettingService} from './setting.service';
import {PaymentMainModel} from '../models/payment-main-model';
import {ProfileService} from './profile.service';
import {currencyFormat, getStatus, getString, isNullOrEmpty} from '../core/correct-library';
import {CustomerService} from './customer.service';
import {AccountTransactionService} from './account-transaction.service';
import {ActionService} from './action.service';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  listCollection: AngularFirestoreCollection<PaymentModel>;
  mainList$: Observable<PaymentMainModel[]>;
  customerList$: Observable<CustomerModel[]>;
  employeeMap = new Map();
  customerMap = new Map();
  tableName = 'tblPayment';

  constructor(public authService: AuthenticationService, public sService: SettingService, public cusService: CustomerService,
              public logService: LogService, public eService: ProfileService, public db: AngularFirestore,
              public atService: AccountTransactionService, protected actService: ActionService) {
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
          this.customerMap.set(item.primaryKey, this.cusService.convertMainModel(item));
        });
      });
    }
  }

  async addItem(record: PaymentMainModel) {
    return await this.listCollection.add(Object.assign({}, record.data))
      .then(async result => {
        await this.logService.addTransactionLog(record, 'insert', 'payment');
        await this.sService.increasePaymentNumber();
      });
  }

  async removeItem(record: PaymentMainModel) {
    return await this.db.collection(this.tableName).doc(record.data.primaryKey).delete()
      .then(async result => {
        this.actService.removeActions(this.tableName, record.data.primaryKey);
        await this.logService.addTransactionLog(record, 'delete', 'payment');
        if (record.data.status === 'approved') {
          await this.atService.removeItem(null, record.data.primaryKey);
        }
      });
  }

  async updateItem(record: PaymentMainModel) {
    return await this.db.collection(this.tableName).doc(record.data.primaryKey).update(Object.assign({}, record.data))
      .then(async () => {
        if (record.data.status === 'approved') {
          const trans = this.atService.clearSubModel();
          trans.primaryKey = record.data.primaryKey;
          trans.receiptNo = record.data.receiptNo;
          trans.transactionPrimaryKey = record.data.primaryKey;
          trans.transactionType = 'payment';
          trans.transactionSubType = 'payment';
          trans.parentPrimaryKey = record.data.customerCode;
          trans.parentType = 'customer';
          trans.accountPrimaryKey = record.data.accountPrimaryKey;
          trans.cashDeskPrimaryKey = record.data.cashDeskPrimaryKey;
          trans.amount = record.data.amount * -1;
          trans.amountType = 'debit';
          trans.insertDate = record.data.insertDate;

          await this.atService.setItem(trans, trans.primaryKey);
          await this.logService.addTransactionLog(record, 'approved', 'payment');
        }
        else if (record.data.status === 'rejected') {
          await this.logService.addTransactionLog(record, 'rejected', 'payment');
        }
        else if (record.data.status === 'canceled') {
          const trans = this.atService.clearSubModel();
          trans.primaryKey = this.getCancelRecordPrimaryKey(record.data);
          trans.receiptNo = record.data.receiptNo;
          trans.transactionPrimaryKey = record.data.primaryKey;
          trans.transactionType = 'payment';
          trans.transactionSubType = 'cancelPayment';
          trans.parentPrimaryKey = record.data.customerCode;
          trans.parentType = 'customer';
          trans.accountPrimaryKey = record.data.accountPrimaryKey;
          trans.cashDeskPrimaryKey = record.data.cashDeskPrimaryKey;
          trans.amount = record.data.amount;
          trans.amountType = 'credit';
          trans.insertDate = record.data.insertDate;

          await this.atService.setItem(trans, trans.primaryKey);
          await this.logService.addTransactionLog(record, 'canceled', 'payment');
          this.actService.addAction(this.tableName, record.data.primaryKey, 1, 'Kayıt İptal');
        }
        else {
          await this.logService.addTransactionLog(record, 'update', 'payment');
        }
      });
  }

  async setItem(record: PaymentMainModel, primaryKey: string) {
    return await this.listCollection.doc(primaryKey).set(Object.assign({}, record.data))
      .then(async () => {
        await this.logService.addTransactionLog(record, 'insert', 'payment');
        await this.sService.increasePaymentNumber();
        if (record.data.status === 'approved') {
          const trans = this.atService.clearSubModel();
          trans.primaryKey = record.data.primaryKey;
          trans.receiptNo = record.data.receiptNo;
          trans.transactionPrimaryKey = record.data.primaryKey;
          trans.transactionType = 'payment';
          trans.transactionSubType = 'payment';
          trans.parentPrimaryKey = record.data.customerCode;
          trans.parentType = 'customer';
          trans.accountPrimaryKey = record.data.accountPrimaryKey;
          trans.cashDeskPrimaryKey = record.data.cashDeskPrimaryKey;
          trans.amount = record.data.amount * -1;
          trans.amountType = 'debit';
          trans.insertDate = record.data.insertDate;
          await this.atService.setItem(trans, trans.primaryKey);
          await this.logService.addTransactionLog(record, 'approved', 'payment');
        }
        else if (record.data.status === 'rejected') {
          await this.logService.addTransactionLog(record, 'rejected', 'payment');
        }
        else if (record.data.status === 'canceled') {
          const trans = this.atService.clearSubModel();
          trans.primaryKey = this.getCancelRecordPrimaryKey(record.data);
          trans.receiptNo = record.data.receiptNo;
          trans.transactionPrimaryKey = record.data.primaryKey;
          trans.transactionType = 'payment';
          trans.transactionSubType = 'cancelPayment';
          trans.parentPrimaryKey = record.data.customerCode;
          trans.parentType = 'customer';
          trans.accountPrimaryKey = record.data.accountPrimaryKey;
          trans.cashDeskPrimaryKey = record.data.cashDeskPrimaryKey;
          trans.amount = record.data.amount;
          trans.amountType = 'credit';
          trans.insertDate = record.data.insertDate;

          await this.atService.setItem(trans, trans.primaryKey);
          await this.logService.addTransactionLog(record, 'canceled', 'payment');
          this.actService.addAction(this.tableName, record.data.primaryKey, 1, 'Kayıt İptal');
        }
        else {
          // await this.logService.addTransactionLog(record, 'update', 'payment');
        }
      });
  }

  checkForSave(record: PaymentMainModel): Promise<string> {
    return new Promise((resolve, reject) => {
      if (record.data.customerCode === '' || record.data.customerCode === '-1') {
        reject('Lütfen müşteri seçiniz.');
      } else if (record.data.accountPrimaryKey === '' || record.data.accountPrimaryKey === '-1') {
        reject('Lütfen hesap seçiniz.');
      } else if (record.data.type === '' || record.data.type === '-1') {
        reject('Lütfen ödeme tipi seçiniz.');
      } else if (record.data.receiptNo === '') {
        reject('Lütfen fiş numarası seçiniz.');
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

  checkForRemove(record: PaymentMainModel): Promise<string> {
    return new Promise((resolve, reject) => {
      resolve(null);
    });
  }

  checkFields(model: PaymentModel): PaymentModel {
    const cleanModel = this.clearSubModel();
    if (model.employeePrimaryKey === undefined) {
      model.employeePrimaryKey = '-1';
    }
    if (model.customerCode === undefined) {
      model.customerCode = cleanModel.customerCode;
    }
    if (model.accountPrimaryKey === undefined) {
      model.accountPrimaryKey = cleanModel.accountPrimaryKey;
    }
    if (model.cashDeskPrimaryKey === undefined) {
      model.cashDeskPrimaryKey = cleanModel.cashDeskPrimaryKey;
    }
    if (model.type === undefined) {
      model.type = cleanModel.type;
    }
    if (model.receiptNo === undefined) {
      model.receiptNo = cleanModel.receiptNo;
    }
    if (model.description === undefined) {
      model.description = cleanModel.description;
    }
    if (model.amount === undefined) {
      model.amount = cleanModel.amount;
    }
    if (model.status === undefined) {
      model.status = cleanModel.status;
    }
    if (model.platform === undefined) {
      model.platform = cleanModel.platform;
    }
    if (model.approveByPrimaryKey === undefined) { model.approveByPrimaryKey = model.employeePrimaryKey; }
    if (model.approveDate === undefined) { model.approveDate = model.insertDate; }
    if (model.recordDate === undefined) { model.recordDate = model.insertDate; }

    return model;
  }

  getCancelRecordPrimaryKey(model: PaymentModel): string {
    return 'c-' + model.primaryKey;
  }

  clearSubModel(): PaymentModel {

    const returnData = new PaymentModel();
    returnData.primaryKey = null;
    returnData.userPrimaryKey = this.authService.getUid();
    returnData.employeePrimaryKey = this.authService.getEid();
    returnData.customerCode = '-1';
    returnData.type = '-1';
    returnData.accountPrimaryKey = '-1';
    returnData.receiptNo = '';
    returnData.cashDeskPrimaryKey = '-1';
    returnData.description = '';
    returnData.amount = 0;
    returnData.status = 'waitingForApprove'; // waitingForApprove, approved, rejected, canceled
    returnData.approveByPrimaryKey = '-1';
    returnData.approveDate = 0;
    returnData.platform = 'web'; // mobile, web
    returnData.insertDate = Date.now();
    returnData.recordDate = Date.now();

    return returnData;
  }

  clearMainModel(): PaymentMainModel {
    const returnData = new PaymentMainModel();
    returnData.data = this.clearSubModel();
    returnData.customer = this.cusService.clearMainModel();
    returnData.employeeName = this.employeeMap.get(returnData.data.employeePrimaryKey);
    returnData.actionType = 'added';
    returnData.amountFormatted = currencyFormat(returnData.data.amount);
    returnData.statusTr = getStatus().get(returnData.data.status);
    returnData.platformTr = returnData.data.platform === 'web' ? 'Web' : 'Mobil';
    return returnData;
  }

  getItem(primaryKey: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.collection(this.tableName).doc(primaryKey).get().toPromise().then(async doc => {
        if (doc.exists) {
          const data = doc.data() as PaymentModel;
          data.primaryKey = doc.id;

          const returnData = new PaymentMainModel();
          returnData.data = this.checkFields(data);
          returnData.employeeName = this.employeeMap.get(getString(returnData.data.employeePrimaryKey));
          returnData.amountFormatted = currencyFormat(returnData.data.amount);
          returnData.approverName = this.employeeMap.get(returnData.data.approveByPrimaryKey);
          returnData.statusTr = getStatus().get(returnData.data.status);
          const d1 = await this.cusService.getItem(returnData.data.customerCode);
          returnData.customer = this.cusService.convertMainModel(d1.data);

          resolve(Object.assign({returnData}));
        } else {
          resolve(null);
        }
      });
    });
  }

  getCustomerItems(customerCode: string): Observable<PaymentMainModel[]> {
    this.listCollection = this.db.collection(this.tableName,
      ref => ref.where('customerCode', '==', customerCode));
    this.mainList$ = this.listCollection.stateChanges().pipe(
      map(changes =>
        changes.map(c => {
          const data = c.payload.doc.data() as PaymentModel;
          data.primaryKey = c.payload.doc.id;

          const returnData = new PaymentMainModel();
          returnData.data = this.checkFields(data);
          returnData.actionType = c.type;
          returnData.employeeName = this.employeeMap.get(returnData.data.employeePrimaryKey);
          returnData.amountFormatted = currencyFormat(returnData.data.amount);
          returnData.approverName = this.employeeMap.get(returnData.data.approveByPrimaryKey);
          returnData.statusTr = getStatus().get(returnData.data.status);
          return Object.assign({returnData});
        })
      )
    );
    return this.mainList$;
  }

  getMainItems(): Observable<PaymentMainModel[]> {
    this.listCollection = this.db.collection(this.tableName,
      ref => ref.orderBy('insertDate').where('userPrimaryKey', '==', this.authService.getUid()));
    this.mainList$ = this.listCollection.stateChanges().pipe(map(changes => {
      return changes.map(change => {
        const data = change.payload.doc.data() as PaymentModel;
        data.primaryKey = change.payload.doc.id;

        const returnData = new PaymentMainModel();
        returnData.data = this.checkFields(data);
        returnData.actionType = change.type;
        returnData.employeeName = this.employeeMap.get(returnData.data.employeePrimaryKey);
        returnData.amountFormatted = currencyFormat(returnData.data.amount);
        returnData.approverName = this.employeeMap.get(returnData.data.approveByPrimaryKey);
        returnData.statusTr = getStatus().get(returnData.data.status);

        return this.db.collection('tblCustomer').doc(data.customerCode).valueChanges()
          .pipe(map((customer: CustomerModel) => {
            returnData.customer = customer !== undefined ? this.cusService.convertMainModel(customer) : undefined;
            return Object.assign({returnData});
          }));
      });
    }), flatMap(feeds => combineLatest(feeds)));
    return this.mainList$;
  }

  getMainItemsBetweenDates(startDate: Date, endDate: Date, status: string): Observable<PaymentMainModel[]> {
    this.listCollection = this.db.collection(this.tableName,
      ref => {
        let query: CollectionReference | Query = ref;
        query = query.orderBy('insertDate').where('userPrimaryKey', '==', this.authService.getUid());
        if (startDate !== null) {
          query = query.startAt(startDate.getTime());
        }
        if (endDate !== null) {
          query = query.endAt(endDate.getTime());
        }
        if (status !== null && status !== '-1') {
          query = query.where('status', '==', status);
        }
        return query;
      }
    );
    this.mainList$ = this.listCollection.stateChanges().pipe(map(changes => {
      return changes.map(change => {
        const data = change.payload.doc.data() as PaymentModel;
        data.primaryKey = change.payload.doc.id;

        const returnData = new PaymentMainModel();
        returnData.data = this.checkFields(data);
        returnData.actionType = change.type;
        returnData.employeeName = this.employeeMap.get(returnData.data.employeePrimaryKey);
        returnData.amountFormatted = currencyFormat(returnData.data.amount);
        returnData.approverName = this.employeeMap.get(returnData.data.approveByPrimaryKey);
        returnData.statusTr = getStatus().get(returnData.data.status);

        return this.db.collection('tblCustomer').doc(data.customerCode).valueChanges()
          .pipe(map((customer: CustomerModel) => {
            returnData.customer = customer !== undefined ? this.cusService.convertMainModel(customer) : undefined;
            return Object.assign({returnData});
          }));
      });
    }), flatMap(feeds => combineLatest(feeds)));
    return this.mainList$;
  }

  getMainItemsBetweenDatesWithCustomer(startDate: Date, endDate: Date, customerPrimaryKey: any, status: string):
    Observable<PaymentMainModel[]> {
    this.listCollection = this.db.collection(this.tableName, ref => {
      let query: CollectionReference | Query = ref;
      query = query.orderBy('insertDate').where('userPrimaryKey', '==', this.authService.getUid());
      if (customerPrimaryKey !== null && customerPrimaryKey !== '-1') {
        query = query.where('customerCode', '==', customerPrimaryKey);
      }
      if (startDate !== null) {
        query = query.startAt(startDate.getTime());
      }
      if (endDate !== null) {
        query = query.endAt(endDate.getTime());
      }
      if (status !== null && status !== '-1') {
        query = query.where('status', '==', status);
      }
      return query;
    });
    this.mainList$ = this.listCollection.stateChanges().pipe(map(changes => {
      return changes.map(change => {
        const data = change.payload.doc.data() as PaymentModel;
        data.primaryKey = change.payload.doc.id;

        const returnData = new PaymentMainModel();
        returnData.data = this.checkFields(data);
        returnData.actionType = change.type;
        returnData.employeeName = this.employeeMap.get(returnData.data.employeePrimaryKey);
        returnData.amountFormatted = currencyFormat(returnData.data.amount);
        returnData.approverName = this.employeeMap.get(returnData.data.approveByPrimaryKey);
        returnData.statusTr = getStatus().get(returnData.data.status);

        return this.db.collection('tblCustomer').doc(data.customerCode).valueChanges()
          .pipe(map((customer: CustomerModel) => {
            returnData.customer = customer !== undefined ? this.cusService.convertMainModel(customer) : undefined;
            return Object.assign({returnData});
          }));
      });
    }), flatMap(feeds => combineLatest(feeds)));
    return this.mainList$;
  }

  getMainItemsBetweenDatesAsPromise = async (startDate: Date, endDate: Date, status: string):
    Promise<Array<PaymentMainModel>> => new Promise(async (resolve, reject): Promise<void> => {
    try {
      const list = Array<PaymentMainModel>();
      this.db.collection(this.tableName, ref => {
        let query: CollectionReference | Query = ref;
        query = query.orderBy('insertDate').where('userPrimaryKey', '==', this.authService.getUid());
        if (startDate !== null) {
          query = query.startAt(startDate.getTime());
        }
        if (endDate !== null) {
          query = query.endAt(endDate.getTime());
        }
        if (status !== null && status !== '-1') {
          query = query.where('status', '==', status);
        }
        return query;
      })
        .get().subscribe(snapshot => {
        snapshot.forEach(doc => {
          const data = doc.data() as PaymentModel;
          data.primaryKey = doc.id;

          const returnData = new PaymentMainModel();
          returnData.data = this.checkFields(data);
          returnData.actionType = 'added';
          returnData.customer = this.customerMap.get(returnData.data.customerCode);
          returnData.approverName = this.employeeMap.get(returnData.data.approveByPrimaryKey);
          returnData.statusTr = getStatus().get(returnData.data.status);

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
