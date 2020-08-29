import {Injectable} from '@angular/core';
import {AngularFirestore, AngularFirestoreCollection, CollectionReference, Query} from '@angular/fire/firestore';
import {Observable} from 'rxjs/Observable';
import {CustomerModel} from '../models/customer-model';
import {map, flatMap} from 'rxjs/operators';
import {combineLatest} from 'rxjs';
import {SalesInvoiceModel} from '../models/sales-invoice-model';
import {AuthenticationService} from './authentication.service';
import {LogService} from './log.service';
import {SettingService} from './setting.service';
import {SalesInvoiceMainModel} from '../models/sales-invoice-main-model';
import {ProfileService} from './profile.service';
import {currencyFormat, getFloat, getStatus, isNullOrEmpty} from '../core/correct-library';
import {CustomerService} from './customer.service';
import {CustomerAccountModel} from '../models/customer-account-model';
import {CustomerAccountService} from './customer-account.service';
import {AccountTransactionService} from './account-transaction.service';
import {ActionService} from './action.service';
import {SalesOrderModel} from '../models/sales-order-model';
import {SalesOrderMainModel} from '../models/sales-order-main-model';
import {SalesOrderDetailMainModel} from '../models/sales-order-detail-main-model';

@Injectable({
  providedIn: 'root'
})
export class SalesOrderService {
  listCollection: AngularFirestoreCollection<SalesOrderModel>;
  mainList$: Observable<SalesOrderMainModel[]>;
  tableName = 'tblSalesOrder';

  constructor(protected authService: AuthenticationService, protected sService: SettingService, protected cusService: CustomerService,
              protected logService: LogService, protected eService: ProfileService, protected db: AngularFirestore,
              protected accService: CustomerAccountService, protected atService: AccountTransactionService,
              protected actService: ActionService) {
  }

  async addItem(record: SalesOrderMainModel) {
    return await this.listCollection.add(Object.assign({}, record.data))
      .then(async result => {
        await this.logService.addTransactionLog(record, 'insert', 'salesOrder');
        this.actService.addAction(this.tableName, record.data.primaryKey, 1, 'Kayıt Oluşturma');
      });
  }

  async removeItem(record: SalesOrderMainModel) {
    return await this.db.collection(this.tableName).doc(record.data.primaryKey).delete()
      .then(async result => {
        await this.logService.addTransactionLog(record, 'delete', 'salesInvoice');
      });
  }

  async updateItem(record: SalesOrderMainModel) {
    return await this.db.collection(this.tableName).doc(record.data.primaryKey).update(Object.assign({}, record.data))
      .then(async value => {
        if (record.data.status === 'approved') {
          await this.logService.addTransactionLog(record, 'approved', 'salesOrder');
          this.actService.addAction(this.tableName, record.data.primaryKey, 1, 'Kayıt Onay');
        } else if (record.data.status === 'rejected') {
          await this.logService.addTransactionLog(record, 'rejected', 'salesInvoice');
          this.actService.addAction(this.tableName, record.data.primaryKey, 1, 'Kayıt İptal');
        } else {
          await this.logService.addTransactionLog(record, 'update', 'salesOrder');
          this.actService.addAction(this.tableName, record.data.primaryKey, 2, 'Kayıt Güncelleme');
        }
      });
  }

  async setItem(record: SalesOrderMainModel, primaryKey: string) {
    return await this.listCollection.doc(primaryKey).set(Object.assign({}, record.data))
      .then(async value => {
        await this.logService.addTransactionLog(record, 'insert', 'salesOrder');
        this.actService.addAction(this.tableName, record.data.primaryKey, 1, 'Kayıt Oluşturma');
        if (record.data.status === 'approved') {
          await this.logService.addTransactionLog(record, 'approved', 'salesOrder');
        } else if (record.data.status === 'rejected') {
          await this.logService.addTransactionLog(record, 'rejected', 'salesOrder');
        } else {
          // await this.logService.addTransactionLog(record, 'update', 'salesInvoice');
        }
      });
  }

  checkForSave(record: SalesOrderMainModel): Promise<string> {
    return new Promise((resolve, reject) => {
      if (record.data.customerPrimaryKey === '-1') {
        reject('Lütfen müşteri seçiniz.');
      } else if (record.data.priceListPrimaryKey === '-1') {
        reject('Lütfen fiyat listesi seçiniz.');
      } else if (record.data.priceListPrimaryKey === '-1') {
        reject('Lütfen iskonto listesi seçiniz.');
      } else if (record.data.deliveryAddressPrimaryKey === '-1') {
        reject('Lütfen sevkiyat adresi seçiniz.');
      } else if (record.data.totalPrice <= 0) {
        reject('Tutar sıfırdan büyük olmalıdır.');
      } else if (record.data.totalPrice <= 0) {
        reject('Tutar (+KDV) sıfırdan büyük olmalıdır.');
      } else if (isNullOrEmpty(record.data.recordDate)) {
        reject('Lütfen kayıt tarihi seçiniz.');
      } else {
        resolve(null);
      }
    });
  }

  checkForRemove(record: SalesOrderMainModel): Promise<string> {
    return new Promise((resolve, reject) => {
      resolve(null);
    });
  }

  checkFields(model: SalesOrderModel): SalesOrderModel {
    const cleanModel = this.clearSubModel();

    return model;
  }

  clearSubModel(): SalesOrderModel {

    const returnData = new SalesOrderModel();
    returnData.primaryKey = null;
    returnData.userPrimaryKey = this.authService.getUid();
    returnData.employeePrimaryKey = this.authService.getEid();
    returnData.customerPrimaryKey = '-1';
    returnData.priceListPrimaryKey = '-1';
    returnData.discountListPrimaryKey = '-1';
    returnData.deliveryAddressPrimaryKey = '-1';
    returnData.storagePrimaryKey = '-1';
    returnData.termPrimaryKey = '-1';
    returnData.paymentTypePrimaryKey = '-1';
    returnData.description = '';
    returnData.type = 'sales'; // sales, service
    returnData.status = 'waitingForApprove'; // waitingForApprove, approved, rejected
    returnData.platform = 'web'; // mobile, web
    returnData.approverPrimaryKey = '-1';
    returnData.approveDate = 0;
    returnData.insertDate = Date.now();
    returnData.recordDate = Date.now();
    returnData.totalPrice = 0;
    returnData.totalPriceWithTax = 0;
    returnData.generalDiscount = 0;

    return returnData;
  }

  clearMainModel(): SalesOrderMainModel {
    const returnData = new SalesOrderMainModel();
    returnData.data = this.clearSubModel();
    returnData.customer = this.cusService.clearMainModel();
    returnData.actionType = 'added';
    returnData.statusTr = getStatus().get(returnData.data.status);
    returnData.platformTr = returnData.data.platform === 'web' ? 'Web' : 'Mobil';
    returnData.totalPriceFormatted = currencyFormat(returnData.data.totalPrice);
    returnData.totalPriceWithTaxFormatted = currencyFormat(returnData.data.totalPriceWithTax);
    returnData.orderDetailList = Array<SalesOrderDetailMainModel>();
    return returnData;
  }

  getItem(primaryKey: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.collection(this.tableName).doc(primaryKey).get().toPromise().then(doc => {
        if (doc.exists) {
          const data = doc.data() as SalesOrderModel;
          data.primaryKey = doc.id;

          const returnData = new SalesOrderMainModel();
          returnData.data = this.checkFields(data);
          returnData.totalPriceFormatted = currencyFormat(returnData.data.totalPrice);
          returnData.totalPriceWithTaxFormatted = currencyFormat(returnData.data.totalPriceWithTax);
          returnData.statusTr = getStatus().get(returnData.data.status);

          Promise.all([this.cusService.getItem(returnData.data.customerPrimaryKey)])
            .then((values: any) => {
              if (values[0] !== undefined || values[0] !== null) {
                const customer = values[0] as CustomerModel;
                returnData.customer = this.cusService.convertMainModel(customer);
              }
            });

          resolve(Object.assign({returnData}));
        } else {
          resolve(null);
        }
      });
    });
  }

  getMainItems(): Observable<SalesOrderMainModel[]> {
    this.listCollection = this.db.collection(this.tableName,
      ref => ref.orderBy('insertDate').where('userPrimaryKey', '==', this.authService.getUid()));
    this.mainList$ = this.listCollection.stateChanges().pipe(map(changes => {
      return changes.map(change => {
        const data = change.payload.doc.data() as SalesOrderModel;
        data.primaryKey = change.payload.doc.id;

        const returnData = new SalesOrderMainModel();
        returnData.data = this.checkFields(data);
        returnData.actionType = change.type;
        returnData.totalPriceFormatted = currencyFormat(returnData.data.totalPrice);
        returnData.totalPriceWithTaxFormatted = currencyFormat(returnData.data.totalPriceWithTax);
        returnData.statusTr = getStatus().get(returnData.data.status);

        return this.db.collection('tblCustomer').doc(data.customerPrimaryKey).valueChanges()
          .pipe(map((customer: CustomerModel) => {
            returnData.customer = customer !== undefined ? this.cusService.convertMainModel(customer) : undefined;
            return Object.assign({returnData});
          }));
      });
    }), flatMap(feeds => combineLatest(feeds)));
    return this.mainList$;
  }

  getMainItemsBetweenDates(startDate: Date, endDate: Date): Observable<SalesOrderMainModel[]> {
    this.listCollection = this.db.collection(this.tableName,
      ref => ref.orderBy('insertDate').startAt(startDate.getTime()).endAt(endDate.getTime())
        .where('userPrimaryKey', '==', this.authService.getUid()));
    this.mainList$ = this.listCollection.stateChanges().pipe(map(changes => {
      return changes.map(change => {
        const data = change.payload.doc.data() as SalesOrderModel;
        data.primaryKey = change.payload.doc.id;

        const returnData = new SalesOrderMainModel();
        returnData.data = this.checkFields(data);
        returnData.actionType = change.type;
        returnData.actionType = change.type;
        returnData.totalPriceFormatted = currencyFormat(returnData.data.totalPrice);
        returnData.totalPriceWithTaxFormatted = currencyFormat(returnData.data.totalPriceWithTax);
        returnData.statusTr = getStatus().get(returnData.data.status);

        return this.db.collection('tblCustomer').doc(data.customerPrimaryKey).valueChanges()
          .pipe(map((customer: CustomerModel) => {
            returnData.customer = customer !== undefined ? this.cusService.convertMainModel(customer) : undefined;
            return Object.assign({returnData});
          }));
      });
    }), flatMap(feeds => combineLatest(feeds)));
    return this.mainList$;
  }
}
