import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection, CollectionReference, Query } from '@angular/fire/firestore';
import { Observable } from 'rxjs/Observable';
import { CustomerModel } from '../models/customer-model';
import { map, mergeMap } from 'rxjs/operators';
import { combineLatest } from 'rxjs';
import { AuthenticationService } from './authentication.service';
import { LogService } from './log.service';
import { ProfileService } from './profile.service';
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
import { CustomerService } from './customer.service';
import { AccountTransactionService } from './account-transaction.service';
import { ActionService } from './action.service';
import { PriceListService } from './price-list.service';
import { DiscountListService } from './discount-list.service';
import { DefinitionService } from './definition.service';
import { DeliveryAddressService } from './delivery-address.service';
import { SettingService } from './setting.service';
import { PurchaseOrderModel } from '../models/purchase-order-model';
import { PurchaseOrderMainModel } from '../models/purchase-order-main-model';
import { PurchaseOrderDetailService } from './purchase-order-detail.service';

@Injectable({
  providedIn: 'root'
})
export class PurchaseOrderService {
  listCollection: AngularFirestoreCollection<PurchaseOrderModel>;
  mainList$: Observable<PurchaseOrderMainModel[]>;
  employeeMap = new Map();
  tableName = 'tblPurchaseOrder';

  constructor(protected authService: AuthenticationService, protected cusService: CustomerService,
              protected logService: LogService, protected eService: ProfileService, protected db: AngularFirestore,
              protected atService: AccountTransactionService, protected sService: SettingService,
              protected actService: ActionService, protected sodService: PurchaseOrderDetailService, protected plService: PriceListService,
              protected dService: DiscountListService, protected daService: DeliveryAddressService, protected defService: DefinitionService) {
    this.listCollection = this.db.collection(this.tableName);
  }

  async removeItem(record: PurchaseOrderMainModel) {
    return await this.db.collection(this.tableName).doc(record.data.primaryKey).delete()
      .then(async () => {
        for (const item of record.orderDetailList) {
          await this.db.collection(this.sodService.tableName).doc(item.data.primaryKey).delete();
        }
        this.actService.removeActions(this.tableName, record.data.primaryKey);
        await this.logService.addTransactionLog(record, 'delete', 'purchaseOrder');
      });
  }

  async updateItem_old(record: PurchaseOrderMainModel) {
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
              if (record.data.status === 'approved') {
                await this.logService.addTransactionLog(record, 'approved', 'purchaseOrder');
              } else {
                await this.logService.addTransactionLog(record, 'update', 'purchaseOrder');
              }
            });
        } else if (record.data.status === 'rejected') {
          await this.logService.addTransactionLog(record, 'rejected', 'purchaseOrder');
        } else if (record.data.status === 'closed') {
          for (const item of record.orderDetailList) {
            item.data.invoicedStatus = 'complete';
            await this.sodService.updateItem(item);
          }
          await this.logService.addTransactionLog(record, 'closed', 'purchaseOrder');
        } else if (record.data.status === 'done') {
          await this.logService.addTransactionLog(record, 'done', 'purchaseOrder');
        } else {
          await this.logService.addTransactionLog(record, 'update', 'purchaseOrder');
        }
      });
  }

  async updateItem(record: PurchaseOrderMainModel) {
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
                item.data.orderPrimaryKey = record.data.primaryKey;
                await this.db.collection(this.sodService.tableName).doc(item.data.primaryKey).set(Object.assign({}, item.data));
              }
            });
        }
      })
      .finally(async () => {
        if (record.data.status === 'waitingForApprove') {
          await this.logService.addTransactionLog(record, 'update', 'purchaseOrder');
        } else if (record.data.status === 'approved') {
          await this.logService.addTransactionLog(record, 'approved', 'purchaseOrder');
        } else if (record.data.status === 'rejected') {
          await this.logService.addTransactionLog(record, 'rejected', 'purchaseOrder');
        } else if (record.data.status === 'closed') {
          for (const item of record.orderDetailList) {
            item.data.invoicedStatus = 'complete';
            await this.sodService.updateItem(item);
          }
          await this.logService.addTransactionLog(record, 'closed', 'purchaseOrder');
        } else if (record.data.status === 'done') {
          await this.logService.addTransactionLog(record, 'done', 'purchaseOrder');
        } else {
          await this.logService.addTransactionLog(record, 'update', 'purchaseOrder');
        }
      });
  }

  async setItem(record: PurchaseOrderMainModel, primaryKey: string) {
    return await this.listCollection.doc(primaryKey).set(Object.assign({}, record.data))
      .then(async () => {
        if (record.data.status === 'approved' || record.data.status === 'waitingForApprove') {
          await this.sodService.getItemsWithOrderPrimaryKey(record.data.primaryKey)
            .then((list) => {
              list.forEach(async item => {
                await this.db.collection(this.sodService.tableName).doc(item.primaryKey).delete();
              });
            }).finally(async () => {
              for (const item of record.orderDetailList) {
                item.data.orderPrimaryKey = record.data.primaryKey;
                await this.db.collection(this.sodService.tableName).doc(item.data.primaryKey).set(Object.assign({}, item.data));
              }
            });
        }
      })
      .finally(async () => {
        if (record.data.status === 'waitingForApprove') {
          await this.logService.addTransactionLog(record, 'insert', 'purchaseOrder');
        } else if (record.data.status === 'approved') {
          await this.logService.addTransactionLog(record, 'approved', 'purchaseOrder');
        } else if (record.data.status === 'rejected') {
          await this.logService.addTransactionLog(record, 'rejected', 'purchaseOrder');
        } else if (record.data.status === 'closed') {
          for (const item of record.orderDetailList) {
            item.data.invoicedStatus = 'complete';
            await this.sodService.updateItem(item);
          }
          await this.logService.addTransactionLog(record, 'closed', 'purchaseOrder');
        } else if (record.data.status === 'done') {
          await this.logService.addTransactionLog(record, 'done', 'purchaseOrder');
        } else {
          await this.logService.addTransactionLog(record, 'update', 'purchaseOrder');
        }
      });
  }

  async setItem_old(record: PurchaseOrderMainModel, primaryKey: string) {
    return await this.listCollection.doc(primaryKey).set(Object.assign({}, record.data))
      .then(async () => {
        await this.sodService.getItemsWithOrderPrimaryKey(record.data.primaryKey)
          .then((list) => {
            list.forEach(async item => {
              await this.db.collection(this.sodService.tableName).doc(item.primaryKey).delete();
            });
          }).finally(async () => {
            for (const item of record.orderDetailList) {
              await this.db.collection(this.sodService.tableName).doc(item.data.primaryKey).set(Object.assign({}, item.data));
            }
            if (record.data.status === 'waitingForApprove') {
              await this.logService.addTransactionLog(record, 'insert', 'purchaseOrder');
            } else if (record.data.status === 'approved') {
              await this.logService.addTransactionLog(record, 'approved', 'purchaseOrder');
            } else if (record.data.status === 'rejected') {
              await this.logService.addTransactionLog(record, 'rejected', 'purchaseOrder');
            } else {
              // await this.logService.addTransactionLog(record, 'update', 'salesInvoice');
            }
          });
      });
  }

  checkForSave(record: PurchaseOrderMainModel): Promise<string> {
    return new Promise((resolve, reject) => {
      if (record.data.customerPrimaryKey === '-1') {
        reject('Lütfen müşteri seçiniz.');
      } else if (record.data.priceListPrimaryKey === '-1') {
        reject('Lütfen fiyat listesi seçiniz.');
      } else if (record.data.priceListPrimaryKey === '-1') {
        reject('Lütfen iskonto listesi seçiniz.');
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

  checkForRemove(record: PurchaseOrderMainModel): Promise<string> {
    return new Promise((resolve, reject) => {
      resolve(null);
    });
  }

  checkFields(model: PurchaseOrderModel): PurchaseOrderModel {
    const cleanModel = this.clearSubModel();
    if (model.storagePrimaryKey === undefined) { model.storagePrimaryKey = cleanModel.storagePrimaryKey; }
    return model;
  }

  clearSubModel(): PurchaseOrderModel {

    const returnData = new PurchaseOrderModel();
    returnData.primaryKey = null;
    returnData.userPrimaryKey = this.authService.getUid();
    returnData.employeePrimaryKey = this.authService.getEid();
    returnData.customerPrimaryKey = '-1';
    returnData.priceListPrimaryKey = '-1';
    returnData.discountListPrimaryKey = '-1';
    returnData.termPrimaryKey = '-1';
    returnData.paymentTypePrimaryKey = '-1';
    returnData.storagePrimaryKey = '-1';
    returnData.receiptNo = '';
    returnData.description = '';
    returnData.type = 'purchase'; // purchase, service, return
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

  clearMainModel(): PurchaseOrderMainModel {
    const returnData = new PurchaseOrderMainModel();
    returnData.data = this.clearSubModel();
    returnData.customer = this.cusService.clearMainModel();
    returnData.actionType = 'added';
    returnData.priceListName = '';
    returnData.discountListName = '';
    returnData.termName = '';
    returnData.paymentName = '';
    returnData.storageName = '';
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
    returnData.termList = [];
    return returnData;
  }

  convertMainModel(model: PurchaseOrderModel): PurchaseOrderMainModel {
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
    returnData.termList = [];
    return returnData;
  }

  getItem(primaryKey: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.collection(this.tableName).doc(primaryKey).get().toPromise().then(async doc => {
        if (doc.exists) {
          const data = doc.data() as PurchaseOrderModel;
          data.primaryKey = doc.id;

          const returnData = this.convertMainModel(data);
          returnData.data = this.checkFields(data);
          returnData.statusTr = getStatus().get(returnData.data.status);
          returnData.orderTypeTr = getOrderType().get(returnData.data.type);
          returnData.priceListName = '';
          returnData.discountListName = '';
          returnData.termName = '';
          returnData.paymentName = '';

          const d1 = await this.cusService.getItem(returnData.data.customerPrimaryKey);
          returnData.customer = this.cusService.convertMainModel(d1.data);

          const d8 = await this.eService.getItem(returnData.data.approverPrimaryKey, false);
          returnData.approverName = d8 != null ? d8.returnData.data.longName : '';

          resolve(Object.assign({ returnData }));
        } else {
          resolve(null);
        }
      });
    });
  }

  getMainItems(): Observable<PurchaseOrderMainModel[]> {
    this.listCollection = this.db.collection(this.tableName,
      ref => ref.orderBy('insertDate').where('userPrimaryKey', '==', this.authService.getUid()));
    this.mainList$ = this.listCollection.stateChanges().pipe(map(changes => {
      return changes.map(change => {
        const data = change.payload.doc.data() as PurchaseOrderModel;
        data.primaryKey = change.payload.doc.id;

        const returnData = this.convertMainModel(data);
        returnData.actionType = change.type;

        return this.db.collection('tblCustomer').doc(data.customerPrimaryKey).valueChanges()
          .pipe(map((customer: CustomerModel) => {
            returnData.customer = customer !== undefined ? this.cusService.convertMainModel(customer) : undefined;
            return Object.assign({ returnData });
          }));
      });
    }), mergeMap(feeds => combineLatest(feeds)));
    return this.mainList$;
  }

  getMainItemsBetweenDates(startDate: Date, endDate: Date, status: Array<string>): Observable<PurchaseOrderMainModel[]> {
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
        const data = change.payload.doc.data() as PurchaseOrderModel;
        data.primaryKey = change.payload.doc.id;

        const returnData = this.convertMainModel(data);
        returnData.actionType = change.type;

        return this.db.collection('tblCustomer').doc(data.customerPrimaryKey).valueChanges()
          .pipe(map((customer: CustomerModel) => {
            returnData.customer = customer !== undefined ? this.cusService.convertMainModel(customer) : undefined;
            return Object.assign({ returnData });
          }));
      });
    }), mergeMap(feeds => combineLatest(feeds)));
    return this.mainList$;
  }

  getOrdersMain = async (customerPrimaryKey: string, type: string):
    Promise<Array<PurchaseOrderMainModel>> => new Promise(async (resolve, reject): Promise<void> => {
      try {
        const list = Array<PurchaseOrderMainModel>();
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
              const data = doc.data() as PurchaseOrderModel;
              data.primaryKey = doc.id;
              list.push(this.convertMainModel(data));
            });
            resolve(list);
          });

      } catch (error) {
        console.error(error);
        reject({ message: 'Error: ' + error });
      }
    })

  isOrderHasShortProduct = async (purchaseOrderPrimaryKey: string):
    Promise<boolean> => new Promise(async (resolve, reject): Promise<void> => {
      try {
        this.db.collection('tblPurchaseOrderDetail', ref => {
          let query: CollectionReference | Query = ref;
          query = query.where('orderPrimaryKey', '==', purchaseOrderPrimaryKey)
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
        reject({ message: 'Error: ' + error });
      }
    })

  isOrderHasCompleteProduct = async (purchaseOrderPrimaryKey: string):
    Promise<boolean> => new Promise(async (resolve, reject): Promise<void> => {
      try {
        this.db.collection('tblPurchaseOrderDetail', ref => {
          let query: CollectionReference | Query = ref;
          query = query.where('orderPrimaryKey', '==', purchaseOrderPrimaryKey)
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
        reject({ message: 'Error: ' + error });
      }
    })

}
