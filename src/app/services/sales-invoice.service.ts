import { StockTransactionService } from './stock-transaction.service';
import { TermService } from './term.service';
import {Injectable} from '@angular/core';
import {AngularFirestore, AngularFirestoreCollection, CollectionReference, Query} from '@angular/fire/firestore';
import {Observable} from 'rxjs/Observable';
import {CustomerModel} from '../models/customer-model';
import {map, mergeMap} from 'rxjs/operators';
import {combineLatest} from 'rxjs';
import {SalesInvoiceModel} from '../models/sales-invoice-model';
import {AuthenticationService} from './authentication.service';
import {LogService} from './log.service';
import {SettingService} from './setting.service';
import {SalesInvoiceMainModel} from '../models/sales-invoice-main-model';
import {ProfileService} from './profile.service';
import {currencyFormat, getInvoiceType, getStatus, isNullOrEmpty} from '../core/correct-library';
import {CustomerService} from './customer.service';
import {CustomerAccountModel} from '../models/customer-account-model';
import {CustomerAccountService} from './customer-account.service';
import {AccountTransactionService} from './account-transaction.service';
import {ActionService} from './action.service';
import {SalesInvoiceDetailService} from './sales-invoice-detail.service';
import {SalesOrderDetailService} from './sales-order-detail.service';
import {SalesOrderService} from './sales-order.service';
import {SalesOrderMainModel} from '../models/sales-order-main-model';

@Injectable({
  providedIn: 'root'
})
export class SalesInvoiceService {
  listCollection: AngularFirestoreCollection<SalesInvoiceModel>;
  mainList$: Observable<SalesInvoiceMainModel[]>;
  customerList$: Observable<CustomerModel[]>;
  accountList$: Observable<CustomerAccountModel[]>;
  employeeMap = new Map();
  customerMap = new Map();
  accountMap = new Map();
  tableName = 'tblSalesInvoice';

  constructor(protected authService: AuthenticationService, protected sService: SettingService, protected cusService: CustomerService,
              protected logService: LogService, protected eService: ProfileService, protected db: AngularFirestore,
              protected accService: CustomerAccountService, protected atService: AccountTransactionService, protected sodService: SalesOrderDetailService,
              protected actService: ActionService, protected sidService: SalesInvoiceDetailService, public soService: SalesOrderService,
              protected termService: TermService, protected stService: StockTransactionService) {
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
          this.customerMap.set(item.primaryKey, item);
        });
      });
      this.accService.getAllItems(null).toPromise().then(list => {
        this.accountMap.clear();
        list.forEach(item => {
          this.accountMap.set(item.primaryKey, item);
        });
      });
    }
  }

  async setItem(record: SalesInvoiceMainModel, primaryKey: string) {
    return await this.listCollection.doc(primaryKey).set(Object.assign({}, record.data))
      .then(async () => {
        if (record.data.status === 'waitingForApprove' || record.data.status === 'approved') {
          await this.sidService.getItemsWithInvoicePrimaryKey(record.data.primaryKey)
          .then((list) => {
            list.forEach(async item => {
              await this.db.collection(this.sidService.tableName).doc(item.primaryKey).delete();
            });
          }).finally(async () => {
            for (const item of record.invoiceDetailList) {
              item.data.invoicePrimaryKey = record.data.primaryKey;
              item.invoiceStatus = record.data.status;
              await this.sidService.setItem(item, item.data.primaryKey);
            }
          });

          await this.termService.getItemsWithInvoicePrimaryKey(record.data.primaryKey)
          .then((list) => {
            list.forEach(async item => {
              await this.db.collection(this.termService.tableName).doc(item.primaryKey).delete();
            });
          }).finally(async () => {
            for (const item of record.termList) {
              item.invoicePrimaryKey = record.data.primaryKey;
              await this.termService.setItem(item, item.primaryKey);
            }
          });
        }
        if (record.data.status === 'waitingForApprove') {
          await this.logService.addTransactionLog(record, 'insert', 'salesInvoice');
          await this.sService.increaseSalesInvoiceNumber();
          this.actService.addAction(this.tableName, record.data.primaryKey, 1, 'Kayıt Oluşturma');
        } else if (record.data.status === 'approved') {
          for (const item of record.termList) {
            const trans = this.atService.clearSubModel();
            trans.primaryKey = item.primaryKey;
            trans.receiptNo = record.data.receiptNo;
            trans.transactionPrimaryKey = record.data.primaryKey;
            trans.parentPrimaryKey = record.data.customerCode;
            trans.parentType = 'customer';
            trans.accountPrimaryKey = record.data.accountPrimaryKey;
            trans.cashDeskPrimaryKey = '-1';
            trans.amount = record.data.type === 'return' ? item.termAmount : item.termAmount * -1;
            trans.amountType = record.data.type === 'return' ? 'credit' : 'debit';
            trans.insertDate = record.data.insertDate;
            trans.termDate = item.termDate;
            trans.transactionType = 'salesInvoice';
            if (record.data.type === 'sales') {
              trans.transactionSubType = 'salesInvoice';
            }
            if (record.data.type === 'return') {
              trans.transactionSubType = 'returnSalesInvoice';
            }
            if (record.data.type === 'service') {
              trans.transactionSubType = 'serviceSalesInvoice';
            }
            await this.atService.setItem(trans, trans.primaryKey);
          }
          for (const orderPrimaryKey of record.data.orderPrimaryKeyList) {
            await this.soService.isOrderHasShortProduct(orderPrimaryKey).then(value => {
              // faturalanan siparislerin detayinda tum kalemler faturalanir ise  done ,faturalanmaz ise portion durumuna guncellenir.
              this.soService.getItem(orderPrimaryKey).then(item => {
                const order = item.returnData as SalesOrderMainModel;
                order.data.status = value ? 'portion' : 'done';
                this.soService.updateItem(order);
              });
            });
          }
          if (record.data.isWaybill) {
            for (const item of record.invoiceDetailList) {
              if (item.product.data.stockType === 'normal' || item.product.data.stockType === 'promotion') {
                const st = this.stService.clearMainModel();
                st.data.primaryKey = this.db.createId();
                st.data.productPrimaryKey = item.data.productPrimaryKey;
                st.data.transactionPrimaryKey = record.data.primaryKey;
                st.data.receiptNo = record.data.receiptNo;
                st.data.transactionType = 'salesInvoice';
                if (record.data.type === 'sales') {
                  st.data.transactionSubType = 'salesInvoice';
                  st.data.quantity = item.data.quantity * -1;
                  st.data.amount = item.data.price * -1;
                }
                if (record.data.type === 'return') {
                  st.data.transactionSubType = 'returnSalesInvoice';
                  st.data.quantity = item.data.quantity;
                  st.data.amount = item.data.price;
                }
                st.data.insertDate = Date.now();
                await this.stService.setItem(st, st.data.primaryKey);
              }
            }
          }
          await this.logService.addTransactionLog(record, 'approved', 'salesInvoice');
          this.actService.addAction(this.tableName, record.data.primaryKey, 1, 'Kayıt Onay');
        } else if (record.data.status === 'rejected') {
          await this.logService.addTransactionLog(record, 'rejected', 'salesInvoice');
        } else if (record.data.status === 'canceled') {
          for (const item of record.termList) {
            const trans = this.atService.clearSubModel();
            trans.primaryKey = item.primaryKey;
            trans.receiptNo = record.data.receiptNo;
            trans.transactionPrimaryKey = record.data.primaryKey;
            trans.parentPrimaryKey = record.data.customerCode;
            trans.parentType = 'customer';
            trans.accountPrimaryKey = record.data.accountPrimaryKey;
            trans.cashDeskPrimaryKey = '-1';
            trans.amount = record.data.type === 'return' ? item.termAmount * -1 : item.termAmount;
            trans.amountType = record.data.type === 'return' ? 'debit' : 'credit';
            trans.insertDate = record.data.insertDate;
            trans.termDate = item.termDate;
            trans.transactionType = 'salesInvoice';
            if (record.data.type === 'sales') {
              trans.transactionSubType = 'cancelSalesInvoice';
            }
            if (record.data.type === 'return') {
              trans.transactionSubType = 'cancelReturnSalesInvoice';
            }
            if (record.data.type === 'service') {
              trans.transactionSubType = 'cancelServiceSalesInvoice';
            }
            await this.atService.setItem(trans, trans.primaryKey);
          }
          for (const item of record.invoiceDetailList) {
            this.db.collection('tblSalesOrderDetail').doc(item.data.orderDetailPrimaryKey).get().toPromise()
              .then(async doc => {
                // siparis detayinda faturalanan miktar kadar acilir ve statusu shorta cekilir
                const orderInvoicedQuantity = doc.data().invoicedQuantity;
                await doc.ref.update( { invoicedQuantity: orderInvoicedQuantity - item.data.quantity, invoicedStatus: 'short' });
              });
          }
          for (const orderPrimaryKey of record.data.orderPrimaryKeyList) {
            // const shortDataBool = await this.soService.isOrderHasShortProduct(orderPrimaryKey);
            // const completeDataBool = await this.soService.isOrderHasCompleteProduct(orderPrimaryKey);

            // eger sipariste faturalanan miktar var ise portion durumuna, yoksa approved durumuna cevrilir.
            let isHasInvoicedQuantity = false;
            const list = await this.sodService.getMainItemsWithOrderPrimaryKey(orderPrimaryKey);
            list.forEach(item => {
              if (item.data.invoicedQuantity > 0) {
                isHasInvoicedQuantity = true;
              }
            });
            if (isHasInvoicedQuantity) {
              await this.db.firestore.collection(this.soService.tableName).doc(orderPrimaryKey).update({ status: 'portion' });
            } else {
              await this.db.firestore.collection(this.soService.tableName).doc(orderPrimaryKey).update({ status: 'approved' });
            }
          }
          if (record.data.isWaybill) {
            for (const item of record.invoiceDetailList) {
              if (item.product.data.stockType === 'normal' || item.product.data.stockType === 'promotion') {
                const st = this.stService.clearMainModel();
                st.data.primaryKey = this.db.createId();
                st.data.productPrimaryKey = item.data.productPrimaryKey;
                st.data.transactionPrimaryKey = record.data.primaryKey;
                st.data.receiptNo = record.data.receiptNo;
                st.data.transactionType = 'salesInvoice';
                if (record.data.type === 'sales') {
                  st.data.transactionSubType = 'cancelSalesInvoice';
                  st.data.quantity = item.data.quantity;
                  st.data.amount = item.data.price;
                }
                if (record.data.type === 'return') {
                  st.data.transactionSubType = 'cancelReturnSalesInvoice';
                  st.data.quantity = item.data.quantity * -1;
                  st.data.amount = item.data.price * -1;
                }
                st.data.insertDate = Date.now();
                await this.stService.setItem(st, st.data.primaryKey);
              }
            }
          }
          await this.logService.addTransactionLog(record, 'canceled', 'salesInvoice');
          this.actService.addAction(this.tableName, record.data.primaryKey, 1, 'Kayıt İptal Edildi');
        } else {
          // await this.logService.addTransactionLog(record, 'update', 'salesInvoice');
        }
      });
  }

  async removeItem(record: SalesInvoiceMainModel) {
    return await this.db.collection(this.tableName).doc(record.data.primaryKey).delete()
      .then(async () => {
        for (const item of record.invoiceDetailList) {
          await this.db.collection(this.sidService.tableName).doc(item.data.primaryKey).delete();
        }
        for (const item of record.termList) {
          await this.db.collection(this.termService.tableName).doc(item.primaryKey).delete();
          await this.atService.removeItem(null, item.primaryKey);
        }
        this.actService.removeActions(this.tableName, record.data.primaryKey);
        this.logService.addTransactionLog(record, 'delete', 'salesInvoice');
      });
  }

  async updateItem(record: SalesInvoiceMainModel) {
    return await this.db.collection(this.tableName).doc(record.data.primaryKey).update(Object.assign({}, record.data))
      .then(async () => {
        if (record.data.status === 'waitingForApprove' || record.data.status === 'approved') {
          await this.sidService.getItemsWithInvoicePrimaryKey(record.data.primaryKey)
          .then((list) => {
            list.forEach(async item => {
              await this.db.collection(this.sidService.tableName).doc(item.primaryKey).delete();
            });
          }).finally(async () => {
            for (const item of record.invoiceDetailList) {
              item.data.invoicePrimaryKey = record.data.primaryKey;
              item.invoiceStatus = record.data.status;
              await this.sidService.setItem(item, item.data.primaryKey);
            }
          });

          await this.termService.getItemsWithInvoicePrimaryKey(record.data.primaryKey)
          .then((list) => {
            list.forEach(async item => {
              await this.db.collection(this.termService.tableName).doc(item.primaryKey).delete();
            });
          }).finally(async () => {
            for (const item of record.termList) {
              item.invoicePrimaryKey = record.data.primaryKey;
              await this.termService.setItem(item, item.primaryKey);
            }
          });
        }
        if (record.data.status === 'waitingForApprove') {
          this.logService.addTransactionLog(record, 'update', 'salesInvoice');
          this.actService.addAction(this.tableName, record.data.primaryKey, 1, 'Kayıt Güncelleme');
        } else if (record.data.status === 'approved') {
          for (const item of record.termList) {
            const trans = this.atService.clearSubModel();
            trans.primaryKey = item.primaryKey;
            trans.receiptNo = record.data.receiptNo;
            trans.transactionPrimaryKey = record.data.primaryKey;
            trans.parentPrimaryKey = record.data.customerCode;
            trans.parentType = 'customer';
            trans.accountPrimaryKey = record.data.accountPrimaryKey;
            trans.cashDeskPrimaryKey = '-1';
            trans.amount = record.data.type === 'return' ? item.termAmount : item.termAmount * -1;
            trans.amountType = record.data.type === 'return' ? 'credit' : 'debit';
            trans.insertDate = record.data.insertDate;
            trans.termDate = item.termDate;
            trans.transactionType = 'salesInvoice';
            if (record.data.type === 'sales') {
              trans.transactionSubType = 'salesInvoice';
            }
            if (record.data.type === 'return') {
              trans.transactionSubType = 'returnSalesInvoice';
            }
            if (record.data.type === 'service') {
              trans.transactionSubType = 'serviceSalesInvoice';
            }
            await this.atService.setItem(trans, trans.primaryKey);
          }
          for (const orderPrimaryKey of record.data.orderPrimaryKeyList) {
            await this.soService.isOrderHasShortProduct(orderPrimaryKey).then(value => {
              // faturalanan siparislerin detayinda tum kalemler faturalanir ise  done ,faturalanmaz ise portion durumuna guncellenir.
              this.soService.getItem(orderPrimaryKey).then(item => {
                const order = item.returnData as SalesOrderMainModel;
                order.data.status = value ? 'portion' : 'done';
                this.soService.updateItem(order);
              });
            });
          }
          if (record.data.isWaybill) {
            for (const item of record.invoiceDetailList) {
              if (item.product.data.stockType === 'normal' || item.product.data.stockType === 'promotion') {
                const st = this.stService.clearMainModel();
                st.data.primaryKey = this.db.createId();
                st.data.productPrimaryKey = item.data.productPrimaryKey;
                st.data.transactionPrimaryKey = record.data.primaryKey;
                st.data.receiptNo = record.data.receiptNo;
                st.data.transactionType = 'salesInvoice';
                if (record.data.type === 'sales') {
                  st.data.transactionSubType = 'salesInvoice';
                  st.data.quantity = item.data.quantity * -1;
                  st.data.amount = item.data.price * -1;
                }
                if (record.data.type === 'return') {
                  st.data.transactionSubType = 'returnSalesInvoice';
                  st.data.quantity = item.data.quantity;
                  st.data.amount = item.data.price;
                }
                st.data.insertDate = Date.now();
                await this.stService.setItem(st, st.data.primaryKey);
              }
            }
          }
          this.logService.addTransactionLog(record, 'approved', 'salesInvoice');
          this.actService.addAction(this.tableName, record.data.primaryKey, 1, 'Kayıt Onaylandı');
        } else if (record.data.status === 'rejected') {
          this.logService.addTransactionLog(record, 'rejected', 'salesInvoice');
          this.actService.addAction(this.tableName, record.data.primaryKey, 1, 'Kayıt Geri Çevrildi');
        } else if (record.data.status === 'canceled') {
          for (const item of record.termList) {
            const trans = this.atService.clearSubModel();
            trans.primaryKey = item.primaryKey;
            trans.receiptNo = record.data.receiptNo;
            trans.transactionPrimaryKey = record.data.primaryKey;
            trans.parentPrimaryKey = record.data.customerCode;
            trans.parentType = 'customer';
            trans.accountPrimaryKey = record.data.accountPrimaryKey;
            trans.cashDeskPrimaryKey = '-1';
            trans.amount = record.data.type === 'return' ? item.termAmount * -1 : item.termAmount;
            trans.amountType = record.data.type === 'return' ? 'debit' : 'credit';
            trans.insertDate = record.data.insertDate;
            trans.termDate = item.termDate;
            trans.transactionType = 'salesInvoice';
            if (record.data.type === 'sales') {
              trans.transactionSubType = 'cancelSalesInvoice';
            }
            if (record.data.type === 'return') {
              trans.transactionSubType = 'cancelReturnSalesInvoice';
            }
            if (record.data.type === 'service') {
              trans.transactionSubType = 'cancelServiceSalesInvoice';
            }
            await this.atService.setItem(trans, trans.primaryKey);
          }
          for (const item of record.invoiceDetailList) {
            this.db.collection('tblSalesOrderDetail').doc(item.data.orderDetailPrimaryKey).get().toPromise()
              .then(async doc => {
                // siparis detayinda faturalanan miktar kadar acilir ve statusu shorta cekilir
                const orderInvoicedQuantity = doc.data().invoicedQuantity;
                await doc.ref.update( { invoicedQuantity: orderInvoicedQuantity - item.data.quantity, invoicedStatus: 'short' });
              });
          }
          for (const orderPrimaryKey of record.data.orderPrimaryKeyList) {
            // const shortDataBool = await this.soService.isOrderHasShortProduct(orderPrimaryKey);
            // const completeDataBool = await this.soService.isOrderHasCompleteProduct(orderPrimaryKey);

            // eger sipariste faturalanan miktar var ise portion durumuna, yoksa approved durumuna cevrilir.
            let isHasInvoicedQuantity = false;
            const list = await this.sodService.getMainItemsWithOrderPrimaryKey(orderPrimaryKey);
            list.forEach(item => {
              if (item.data.invoicedQuantity > 0) {
                isHasInvoicedQuantity = true;
              }
            });
            if (isHasInvoicedQuantity) {
              await this.db.firestore.collection(this.soService.tableName).doc(orderPrimaryKey).update({ status: 'portion' });
            } else {
              await this.db.firestore.collection(this.soService.tableName).doc(orderPrimaryKey).update({ status: 'approved' });
            }
          }
          if (record.data.isWaybill) {
            for (const item of record.invoiceDetailList) {
              if (item.product.data.stockType === 'normal' || item.product.data.stockType === 'promotion') {
                const st = this.stService.clearMainModel();
                st.data.primaryKey = this.db.createId();
                st.data.productPrimaryKey = item.data.productPrimaryKey;
                st.data.transactionPrimaryKey = record.data.primaryKey;
                st.data.receiptNo = record.data.receiptNo;
                st.data.transactionType = 'salesInvoice';
                if (record.data.type === 'sales') {
                  st.data.transactionSubType = 'cancelSalesInvoice';
                  st.data.quantity = item.data.quantity;
                  st.data.amount = item.data.price;
                }
                if (record.data.type === 'return') {
                  st.data.transactionSubType = 'cancelReturnSalesInvoice';
                  st.data.quantity = item.data.quantity * -1;
                  st.data.amount = item.data.price * -1;
                }
                st.data.insertDate = Date.now();
                await this.stService.setItem(st, st.data.primaryKey);
              }
            }
          }
          this.logService.addTransactionLog(record, 'canceled', 'salesInvoice');
          this.actService.addAction(this.tableName, record.data.primaryKey, 1, 'Kayıt İptal Edildi');
        } else {
          this.logService.addTransactionLog(record, 'update', 'salesInvoice');
          this.actService.addAction(this.tableName, record.data.primaryKey, 2, 'Kayıt Güncelleme');
        }
      });
  }

  checkForSave(record: SalesInvoiceMainModel): Promise<string> {
    return new Promise((resolve, reject) => {
      if (record.invoiceDetailList.length === 0) {
        reject('Boş fatura kaydedilemez.');
      } else if (record.data.customerCode === '' || record.data.customerCode === '-1') {
        reject('Lütfen müşteri seçiniz.');
      } else if (record.data.accountPrimaryKey === '' || record.data.accountPrimaryKey === '-1') {
        reject('Lütfen hesap seçiniz.');
      } else if (record.data.receiptNo === '') {
        reject('Lütfen fiş numarası seçiniz.');
      } else if (record.data.type === '' || record.data.type === '-1') {
        reject('Lütfen fatura tipi seçiniz.');
      } else if (record.data.totalPrice <= 0) {
        reject('Tutar sıfırdan büyük olmalıdır.');
      } else if (record.data.totalPriceWithTax <= 0) {
        reject('Tutar (+KDV) sıfırdan büyük olmalıdır.');
      } else if (isNullOrEmpty(record.data.recordDate)) {
        reject('Lütfen kayıt tarihi seçiniz.');
      } else {
        resolve(null);
      }
    });
  }

  checkForRemove(record: SalesInvoiceMainModel): Promise<string> {
    return new Promise((resolve, reject) => {
      resolve(null);
    });
  }

  checkFields(model: SalesInvoiceModel): SalesInvoiceModel {
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
    if (model.receiptNo === undefined) {
      model.receiptNo = cleanModel.receiptNo;
    }
    if (model.type === undefined) {
      model.type = cleanModel.type;
    }
    if (model.totalPrice === undefined) {
      model.totalPrice = cleanModel.totalPrice;
    }
    if (model.totalPriceWithTax === undefined) {
      model.totalPriceWithTax = cleanModel.totalPriceWithTax;
    }
    if (model.description === undefined) {
      model.description = cleanModel.description;
    }
    if (model.status === undefined) {
      model.status = cleanModel.status;
    }
    if (model.platform === undefined) {
      model.platform = cleanModel.platform;
    }
    if (model.approveByPrimaryKey === undefined) {
      model.approveByPrimaryKey = model.employeePrimaryKey;
    }
    if (model.approveDate === undefined) {
      model.approveDate = model.insertDate;
    }
    if (model.recordDate === undefined) {
      model.recordDate = model.insertDate;
    }
    if (model.isWaybill === undefined) {
      model.isWaybill = cleanModel.isWaybill;
    }
    if (model.storagePrimaryKey === undefined) {
      model.storagePrimaryKey = cleanModel.storagePrimaryKey;
    }

    return model;
  }

  clearSubModel(): SalesInvoiceModel {

    const returnData = new SalesInvoiceModel();
    returnData.primaryKey = null;
    returnData.userPrimaryKey = this.authService.getUid();
    returnData.employeePrimaryKey = this.authService.getEid();
    returnData.customerCode = '';
    returnData.accountPrimaryKey = '-1';
    returnData.storagePrimaryKey = '-1';
    returnData.receiptNo = '';
    returnData.type = 'sales';
    returnData.description = '';
    returnData.status = 'waitingForApprove'; // waitingForApprove, approved, rejected, canceled
    returnData.approveByPrimaryKey = '-1';
    returnData.approveDate = 0;
    returnData.platform = 'web'; // mobile, web
    returnData.isWaybill = false;
    returnData.insertDate = Date.now();
    returnData.recordDate = Date.now();
    returnData.totalPriceWithoutDiscount = 0;
    returnData.totalDetailDiscount = 0;
    returnData.totalPrice = 0;
    returnData.generalDiscountValue = 0;
    returnData.generalDiscount = 0;
    returnData.totalPriceWithTax = 0;
    returnData.orderPrimaryKeyList = [];

    return returnData;
  }

  clearMainModel(): SalesInvoiceMainModel {
    const returnData = new SalesInvoiceMainModel();
    returnData.data = this.clearSubModel();
    returnData.customer = this.cusService.clearMainModel();
    returnData.employeeName = this.employeeMap.get(returnData.data.employeePrimaryKey);
    returnData.actionType = 'added';
    returnData.statusTr = getStatus().get(returnData.data.status);
    returnData.typeTr = getInvoiceType().get(returnData.data.type);
    returnData.platformTr = returnData.data.platform === 'web' ? 'Web' : 'Mobil';
    returnData.isWaybillTr = returnData.data.isWaybill ? 'İrsaliyeli Fatura' : 'İrsaliyesiz Fatura';
    returnData.totalPriceWithoutDiscountFormatted = currencyFormat(returnData.data.totalPriceWithoutDiscount); // ham tutar
    returnData.totalDetailDiscountFormatted = currencyFormat(returnData.data.totalDetailDiscount); // detayda uygulanan toplam iskonto
    returnData.totalPriceFormatted = currencyFormat(returnData.data.totalPrice); // iskonto dusulmus toplam fiyat
    returnData.generalDiscountFormatted = currencyFormat(returnData.data.generalDiscount); // genel iskonto tutari
    returnData.totalPriceWithTaxFormatted = currencyFormat(returnData.data.totalPriceWithTax); // tum iskontolar dusulmus kdv eklenmis fiyat
    returnData.totalTaxAmount = returnData.data.totalPriceWithTax - returnData.data.totalPrice;
    returnData.totalTaxAmountFormatted = currencyFormat(returnData.totalTaxAmount);
    returnData.invoiceDetailList = [];
    return returnData;
  }

  convertMainModel(model: SalesInvoiceModel): SalesInvoiceMainModel {
    const returnData = this.clearMainModel();
    returnData.data = this.checkFields(model);
    returnData.account = this.accountMap.get(returnData.data.accountPrimaryKey);
    returnData.employeeName = this.employeeMap.get(returnData.data.employeePrimaryKey);
    returnData.approverName = this.employeeMap.get(returnData.data.approveByPrimaryKey);
    returnData.statusTr = getStatus().get(returnData.data.status);
    returnData.typeTr = getInvoiceType().get(returnData.data.type);
    returnData.isWaybillTr = returnData.data.isWaybill ? 'İrsaliyeli Fatura' : 'İrsaliyesiz Fatura';
    returnData.totalPriceWithoutDiscountFormatted = currencyFormat(returnData.data.totalPriceWithoutDiscount);
    returnData.totalDetailDiscountFormatted = currencyFormat(returnData.data.totalDetailDiscount);
    returnData.totalPriceFormatted = currencyFormat(returnData.data.totalPrice);
    returnData.generalDiscountFormatted = currencyFormat(returnData.data.generalDiscount);
    returnData.totalPriceWithTaxFormatted = currencyFormat(returnData.data.totalPriceWithTax);
    returnData.totalTaxAmount = returnData.data.totalPriceWithTax - returnData.data.totalPrice;
    returnData.totalTaxAmountFormatted = currencyFormat(returnData.totalTaxAmount);
    return returnData;
  }

  getCancelRecordPrimaryKey(model: SalesInvoiceModel): string {
    return 'c-' + model.primaryKey;
  }

  getItem(primaryKey: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.collection(this.tableName).doc(primaryKey).get().toPromise().then(async doc => {
        if (doc.exists) {
          const data = doc.data() as SalesInvoiceModel;
          data.primaryKey = doc.id;

          const returnData = this.convertMainModel(data);
          const d1 = await this.cusService.getItem(returnData.data.customerCode);
          returnData.customer = this.cusService.convertMainModel(d1.data);

          resolve(Object.assign({returnData}));
        } else {
          resolve(null);
        }
      });
    });
  }

  getCustomerItems(customerCode: string): Observable<SalesInvoiceMainModel[]> {
    this.listCollection = this.db.collection(this.tableName,
      ref => ref.where('customerCode', '==', customerCode));
    this.mainList$ = this.listCollection.stateChanges().pipe(
      map(changes =>
        changes.map(c => {
          const data = c.payload.doc.data() as SalesInvoiceModel;
          data.primaryKey = c.payload.doc.id;

          const returnData = this.convertMainModel(data);
          returnData.actionType = c.type;
          returnData.account = this.accountMap.get(returnData.data.accountPrimaryKey);
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

  getMainItems(): Observable<SalesInvoiceMainModel[]> {
    this.listCollection = this.db.collection(this.tableName,
      ref => ref.orderBy('insertDate').where('userPrimaryKey', '==', this.authService.getUid()));
    this.mainList$ = this.listCollection.stateChanges().pipe(map(changes => {
      return changes.map(change => {
        const data = change.payload.doc.data() as SalesInvoiceModel;
        data.primaryKey = change.payload.doc.id;

        const returnData = this.convertMainModel(data);
        returnData.actionType = change.type;

        return this.db.collection('tblCustomer').doc(data.customerCode).valueChanges()
          .pipe(map((customer: CustomerModel) => {
            returnData.customer = this.cusService.convertMainModel(customer);
            return Object.assign({returnData});
          }));
      });
    }), mergeMap(feeds => combineLatest(feeds)));
    return this.mainList$;
  }

  getMainItemsBetweenDates(startDate: Date, endDate: Date): Observable<SalesInvoiceMainModel[]> {
    this.listCollection = this.db.collection(this.tableName,
      ref => ref.orderBy('insertDate').startAt(startDate.getTime()).endAt(endDate.getTime())
        .where('userPrimaryKey', '==', this.authService.getUid()));
    this.mainList$ = this.listCollection.stateChanges().pipe(map(changes => {
      return changes.map(change => {
        const data = change.payload.doc.data() as SalesInvoiceModel;
        data.primaryKey = change.payload.doc.id;

        const returnData = this.convertMainModel(data);
        returnData.actionType = change.type;

        return this.db.collection('tblCustomer').doc(data.customerCode).valueChanges()
          .pipe(map((customer: CustomerModel) => {
            returnData.customer = this.cusService.convertMainModel(customer);
            return Object.assign({returnData});
          }));
      });
    }), mergeMap(feeds => combineLatest(feeds)));
    return this.mainList$;
  }

  getMainItemsBetweenDatesWithCustomer(startDate: Date, endDate: Date, customerPrimaryKey: any, status: string):
    Observable<SalesInvoiceMainModel[]> {
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
        if (customerPrimaryKey !== null && customerPrimaryKey !== '-1') {
          query = query.where('customerCode', '==', customerPrimaryKey);
        }
        if (status !== null && status !== '-1') {
          query = query.where('status', '==', status);
        }
        return query;
      });
    this.mainList$ = this.listCollection.stateChanges().pipe(map(changes => {
      return changes.map(change => {
        const data = change.payload.doc.data() as SalesInvoiceModel;
        data.primaryKey = change.payload.doc.id;

        const returnData = this.convertMainModel(data);
        returnData.actionType = change.type;

        return this.db.collection('tblCustomer').doc(data.customerCode).valueChanges()
          .pipe(map((customer: CustomerModel) => {
            returnData.customer = this.cusService.convertMainModel(customer);
            return Object.assign({returnData});
          }));
      });
    }), mergeMap(feeds => combineLatest(feeds)));
    return this.mainList$;
  }

  getMainItemsBetweenDatesAsPromise = async (startDate: Date, endDate: Date, status: string):
    Promise<Array<SalesInvoiceMainModel>> => new Promise(async (resolve, reject): Promise<void> => {
    try {
      const list = Array<SalesInvoiceMainModel>();
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
      }).get().toPromise().then(snapshot => {
        snapshot.forEach(doc => {
          const data = doc.data() as SalesInvoiceModel;
          data.primaryKey = doc.id;

          const returnData = this.convertMainModel(data);

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
