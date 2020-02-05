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
import {map, flatMap, startWith} from 'rxjs/operators';
import {combineLatest} from 'rxjs';
import {AuthenticationService} from './authentication.service';
import {LogService} from './log.service';
import {SettingService} from './setting.service';
import {ProfileService} from './profile.service';
import {PurchaseInvoiceMainModel} from '../models/purchase-invoice-main-model';
import {AccountVoucherMainModel} from '../models/account-voucher-main-model';
import {getString} from '../core/correct-library';

@Injectable({
  providedIn: 'root'
})
export class PurchaseInvoiceService {
  listCollection: AngularFirestoreCollection<PurchaseInvoiceModel>;
  mainList$: Observable<PurchaseInvoiceMainModel[]>;
  customerList$: Observable<CustomerModel[]>;
  employeeMap = new Map();
  tableName = 'tblPurchaseInvoice';

  constructor(public authService: AuthenticationService, public sService: SettingService,
              public logService: LogService, public eService: ProfileService, public db: AngularFirestore) {
    if (this.authService.isUserLoggedIn()) {
      this.eService.getItems().subscribe(list => {
        this.employeeMap.clear();
        this.employeeMap.set('-1', 'Tüm Kullanıcılar');
        list.forEach(item => {
          this.employeeMap.set(item.primaryKey, item.longName);
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

  clearSubModel(): PurchaseInvoiceModel {

    const returnData = new PurchaseInvoiceModel();
    returnData.primaryKey = null;
    returnData.userPrimaryKey = this.authService.getUid();
    returnData.employeePrimaryKey = this.authService.getEid();
    returnData.customerCode = '-1';
    returnData.receiptNo = '';
    returnData.type = '-1';
    returnData.totalPrice = null;
    returnData.totalPriceWithTax = null;
    returnData.description = '';
    returnData.insertDate = Date.now();

    return returnData;
  }

  clearMainModel(): PurchaseInvoiceMainModel {
    const returnData = new AccountVoucherMainModel();
    returnData.data = this.clearSubModel();
    returnData.customerName = '';
    returnData.employeeName = this.employeeMap.get(returnData.data.employeePrimaryKey);
    returnData.actionType = 'added';
    return returnData;
  }

  getItem(primaryKey: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.collection(this.tableName).doc(primaryKey).get().toPromise().then(doc => {
        if (doc.exists) {
          const data = doc.data() as PurchaseInvoiceModel;
          data.primaryKey = doc.id;

          const returnData = new PurchaseInvoiceMainModel();
          returnData.data = data;
          returnData.employeeName = this.employeeMap.get(getString(returnData.data.employeePrimaryKey));
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
          returnData.data = data;
          returnData.actionType = c.type;
          returnData.employeeName = this.employeeMap.get(returnData.data.employeePrimaryKey);
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
        returnData.actionType = change.type;
        returnData.data = data;
        returnData.employeeName = this.employeeMap.get(returnData.data.employeePrimaryKey);

        return this.db.collection('tblCustomer').doc(data.customerCode).valueChanges()
          .pipe(map((customer: CustomerModel) => {
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
        returnData.actionType = change.type;
        returnData.data = data;
        returnData.employeeName = this.employeeMap.get(returnData.data.employeePrimaryKey);

        return this.db.collection('tblCustomer').doc(data.customerCode).valueChanges()
          .pipe(map((customer: CustomerModel) => {
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
        returnData.actionType = change.type;
        returnData.data = data;
        returnData.employeeName = this.employeeMap.get(returnData.data.employeePrimaryKey);

        return this.db.collection('tblCustomer').doc(data.customerCode).valueChanges()
          .pipe(map((customer: CustomerModel) => {
            returnData.customerName = customer !== undefined ? customer.name : 'Belirlenemeyen Müşteri Kaydı';
            return Object.assign({returnData}); }));
      });
    }), flatMap(feeds => combineLatest(feeds)));
    return this.mainList$;
  }

}
