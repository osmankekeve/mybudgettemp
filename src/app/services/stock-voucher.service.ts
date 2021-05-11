import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection, CollectionReference, Query } from '@angular/fire/firestore';
import { Observable } from 'rxjs/Observable';
import { map } from 'rxjs/operators';
import { AuthenticationService } from './authentication.service';
import { LogService } from './log.service';
import { SettingService } from './setting.service';
import { CustomerService } from './customer.service';
import { ActionService } from './action.service';
import { StockVoucherModel } from '../models/product-module/stock-voucher-model';
import { StockVoucherMainModel } from '../models/product-module/stock-voucher-main-model';
import { StockVoucherDetailService } from './stock-voucher-detail.service';
import { getStatus, getStockVoucherType } from '../core/correct-library';
import { StockVoucherDetailMainModel } from '../models/product-module/stock-voucher-detail-main-model';
import { StockTransactionService } from './stock-transaction.service';

@Injectable({
  providedIn: 'root'
})
export class StockVoucherService {
  listCollection: AngularFirestoreCollection<StockVoucherModel>;
  mainList$: Observable<StockVoucherMainModel[]>;
  tableName = 'tblStockVoucher';

  constructor(protected authService: AuthenticationService, protected sService: SettingService, protected cusService: CustomerService,
              protected logService: LogService, protected db: AngularFirestore, protected vdService: StockVoucherDetailService,
              protected actService: ActionService, protected stService: StockTransactionService) {

  }

  async addItem(record: StockVoucherMainModel) {
    return await this.listCollection.add(Object.assign({}, record.data)).then(async () => {
      await this.logService.addTransactionLog(record, 'insert', 'stock-voucher');
    });
  }

  async removeItem(record: StockVoucherMainModel) {
    return await this.db.collection(this.tableName).doc(record.data.primaryKey).delete().then(async () => {
      await this.logService.addTransactionLog(record, 'delete', 'stock-voucher');
      await this.vdService.getItemsWithOrderPrimaryKey(record.data.primaryKey)
        .then((list) => {
          list.forEach(async item => {
            await this.db.collection(this.vdService.tableName).doc(item.primaryKey).delete();
          });
        });
    });
  }

  async updateItem(record: StockVoucherMainModel) {
    return await this.db.collection(this.tableName).doc(record.data.primaryKey).update(Object.assign({}, record.data)).then(async () => {
      if (record.data.status === 'waitingForApprove' || record.data.status === 'approved') {
        await this.vdService.getItemsWithOrderPrimaryKey(record.data.primaryKey)
        .then((list) => {
          list.forEach(async item => {
            await this.db.collection(this.vdService.tableName).doc(item.primaryKey).delete();
          });
        }).finally(async () => {
          for (const item of record.detailList) {
            item.data.voucherPrimaryKey = record.data.primaryKey;
            await this.db.collection(this.vdService.tableName).doc(item.data.primaryKey).set(Object.assign({}, item.data));
          }
          await this.logService.addTransactionLog(record, 'insert', 'stock-voucher');
        });
      }
      if (record.data.status === 'waitingForApprove') {
        this.logService.addTransactionLog(record, 'update', 'stock-voucher');
      } else if (record.data.status === 'approved') {
        for (const item of record.detailList) {
          const st = this.stService.clearMainModel();
          st.data.primaryKey = this.db.createId();
          st.data.productPrimaryKey = item.data.productPrimaryKey;
          st.data.transactionPrimaryKey = record.data.primaryKey;
          st.data.receiptNo = record.data.receiptNo;
          st.data.transactionType = 'stockVoucher';
          if (record.data.type === 'dropStock' || record.data.type === 'consumableStock') {
            st.data.transactionSubType = record.data.type;
            st.data.quantity = item.defaultUnitQuantity * -1;
            st.data.amount = item.data.amount * -1;
          }
          if (record.data.type === 'addingStock' || record.data.type === 'openingStock') {
            st.data.transactionSubType = record.data.type;
            st.data.quantity = item.defaultUnitQuantity;
            st.data.amount = item.data.amount;
          }
          st.data.insertDate = Date.now();
          await this.stService.setItem(st, st.data.primaryKey);
        }
        this.logService.addTransactionLog(record, 'approved', 'stock-voucher');
      } else {
        this.logService.addTransactionLog(record, 'update', 'salesInvoice');
      }
    });
  }

  async setItem(record: StockVoucherMainModel, primaryKey: string) {
    return await this.listCollection.doc(primaryKey).set(Object.assign({}, record.data)).then(async () => {
      await this.vdService.getItemsWithOrderPrimaryKey(record.data.primaryKey)
        .then((list) => {
          list.forEach(async item => {
            await this.db.collection(this.vdService.tableName).doc(item.primaryKey).delete();
          });
        }).finally(async () => {
          for (const item of record.detailList) {
            item.data.voucherPrimaryKey = record.data.primaryKey;
            await this.db.collection(this.vdService.tableName).doc(item.data.primaryKey).set(Object.assign({}, item.data));
          }
          await this.logService.addTransactionLog(record, 'insert', 'stock-voucher');
        });
    });
  }

  checkForSave(record: StockVoucherMainModel): Promise<string> {
    return new Promise((resolve, reject) => {
      if (record.data.receiptNo === '') {
        reject('Lütfen fiş numarası giriniz.');
      } else if (record.data.type === '-1') {
        reject('Lütfen fiş tipi seçiniz.');
      } else {
        resolve(null);
      }
    });
  }

  checkForRemove(record: StockVoucherMainModel): Promise<string> {
    return new Promise(async (resolve, reject) => {

      resolve(null);
    });
  }

  clearSubModel(): StockVoucherModel {

    const returnData = new StockVoucherModel();
    returnData.primaryKey = null;
    returnData.userPrimaryKey = this.authService.getUid();
    returnData.title = '';
    returnData.receiptNo = '';
    returnData.type = '-1';
    returnData.status = 'waitingForApprove';
    returnData.approveByPrimaryKey = '-1';
    returnData.approveDate = 0;
    returnData.description = '';
    returnData.documentDate = Date.now();
    returnData.insertDate = Date.now();

    return returnData;
  }

  clearMainModel(): StockVoucherMainModel {
    const returnData = new StockVoucherMainModel();
    returnData.data = this.clearSubModel();
    returnData.actionType = 'added';
    returnData.statusTr = getStatus().get(returnData.data.status);
    returnData.typeTr = getStockVoucherType().get(returnData.data.type);
    returnData.detailList = Array<StockVoucherDetailMainModel>();
    return returnData;
  }

  checkFields(model: StockVoucherModel): StockVoucherModel {
    const cleanModel = this.clearSubModel();

    return model;
  }

  convertMainModel(model: StockVoucherModel): StockVoucherMainModel {
    const returnData = this.clearMainModel();
    returnData.data = this.checkFields(model);
    returnData.statusTr = getStatus().get(returnData.data.status);
    returnData.typeTr = getStockVoucherType().get(returnData.data.type);
    return returnData;
  }

  getItem(primaryKey: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.collection(this.tableName).doc(primaryKey).get().toPromise().then(doc => {
        if (doc.exists) {
          const data = doc.data() as StockVoucherModel;
          data.primaryKey = doc.id;

          const returnData = this.convertMainModel(data);
          resolve(Object.assign({ returnData }));
        } else {
          resolve(null);
        }
      });
    });
  }

  getMainItems(): Observable<StockVoucherMainModel[]> {
    this.listCollection = this.db.collection(this.tableName,
      ref => {
        let query: CollectionReference | Query = ref;
        query = query.where('userPrimaryKey', '==', this.authService.getUid());
        return query;
      });
    this.mainList$ = this.listCollection.stateChanges().pipe(
      map(changes =>
        changes.map(c => {
          const data = c.payload.doc.data() as StockVoucherModel;
          data.primaryKey = c.payload.doc.id;

          const returnData = this.convertMainModel(data);
          returnData.actionType = c.type;
          return Object.assign({ returnData });
        })
      )
    );
    return this.mainList$;
  }

  getMainItemsBetweenDates(startDate: Date, endDate: Date, status: string): Observable<StockVoucherMainModel[]> {
    this.listCollection = this.db.collection(this.tableName,
      ref => {
        let query: CollectionReference | Query = ref;
        query = query.orderBy('insertDate', 'desc').where('userPrimaryKey', '==', this.authService.getUid());
        if (startDate !== null) { query = query.startAt(endDate.getTime()); }
        if (endDate !== null) { query = query.endAt(startDate.getTime()); }
        if (status !== null && status !== '-1') { query = query.where('status', '==', status); }
        return query;
      });
    this.mainList$ = this.listCollection.stateChanges().pipe(
      map(changes =>
        changes.map(c => {
          const data = c.payload.doc.data() as StockVoucherModel;
          data.primaryKey = c.payload.doc.id;

          const returnData = this.convertMainModel(data);
          returnData.actionType = c.type;
          return Object.assign({ returnData });
        })
      )
    );
    return this.mainList$;
  }
}
