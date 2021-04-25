import {Injectable} from '@angular/core';
import {AngularFirestore, AngularFirestoreCollection, CollectionReference, Query} from '@angular/fire/firestore';
import {Observable} from 'rxjs/Observable';
import {CustomerModel} from '../models/customer-model';
import {map, mergeMap} from 'rxjs/operators';
import {combineLatest} from 'rxjs';
import {AuthenticationService} from './authentication.service';
import {LogService} from './log.service';
import {ProfileService} from './profile.service';
import {
  currencyFormat,
  getCustomerTypes,
  getFloat,
  getOrderType,
  getPaymentTypes,
  getStatus,
  getTerms,
  isNullOrEmpty
} from '../core/correct-library';
import {CustomerService} from './customer.service';
import {AccountTransactionService} from './account-transaction.service';
import {ActionService} from './action.service';
import {SalesOrderModel} from '../models/sales-order-model';
import {SalesOrderMainModel} from '../models/sales-order-main-model';
import {SalesOrderDetailService} from './sales-order-detail.service';
import {PriceListService} from './price-list.service';
import {DiscountListService} from './discount-list.service';
import {DefinitionService} from './definition.service';
import {DeliveryAddressService} from './delivery-address.service';
import {SettingService} from './setting.service';

@Injectable({
  providedIn: 'root'
})
export class SalesOrderService {
  listCollection: AngularFirestoreCollection<SalesOrderModel>;
  mainList$: Observable<SalesOrderMainModel[]>;
  employeeMap = new Map();
  tableName = 'tblSalesOrder';

  constructor(protected authService: AuthenticationService, protected cusService: CustomerService,
              protected logService: LogService, protected eService: ProfileService, protected db: AngularFirestore,
              protected atService: AccountTransactionService, protected sService: SettingService,
              protected actService: ActionService, protected sodService: SalesOrderDetailService, protected plService: PriceListService,
              protected dService: DiscountListService, protected daService: DeliveryAddressService, protected defService: DefinitionService) {
    this.listCollection = this.db.collection(this.tableName);
  }

  async removeItem(record: SalesOrderMainModel) {
    return await this.db.collection(this.tableName).doc(record.data.primaryKey).delete()
      .then(async () => {
        for (const item of record.orderDetailList) {
          await this.db.collection(this.sodService.tableName).doc(item.data.primaryKey).delete();
        }
        this.actService.removeActions(this.tableName, record.data.primaryKey);
        await this.logService.addTransactionLog(record, 'delete', 'salesOrder');
      });
  }

  async updateItem(record: SalesOrderMainModel) {
    return await this.db.collection(this.tableName).doc(record.data.primaryKey).update(Object.assign({}, record.data))
      .then(async () => {
        if (record.data.status === 'approved' || record.data.status === 'waitingForApprove') {
          await this.sodService.getItemsWithOrderPrimaryKey(record.data.primaryKey)
            .then((list) => {
              list.forEach(async item => {
                await this.db.collection(this.sodService.tableName).doc(item.primaryKey).delete();
              });
            }).finally(async () => {
              for (const item of record.orderDetailList) {
                  await this.db.collection(this.sodService.tableName).doc(item.data.primaryKey).set(Object.assign({}, item.data));
              }
            });
        }
      })
      .finally(async () => {
        if (record.data.status === 'waitingForApprove') {
          await this.logService.addTransactionLog(record, 'update', 'salesOrder');
          this.actService.addAction(this.tableName, record.data.primaryKey, 1, 'Kayıt Güncelleme');
        } else if (record.data.status === 'approved') {
          await this.logService.addTransactionLog(record, 'approved', 'salesOrder');
          this.actService.addAction(this.tableName, record.data.primaryKey, 1, 'Kayıt Onay');
        } else if (record.data.status === 'rejected') {
          await this.logService.addTransactionLog(record, 'rejected', 'salesOrder');
          this.actService.addAction(this.tableName, record.data.primaryKey, 1, 'Kayıt İptal');
        } else if (record.data.status === 'closed') {
          for (const item of record.orderDetailList) {
            item.data.invoicedStatus = 'complete';
            await this.sodService.updateItem(item);
          }
          await this.logService.addTransactionLog(record, 'closed', 'salesOrder');
          this.actService.addAction(this.tableName, record.data.primaryKey, 1, 'Kayıt Kapatma');
        } else if (record.data.status === 'done') {
          await this.logService.addTransactionLog(record, 'done', 'salesOrder');
          this.actService.addAction(this.tableName, record.data.primaryKey, 1, 'Kayıt İşlem Bitimi');
        } else {
          await this.logService.addTransactionLog(record, 'update', 'salesOrder');
          this.actService.addAction(this.tableName, record.data.primaryKey, 2, 'Kayıt Güncelleme');
        }
      });
  }

  async setItem(record: SalesOrderMainModel, primaryKey: string) {
    return await this.listCollection.doc(primaryKey).set(Object.assign({}, record.data))
      .then(async () => {
        await this.sService.increaseOrderNumber();
        if (record.data.status === 'approved' || record.data.status === 'waitingForApprove') {
          await this.sodService.getItemsWithOrderPrimaryKey(record.data.primaryKey)
            .then((list) => {
              list.forEach(async item => {
                await this.db.collection(this.sodService.tableName).doc(item.primaryKey).delete();
              });
            }).finally(async () => {
              for (const item of record.orderDetailList) {
                  await this.db.collection(this.sodService.tableName).doc(item.data.primaryKey).set(Object.assign({}, item.data));
              }
            });
        }
      })
      .finally(async () => {
        if (record.data.status === 'waitingForApprove') {
          await this.logService.addTransactionLog(record, 'insert', 'salesOrder');
          this.actService.addAction(this.tableName, record.data.primaryKey, 1, 'Kayıt Oluşturma');
        } else if (record.data.status === 'approved') {
          await this.logService.addTransactionLog(record, 'approved', 'salesOrder');
          this.actService.addAction(this.tableName, record.data.primaryKey, 1, 'Kayıt Onay');
        } else if (record.data.status === 'rejected') {
          await this.logService.addTransactionLog(record, 'rejected', 'salesOrder');
          this.actService.addAction(this.tableName, record.data.primaryKey, 1, 'Kayıt İptal');
        } else if (record.data.status === 'closed') {
          for (const item of record.orderDetailList) {
            item.data.invoicedStatus = 'complete';
            await this.sodService.updateItem(item);
          }
          await this.logService.addTransactionLog(record, 'closed', 'salesOrder');
          this.actService.addAction(this.tableName, record.data.primaryKey, 1, 'Kayıt Kapatma');
        } else if (record.data.status === 'done') {
          await this.logService.addTransactionLog(record, 'done', 'salesOrder');
          this.actService.addAction(this.tableName, record.data.primaryKey, 1, 'Kayıt İşlem Bitimi');
        } else {
          await this.logService.addTransactionLog(record, 'update', 'salesOrder');
          this.actService.addAction(this.tableName, record.data.primaryKey, 2, 'Kayıt Güncelleme');
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
      } else if (record.data.receiptNo === '') {
        reject('Lütfen fiş numarası giriniz.');
      } else if (record.data.totalPrice <= 0) {
        reject('Tutar (+KDV) sıfırdan büyük olmalıdır.');
      } else if (isNullOrEmpty(record.data.recordDate)) {
        reject('Lütfen kayıt tarihi seçiniz.');
      } else if (record.orderDetailList.length === 0) {
        reject('Boş sipariş kaydedilemez.');
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
    if (model.receiptNo === undefined) {
      model.receiptNo = model.primaryKey; // boyle olsun
    }
    if (model.deliveryAddressPrimaryKey === undefined) {
      model.deliveryAddressPrimaryKey = cleanModel.deliveryAddressPrimaryKey;
    }
    if (model.campaignPrimaryKey === undefined) {
      model.campaignPrimaryKey = cleanModel.campaignPrimaryKey;
    }
    if (model.campaignQuantity === undefined) {
      model.campaignQuantity = cleanModel.campaignQuantity;
    }
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
    returnData.campaignPrimaryKey = '-1'; // packet
    returnData.campaignQuantity = 0;
    returnData.receiptNo = '';
    returnData.description = '';
    returnData.type = 'sales'; // sales, service, return
    returnData.status = 'waitingForApprove'; // waitingForApprove, approved, rejected, closed, done, portion
    returnData.platform = 'web'; // mobile, web
    returnData.approverPrimaryKey = '-1';
    returnData.approveDate = 0;
    returnData.insertDate = Date.now();
    returnData.recordDate = Date.now();
    returnData.totalPriceWithoutDiscount = 0;
    returnData.totalDetailDiscount = 0;
    returnData.totalPrice = 0;
    returnData.generalDiscountValue = 0;
    returnData.generalDiscount = 0;
    returnData.totalPriceWithTax = 0;

    return returnData;
  }

  clearMainModel(): SalesOrderMainModel {
    const returnData = new SalesOrderMainModel();
    returnData.data = this.clearSubModel();
    returnData.customer = this.cusService.clearMainModel();
    returnData.actionType = 'added';
    returnData.priceListName = '';
    returnData.discountListName = '';
    returnData.deliveryAddressName = '';
    returnData.storageName = '';
    returnData.termName = '';
    returnData.paymentName = '';
    returnData.approverName = '';
    returnData.statusTr = getStatus().get(returnData.data.status);
    returnData.orderTypeTr = getOrderType().get(returnData.data.type);
    returnData.platformTr = returnData.data.platform === 'web' ? 'Web' : 'Mobil';
    returnData.totalPriceWithoutDiscountFormatted = currencyFormat(returnData.data.totalPriceWithoutDiscount); // ham tutar
    returnData.totalDetailDiscountFormatted = currencyFormat(returnData.data.totalDetailDiscount); // detayda uygulanan toplam iskonto
    returnData.totalPriceFormatted = currencyFormat(returnData.data.totalPrice); // iskonto dusulmus toplam fiyat
    returnData.generalDiscountFormatted = currencyFormat(returnData.data.generalDiscount); // genel iskonto tutari
    returnData.totalPriceWithTaxFormatted = currencyFormat(returnData.data.totalPriceWithTax); // tum iskontolar dusulmus kdv eklenmis fiyat
    returnData.totalTaxAmount = 0; // toplam kdv miktari
    returnData.totalTaxAmountFormatted = currencyFormat(returnData.totalTaxAmount);
    return returnData;
  }

  convertMainModel(model: SalesOrderModel): SalesOrderMainModel {
    const returnData = this.clearMainModel();
    returnData.data = this.checkFields(model);
    returnData.statusTr = getStatus().get(returnData.data.status);
    returnData.orderTypeTr = getOrderType().get(returnData.data.type);
    returnData.totalPriceWithoutDiscountFormatted = currencyFormat(returnData.data.totalPriceWithoutDiscount);
    returnData.totalDetailDiscountFormatted = currencyFormat(returnData.data.totalDetailDiscount);
    returnData.totalPriceFormatted = currencyFormat(returnData.data.totalPrice);
    returnData.generalDiscountFormatted = currencyFormat(returnData.data.generalDiscount);
    returnData.totalPriceWithTaxFormatted = currencyFormat(returnData.data.totalPriceWithTax);
    returnData.totalTaxAmount = returnData.data.totalPriceWithTax - returnData.data.totalPrice;
    returnData.totalTaxAmountFormatted = currencyFormat(returnData.totalTaxAmount);
    return returnData;
  }

  getItem(primaryKey: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.collection(this.tableName).doc(primaryKey).get().toPromise().then(async doc => {
        if (doc.exists) {
          const data = doc.data() as SalesOrderModel;
          data.primaryKey = doc.id;

          const returnData = this.convertMainModel(data);
          returnData.data = this.checkFields(data);
          returnData.statusTr = getStatus().get(returnData.data.status);
          returnData.orderTypeTr = getOrderType().get(returnData.data.type);
          returnData.priceListName = '';
          returnData.discountListName = '';
          returnData.deliveryAddressName = '';
          returnData.storageName = '';
          returnData.termName = '';
          returnData.paymentName = '';

          const d1 = await this.cusService.getItem(returnData.data.customerPrimaryKey);
          returnData.customer = this.cusService.convertMainModel(d1.data);

          /*const d2 = await this.plService.getItem(returnData.data.priceListPrimaryKey);
          returnData.priceListName = d2.returnData.data.listName;

          const d3 = await this.dService.getItem(returnData.data.discountListPrimaryKey);
          returnData.discountListName = d3.returnData.data.listName;

          const d4 = await this.defService.getItem(returnData.data.storagePrimaryKey);
          returnData.storageName = d4.returnData.data.custom1;

          const d5 = await this.defService.getItem(returnData.data.termPrimaryKey);
          returnData.termName = d5.returnData.data.custom1;

          const d6 = await this.defService.getItem(returnData.data.paymentTypePrimaryKey);
          returnData.paymentName = d6.returnData.data.custom1;*/

          const d7 = await this.daService.getItem(returnData.data.deliveryAddressPrimaryKey);
          returnData.deliveryAddressName = d7 != null ? d7.returnData.data.addressName : '';

          const d8 = await this.eService.getItem(returnData.data.approverPrimaryKey, false);
          returnData.approverName = d8 != null ? d8.returnData.data.longName : '';

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

        const returnData = this.convertMainModel(data);
        returnData.data = this.checkFields(data);
        returnData.actionType = change.type;

        return this.db.collection('tblCustomer').doc(data.customerPrimaryKey).valueChanges()
          .pipe(map((customer: CustomerModel) => {
            returnData.customer = customer !== undefined ? this.cusService.convertMainModel(customer) : undefined;
            return Object.assign({returnData});
          }));
      });
    }), mergeMap(feeds => combineLatest(feeds)));
    return this.mainList$;
  }

  getMainItemsBetweenDates(startDate: Date, endDate: Date, status: Array<string>): Observable<SalesOrderMainModel[]> {
    this.listCollection = this.db.collection(this.tableName, ref => {
      let query: CollectionReference | Query = ref;
      query = query.orderBy('insertDate').where('userPrimaryKey', '==', this.authService.getUid());
      if (startDate !== null) {
        query = query.startAt(startDate.getTime());
      }
      if (endDate !== null) {
        query = query.endAt(endDate.getTime());
      }
      if (status !== null) {
        query = query.where('status', 'in', status);
      }
      return query;
    });

    this.mainList$ = this.listCollection.stateChanges().pipe(map(changes => {
      return changes.map(change => {
        const data = change.payload.doc.data() as SalesOrderModel;
        data.primaryKey = change.payload.doc.id;

        const returnData = this.convertMainModel(data);
        returnData.data = this.checkFields(data);
        returnData.actionType = change.type;

        return this.db.collection('tblCustomer').doc(data.customerPrimaryKey).valueChanges()
          .pipe(map((customer: CustomerModel) => {
            returnData.customer = customer !== undefined ? this.cusService.convertMainModel(customer) : undefined;
            return Object.assign({returnData});
          }));
      });
    }), mergeMap(feeds => combineLatest(feeds)));
    return this.mainList$;
  }

  getOrdersMain = async (customerPrimaryKey: string, type: string):
    Promise<Array<SalesOrderMainModel>> => new Promise(async (resolve, reject): Promise<void> => {
    try {
      const list = Array<SalesOrderMainModel>();
      await this.db.collection(this.tableName, ref => {
        let query: CollectionReference | Query = ref;
        query = query
          .where('userPrimaryKey', '==', this.authService.getUid())
          .where('customerPrimaryKey', '==', customerPrimaryKey)
          .where('status', '==', 'approved')
          .where('type', '==', type);
        return query;
      }).get()
        .subscribe(snapshot => {
          snapshot.forEach(async doc => {
            const data = doc.data() as SalesOrderModel;
            data.primaryKey = doc.id;
            list.push(this.convertMainModel(data));
          });
          resolve(list);
        });

    } catch (error) {
      console.error(error);
      reject({message: 'Error: ' + error});
    }
  })

  isOrderHasShortProduct = async (salesOrderPrimaryKey: string):
    Promise<boolean> => new Promise(async (resolve, reject): Promise<void> => {
    try {
      this.db.collection('tblSalesOrderDetail', ref => {
        let query: CollectionReference | Query = ref;
        query = query.where('orderPrimaryKey', '==', salesOrderPrimaryKey)
          .where('invoicedStatus', '==', 'short');
        return query;
      }).get().toPromise().then(snapshot => {
        if (snapshot.size > 0) {
          resolve(true);
        } else {
          resolve(false);
        }
      });
    } catch (error) {
      console.error(error);
      reject({message: 'Error: ' + error});
    }
  })

  isOrderHasCompleteProduct = async (salesOrderPrimaryKey: string):
    Promise<boolean> => new Promise(async (resolve, reject): Promise<void> => {
    try {
      this.db.collection('tblSalesOrderDetail', ref => {
        let query: CollectionReference | Query = ref;
        query = query.where('orderPrimaryKey', '==', salesOrderPrimaryKey)
          .where('invoicedStatus', '==', 'complete');
        return query;
      }).get().toPromise().then(snapshot => {
        if (snapshot.size > 0) {
          resolve(true);
        } else {
          resolve(false);
        }
      });
    } catch (error) {
      console.error(error);
      reject({message: 'Error: ' + error});
    }
  })

}
