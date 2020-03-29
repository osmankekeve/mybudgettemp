import {Injectable} from '@angular/core';
import {
  AngularFirestore,
  AngularFirestoreCollection,
  CollectionReference,
  Query
} from '@angular/fire/firestore';
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
import {currencyFormat, getString, isNullOrEmpty} from '../core/correct-library';
import {CustomerService} from './customer.service';

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

  async addItem(record: PurchaseInvoiceMainModel) {
    await this.logService.sendToLog(record, 'insert', 'purchaseInvoice');
    await this.sService.increasePurchaseInvoiceNumber();
    return await this.listCollection.add(Object.assign({}, record.data));
  }

  async setItem(record: PurchaseInvoiceMainModel, primaryKey: string) {
    await this.logService.sendToLog(record, 'insert', 'purchaseInvoice');
    await this.sService.increasePurchaseInvoiceNumber();
    return await this.listCollection.doc(primaryKey).set(Object.assign({}, record.data));
  }

  async removeItem(record: PurchaseInvoiceMainModel) {
    await this.logService.sendToLog(record, 'delete', 'purchaseInvoice');
    return await this.db.collection(this.tableName).doc(record.data.primaryKey).delete();
  }

  async updateItem(record: PurchaseInvoiceMainModel) {
    await this.logService.sendToLog(record, 'update', 'purchaseInvoice');
    return await this.db.collection(this.tableName).doc(record.data.primaryKey).update(Object.assign({}, record.data));
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
    if (model.isActive === undefined) { model.isActive = cleanModel.isActive; }

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
    returnData.isActive = true;
    returnData.insertDate = Date.now();

    return returnData;
  }

  clearMainModel(): PurchaseInvoiceMainModel {
    const returnData = new PurchaseInvoiceMainModel();
    returnData.data = this.clearSubModel();
    returnData.customerName = '';
    returnData.employeeName = this.employeeMap.get(returnData.data.employeePrimaryKey);
    returnData.actionType = 'added';
    returnData.isActiveTr = returnData.data.isActive ? 'Aktif' : 'Pasif';
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

        return this.db.collection('tblCustomer').doc(data.customerCode).valueChanges()
          .pipe(map((customer: CustomerModel) => {
            returnData.customer = customer !== undefined ? customer : undefined;
            returnData.customerName = customer !== undefined ? customer.name : 'Belirlenemeyen Müşteri Kaydı';
            return Object.assign({returnData}); }));
      });
    }), flatMap(feeds => combineLatest(feeds)));
    return this.mainList$;
  }

  getMainItemsBetweenDates(startDate: Date, endDate: Date): Observable<PurchaseInvoiceMainModel[]> {
    this.listCollection = this.db.collection(this.tableName,
      ref => ref.orderBy('insertDate').startAt(startDate.getTime()).endAt(endDate.getTime())
        .where('userPrimaryKey', '==', this.authService.getUid()));
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

        return this.db.collection('tblCustomer').doc(data.customerCode).valueChanges()
          .pipe(map((customer: CustomerModel) => {
            returnData.customer = customer !== undefined ? customer : undefined;
            returnData.customerName = customer !== undefined ? customer.name : 'Belirlenemeyen Müşteri Kaydı';
            return Object.assign({returnData}); }));
      });
    }), flatMap(feeds => combineLatest(feeds)));
    return this.mainList$;
  }

  getMainItemsBetweenDatesWithCustomer(startDate: Date, endDate: Date, customerPrimaryKey: any): Observable<PurchaseInvoiceMainModel[]> {
    this.listCollection = this.db.collection(this.tableName, ref => {
      let query: CollectionReference | Query = ref;
      query = query.orderBy('insertDate').startAt(startDate.getTime()).endAt(endDate.getTime())
        .where('userPrimaryKey', '==', this.authService.getUid());
      if (customerPrimaryKey !== '-1') {
        query = query.where('customerCode', '==', customerPrimaryKey);
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

        return this.db.collection('tblCustomer').doc(data.customerCode).valueChanges()
          .pipe(map((customer: CustomerModel) => {
            returnData.customer = customer !== undefined ? customer : undefined;
            returnData.customerName = customer !== undefined ? customer.name : 'Belirlenemeyen Müşteri Kaydı';
            return Object.assign({returnData}); }));
      });
    }), flatMap(feeds => combineLatest(feeds)));
    return this.mainList$;
  }

  getMainItemsBetweenDatesAsPromise = async (startDate: Date, endDate: Date):
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
        return query;
      }).get().subscribe(snapshot => {
        snapshot.forEach(doc => {
          const data = doc.data() as PurchaseInvoiceModel;
          data.primaryKey = doc.id;

          const returnData = new PurchaseInvoiceMainModel();
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
