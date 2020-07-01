import {Injectable} from '@angular/core';
import {AngularFirestore, AngularFirestoreCollection, CollectionReference, Query} from '@angular/fire/firestore';
import {Observable} from 'rxjs/Observable';
import {PurchaseInvoiceModel} from '../models/purchase-invoice-model';
import {CustomerModel} from '../models/customer-model';
import {map, flatMap} from 'rxjs/operators';
import {combineLatest} from 'rxjs';
import {AuthenticationService} from './authentication.service';
import {LogService} from './log.service';
import {SettingService} from './setting.service';
import {ProfileService} from './profile.service';
import {PurchaseInvoiceMainModel} from '../models/purchase-invoice-main-model';
import {currencyFormat, getStatus, getString, isNullOrEmpty} from '../core/correct-library';
import {CustomerService} from './customer.service';
import {AccountTransactionService} from './account-transaction.service';
import {ActionService} from './action.service';

@Injectable({
  providedIn: 'root'
})
export class PurchaseInvoiceService {
  listCollection: AngularFirestoreCollection<PurchaseInvoiceModel>;
  mainList$: Observable<PurchaseInvoiceMainModel[]>;
  customerList$: Observable<CustomerModel[]>;
  employeeMap = new Map();
  customerMap = new Map();
  tableName = 'tblPurchaseInvoice';

  constructor(protected authService: AuthenticationService, protected sService: SettingService, protected cusService: CustomerService,
              protected logService: LogService, protected eService: ProfileService, protected db: AngularFirestore,
              protected atService: AccountTransactionService, protected actService: ActionService) {
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

  async addItem(record: PurchaseInvoiceMainModel) {
    return await this.listCollection.add(Object.assign({}, record.data))
      .then(async result => {
        await this.logService.sendToLog(record, 'insert', 'purchaseInvoice');
        await this.sService.increasePurchaseInvoiceNumber();
        this.actService.addAction(this.tableName, record.data.primaryKey, 1, 'Kayıt Oluşturma');
      });
  }

  async setItem(record: PurchaseInvoiceMainModel, primaryKey: string) {
    return await this.listCollection.doc(primaryKey).set(Object.assign({}, record.data))
      .then(async value => {
        await this.logService.sendToLog(record, 'insert', 'purchaseInvoice');
        await this.sService.increasePurchaseInvoiceNumber();
        this.actService.addAction(this.tableName, record.data.primaryKey, 1, 'Kayıt Oluşturma');
        if (record.data.status === 'approved') {
          const trans = {
            primaryKey: record.data.primaryKey,
            userPrimaryKey: record.data.userPrimaryKey,
            receiptNo: record.data.receiptNo,
            transactionPrimaryKey: record.data.primaryKey,
            transactionType: 'purchaseInvoice',
            parentPrimaryKey: record.data.customerCode,
            parentType: 'customer',
            accountPrimaryKey: record.data.accountPrimaryKey,
            cashDeskPrimaryKey: '-1',
            amount: record.data.type === 'purchase' ? record.data.totalPriceWithTax : record.data.totalPriceWithTax * -1,
            amountType: record.data.type === 'purchase' ? 'credit' : 'debit',
            insertDate: record.data.insertDate
          };
          await this.atService.setItem(trans, trans.primaryKey);
          await this.logService.sendToLog(record, 'approved', 'purchaseInvoice');
        } else if (record.data.status === 'rejected') {
          await this.logService.sendToLog(record, 'rejected', 'purchaseInvoice');
        } else {
          // await this.logService.sendToLog(record, 'update', 'purchaseInvoice');
        }
      });
  }

  async removeItem(record: PurchaseInvoiceMainModel) {
    return await this.db.collection(this.tableName).doc(record.data.primaryKey).delete()
      .then(async result => {
        await this.logService.sendToLog(record, 'delete', 'purchaseInvoice');
        if (record.data.status === 'approved') {
          await this.atService.removeItem(null, record.data.primaryKey);
        }
      });
  }

  async updateItem(record: PurchaseInvoiceMainModel) {
    return await this.db.collection(this.tableName).doc(record.data.primaryKey)
      .update(Object.assign({}, record.data))
      .then(async value => {
        if (record.data.status === 'approved') {
          const trans = {
            primaryKey: record.data.primaryKey,
            userPrimaryKey: record.data.userPrimaryKey,
            receiptNo: record.data.receiptNo,
            transactionPrimaryKey: record.data.primaryKey,
            transactionType: 'purchaseInvoice',
            parentPrimaryKey: record.data.customerCode,
            parentType: 'customer',
            accountPrimaryKey: record.data.accountPrimaryKey,
            cashDeskPrimaryKey: '-1',
            amount: record.data.type === 'purchase' ? record.data.totalPriceWithTax : record.data.totalPriceWithTax * -1,
            amountType: record.data.type === 'purchase' ? 'credit' : 'debit',
            insertDate: record.data.insertDate
          };
          await this.atService.setItem(trans, trans.primaryKey);
          await this.logService.sendToLog(record, 'approved', 'purchaseInvoice');
          this.actService.addAction(this.tableName, record.data.primaryKey, 1, 'Kayıt Onay');
        } else if (record.data.status === 'rejected') {
          await this.logService.sendToLog(record, 'rejected', 'purchaseInvoice');
          this.actService.addAction(this.tableName, record.data.primaryKey, 1, 'Kayıt İptal');
        } else {
          await this.logService.sendToLog(record, 'update', 'purchaseInvoice');
          this.actService.addAction(this.tableName, record.data.primaryKey, 2, 'Kayıt Güncelleme');
        }
      });
  }

  checkForSave(record: PurchaseInvoiceMainModel): Promise<string> {
    return new Promise((resolve, reject) => {
      if (record.data.customerCode === '' || record.data.customerCode === '-1') {
        reject('Lütfen müşteri seçiniz.');
      } else if (record.data.accountPrimaryKey === '' || record.data.accountPrimaryKey === '-1') {
        reject('Lütfen hesap seçiniz.');
      } else if (record.data.type === '' || record.data.type === '-1') {
        reject('Lütfen fatura tipi seçiniz.');
      } else if (record.data.totalPrice <= 0) {
        reject('Tutar sıfırdan büyük olmalıdır.');
      } else if (record.data.receiptNo === '') {
        reject('Lütfen fiş numarası seçiniz.');
      } else if (record.data.totalPrice <= 0) {
        reject('Tutar (+KDV) sıfırdan büyük olmalıdır.');
      } else if (isNullOrEmpty(record.data.insertDate)) {
        reject('Lütfen kayıt tarihi seçiniz.');
      } else {
        resolve(null);
      }
    });
  }

  checkForRemove(record: PurchaseInvoiceMainModel): Promise<string> {
    return new Promise((resolve, reject) => {
      resolve(null);
    });
  }

  checkFields(model: PurchaseInvoiceModel): PurchaseInvoiceModel {
    const cleanModel = this.clearSubModel();
    if (model.employeePrimaryKey === undefined) { model.employeePrimaryKey = '-1'; }
    if (model.customerCode === undefined) { model.customerCode = cleanModel.customerCode; }
    if (model.accountPrimaryKey === undefined) { model.accountPrimaryKey = cleanModel.accountPrimaryKey; }
    if (model.receiptNo === undefined) { model.receiptNo = cleanModel.receiptNo; }
    if (model.type === undefined) { model.type = cleanModel.type; }
    if (model.totalPrice === undefined) { model.totalPrice = cleanModel.totalPrice; }
    if (model.totalPriceWithTax === undefined) { model.totalPriceWithTax = cleanModel.totalPriceWithTax; }
    if (model.description === undefined) { model.description = cleanModel.description; }
    if (model.status === undefined) { model.status = cleanModel.status; }
    if (model.platform === undefined) { model.platform = cleanModel.platform; }
    if (model.approveByPrimaryKey === undefined) { model.approveByPrimaryKey = model.employeePrimaryKey; }
    if (model.approveDate === undefined) { model.approveDate = model.insertDate; }
    if (model.recordDate === undefined) { model.recordDate = model.insertDate; }

    return model;
  }

  clearSubModel(): PurchaseInvoiceModel {

    const returnData = new PurchaseInvoiceModel();
    returnData.primaryKey = null;
    returnData.userPrimaryKey = this.authService.getUid();
    returnData.employeePrimaryKey = this.authService.getEid();
    returnData.customerCode = '-1';
    returnData.accountPrimaryKey = '-1';
    returnData.receiptNo = '';
    returnData.type = '-1';
    returnData.totalPrice = 0;
    returnData.totalPriceWithTax = 0;
    returnData.description = '';
    returnData.status = 'waitingForApprove'; // waitingForApprove, approved, rejected
    returnData.approveByPrimaryKey = '-1';
    returnData.approveDate = 0;
    returnData.platform = 'web'; // mobile, web
    returnData.insertDate = Date.now();
    returnData.recordDate = Date.now();

    return returnData;
  }

  clearMainModel(): PurchaseInvoiceMainModel {
    const returnData = new PurchaseInvoiceMainModel();
    returnData.data = this.clearSubModel();
    returnData.customerName = '';
    returnData.employeeName = this.employeeMap.get(returnData.data.employeePrimaryKey);
    returnData.actionType = 'added';
    returnData.statusTr = getStatus().get(returnData.data.status);
    returnData.platformTr = returnData.data.platform === 'web' ? 'Web' : 'Mobil';
    returnData.totalPriceFormatted = currencyFormat(returnData.data.totalPrice);
    returnData.totalPriceWithTaxFormatted = currencyFormat(returnData.data.totalPriceWithTax);
    return returnData;
  }

  getItem(primaryKey: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.collection(this.tableName).doc(primaryKey).get().toPromise().then(doc => {
        if (doc.exists) {
          const data = doc.data() as PurchaseInvoiceModel;
          data.primaryKey = doc.id;

          const returnData = new PurchaseInvoiceMainModel();
          returnData.data = this.checkFields(data);
          returnData.employeeName = this.employeeMap.get(getString(returnData.data.employeePrimaryKey));
          returnData.totalPriceFormatted = currencyFormat(returnData.data.totalPrice);
          returnData.totalPriceWithTaxFormatted = currencyFormat(returnData.data.totalPriceWithTax);
          returnData.approverName = this.employeeMap.get(returnData.data.approveByPrimaryKey);
          returnData.statusTr = getStatus().get(returnData.data.status);

          Promise.all([this.cusService.getItem(returnData.data.customerCode)])
            .then((values: any) => {
              if (values[0] !== undefined || values[0] !== null) {
                returnData.customer = values[0] as CustomerModel;
              }
            });

          resolve(Object.assign({returnData}));
        } else {
          console.log('no data');
          resolve(null);
        }
      });
    });
  }

  getCustomerItems(customerCode: string): Observable<PurchaseInvoiceMainModel[]> {
    this.listCollection = this.db.collection(this.tableName,
      ref => ref.where('customerCode', '==', customerCode));
    this.mainList$ = this.listCollection.stateChanges().pipe(
      map(changes =>
        changes.map(c => {
          const data = c.payload.doc.data() as PurchaseInvoiceModel;
          data.primaryKey = c.payload.doc.id;

          const returnData = new PurchaseInvoiceMainModel();
          returnData.data = this.checkFields(data);
          returnData.actionType = c.type;
          returnData.employeeName = this.employeeMap.get(returnData.data.employeePrimaryKey);
          returnData.totalPriceFormatted = currencyFormat(returnData.data.totalPrice);
          returnData.totalPriceWithTaxFormatted = currencyFormat(returnData.data.totalPriceWithTax);
          returnData.approverName = this.employeeMap.get(returnData.data.approveByPrimaryKey);
          returnData.statusTr = getStatus().get(returnData.data.status);
          return Object.assign({returnData});
        })
      )
    );
    return this.mainList$;
  }

  getMainItems(): Observable<PurchaseInvoiceMainModel[]> {
    this.listCollection = this.db.collection(this.tableName,
      ref => ref.orderBy('insertDate').where('userPrimaryKey', '==', this.authService.getUid()));
    this.mainList$ = this.listCollection.stateChanges().pipe(map(changes => {
      return changes.map(change => {
        const data = change.payload.doc.data() as PurchaseInvoiceModel;
        data.primaryKey = change.payload.doc.id;

        const returnData = new PurchaseInvoiceMainModel();
        returnData.data = this.checkFields(data);
        returnData.actionType = change.type;
        returnData.employeeName = this.employeeMap.get(returnData.data.employeePrimaryKey);
        returnData.totalPriceFormatted = currencyFormat(returnData.data.totalPrice);
        returnData.totalPriceWithTaxFormatted = currencyFormat(returnData.data.totalPriceWithTax);
        returnData.approverName = this.employeeMap.get(returnData.data.approveByPrimaryKey);
        returnData.statusTr = getStatus().get(returnData.data.status);

        return this.db.collection('tblCustomer').doc(data.customerCode).valueChanges()
          .pipe(map((customer: CustomerModel) => {
            returnData.customer = customer !== undefined ? customer : undefined;
            returnData.customerName = customer !== undefined ? customer.name : 'Belirlenemeyen Müşteri Kaydı';
            return Object.assign({returnData}); }));
      });
    }), flatMap(feeds => combineLatest(feeds)));
    return this.mainList$;
  }

  getMainItemsBetweenDatesWithCustomer(startDate: Date, endDate: Date, customerPrimaryKey: any, status: string):
    Observable<PurchaseInvoiceMainModel[]> {
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
        const data = change.payload.doc.data() as PurchaseInvoiceModel;
        data.primaryKey = change.payload.doc.id;

        const returnData = new PurchaseInvoiceMainModel();
        returnData.data = this.checkFields(data);
        returnData.actionType = change.type;
        returnData.employeeName = this.employeeMap.get(returnData.data.employeePrimaryKey);
        returnData.totalPriceFormatted = currencyFormat(returnData.data.totalPrice);
        returnData.totalPriceWithTaxFormatted = currencyFormat(returnData.data.totalPriceWithTax);
        returnData.approverName = this.employeeMap.get(returnData.data.approveByPrimaryKey);
        returnData.statusTr = getStatus().get(returnData.data.status);

        return this.db.collection('tblCustomer').doc(data.customerCode).valueChanges()
          .pipe(map((customer: CustomerModel) => {
            returnData.customer = customer !== undefined ? customer : undefined;
            returnData.customerName = customer !== undefined ? customer.name : 'Belirlenemeyen Müşteri Kaydı';
            return Object.assign({returnData}); }));
      });
    }), flatMap(feeds => combineLatest(feeds)));
    return this.mainList$;
  }

  getMainItemsBetweenDatesAsPromise = async (startDate: Date, endDate: Date, status: string):
    Promise<Array<PurchaseInvoiceMainModel>> => new Promise(async (resolve, reject): Promise<void> => {
    try {
      const list = Array<PurchaseInvoiceMainModel>();
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
      }).get().subscribe(snapshot => {
        snapshot.forEach(doc => {
          const data = doc.data() as PurchaseInvoiceModel;
          data.primaryKey = doc.id;

          const returnData = new PurchaseInvoiceMainModel();
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
