import { Injectable } from '@angular/core';
import {AngularFirestore, AngularFirestoreCollection, CollectionReference, Query} from '@angular/fire/firestore';
import { Observable } from 'rxjs/Observable';
import { map, flatMap } from 'rxjs/operators';
import { AuthenticationService } from './authentication.service';
import {BuySaleMainModel} from '../models/buy-sale-main-model';
import {BuySaleModel} from '../models/buy-sale-model';
import {currencyFormat, getBuySaleType, getStatus} from '../core/correct-library';
import {CollectionMainModel} from '../models/collection-main-model';
import {CustomerModel} from '../models/customer-model';
import {BuySaleCurrencyModel} from '../models/buy-sale-currency-model';
import {PaymentModel} from '../models/payment-model';
import {PaymentMainModel} from '../models/payment-main-model';
import {combineLatest} from 'rxjs';
import {ProfileModel} from '../models/profile-model';
import {ProfileService} from './profile.service';
import {AccountTransactionModel} from '../models/account-transaction-model';
import {BuySaleCurrencyService} from './buy-sale-currency.service';
import {AccountTransactionService} from './account-transaction.service';
import {ActionService} from './action.service';
import {LogService} from './log.service';

@Injectable({
  providedIn: 'root'
})
export class BuySaleService {
  listCollection: AngularFirestoreCollection<BuySaleModel>;
  mainList$: Observable<BuySaleMainModel[]>;
  tableName = 'tblBuySale';
  employeeMap = new Map();

  constructor(public authService: AuthenticationService, public db: AngularFirestore, public pService: ProfileService,
              public eService: ProfileService, public bscService: BuySaleCurrencyService, protected logService: LogService,
              protected atService: AccountTransactionService, protected actService: ActionService) {
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

  async addItem(record: BuySaleMainModel) {
    return await this.listCollection.add(Object.assign({}, record.data));
  }

  async removeItem(record: BuySaleMainModel) {
    return await this.db.collection(this.tableName).doc(record.data.primaryKey).delete();
  }

  async updateItem(record: BuySaleMainModel) {
    return await this.db.collection(this.tableName).doc(record.data.primaryKey).update(Object.assign({}, record.data))
      .then(async value => {
        if (record.data.status === 'approved') {
          const trans = this.atService.clearSubModel();
          trans.primaryKey = record.data.primaryKey;
          trans.receiptNo = record.data.receiptNo;
          trans.transactionPrimaryKey = record.data.primaryKey;
          trans.transactionType = 'buy-sale';
          trans.transactionSubType = 'buy-sale';
          trans.parentPrimaryKey = record.data.currencyPrimaryKey;
          trans.parentType = 'buy-sale-currency';
          trans.accountPrimaryKey = '-1';
          trans.cashDeskPrimaryKey = record.data.cashDeskPrimaryKey;
          trans.amount = record.data.transactionType === 'buy' ? record.data.totalAmount * -1 : record.data.totalAmount;
          trans.amountType = record.data.transactionType === 'buy' ? 'debit' : 'credit';
          trans.insertDate = record.data.insertDate;
          await this.atService.setItem(trans, trans.primaryKey);
          await this.logService.addTransactionLog(record, 'approved', 'buy-sale');
          this.actService.addAction(this.tableName, record.data.primaryKey, 1, 'Kayıt Onay');
        } else if (record.data.status === 'rejected') {
          await this.logService.addTransactionLog(record, 'rejected', 'buy-sale');
          this.actService.addAction(this.tableName, record.data.primaryKey, 1, 'Kayıt İptal');
        } else {
          await this.logService.addTransactionLog(record, 'update', 'buy-sale');
          this.actService.addAction(this.tableName, record.data.primaryKey, 2, 'Kayıt Güncelleme');
        }
      });
  }

  async setItem(record: BuySaleMainModel, primaryKey: string) {
    return await this.listCollection.doc(primaryKey).set(Object.assign({}, record.data));
  }

  checkForSave(record: BuySaleMainModel): Promise<string> {
    return new Promise((resolve, reject) => {
      if (record.data.receiptNo === '') {
        reject('Lütfen fiş numarası seçiniz.');
      } else if (record.data.currencyPrimaryKey === null || record.data.currencyPrimaryKey === '-1') {
        reject('Lüfen döviz seçiniz.');
      } else if (record.data.transactionType === null || record.data.transactionType === '-1') {
        reject('Lüfen işlem tipi seçiniz.');
      } else if (record.data.unitAmount <= 0) {
        reject('Lüfen birim değer giriniz.');
      } else if (record.data.unitValue <= 0) {
        reject('Lüfen birim miktar giriniz.');
      } else if (record.data.totalAmount <= 0) {
        reject('Lüfen toplam tutar giriniz.');
      } else {
        resolve(null);
      }
    });
  }

  checkForRemove(record: BuySaleMainModel): Promise<string> {
    return new Promise((resolve, reject) => {
      resolve(null);
    });
  }

  clearSubModel(): BuySaleModel {
    const returnData = new BuySaleModel();
    returnData.primaryKey = null;
    returnData.userPrimaryKey = this.authService.getUid();
    returnData.employeePrimaryKey = this.authService.getEid();
    returnData.currencyPrimaryKey = '-1';
    returnData.transactionType = '-1';
    returnData.receiptNo = '';
    returnData.unitAmount = 0;
    returnData.unitValue = 0;
    returnData.totalAmount = 0;
    returnData.description = '';
    returnData.status = 'waitingForApprove'; // waitingForApprove, approved, rejected
    returnData.approveByPrimaryKey = '-1';
    returnData.approveDate = 0;
    returnData.platform = 'web'; // mobile, web
    returnData.recordDate = Date.now();
    returnData.insertDate = Date.now();
    return returnData;
  }

  clearMainModel(): BuySaleMainModel {
    const returnData = new BuySaleMainModel();
    returnData.data = this.clearSubModel();
    returnData.amountFormatted = currencyFormat(returnData.data.unitAmount);
    returnData.totalAmountFormatted = currencyFormat(returnData.data.totalAmount);
    returnData.statusTr = getStatus().get(returnData.data.status);
    returnData.platformTr = returnData.data.platform === 'web' ? 'Web' : 'Mobil';
    returnData.transactionTypeTr = getBuySaleType().get(returnData.data.transactionType);
    return returnData;
  }

  checkFields(model: BuySaleModel): BuySaleModel {
    const cleanModel = this.clearSubModel();
    if (model.currencyPrimaryKey === undefined) {
      model.currencyPrimaryKey = cleanModel.currencyPrimaryKey;
    }
    if (model.cashDeskPrimaryKey === undefined) {
      model.cashDeskPrimaryKey = cleanModel.cashDeskPrimaryKey;
    }
    if (model.transactionType === undefined) {
      model.transactionType = cleanModel.transactionType;
    }
    if (model.receiptNo === undefined) {
      model.receiptNo = cleanModel.receiptNo;
    }
    if (model.unitAmount === undefined) {
      model.unitAmount = cleanModel.unitAmount;
    }
    if (model.unitValue === undefined) {
      model.unitValue = cleanModel.unitValue;
    }
    if (model.totalAmount === undefined) {
      model.totalAmount = cleanModel.totalAmount;
    }
    if (model.description === undefined) {
      model.description = cleanModel.description;
    }
    if (model.insertDate === undefined) {
      model.insertDate = cleanModel.insertDate;
    }
    if (model.recordDate === undefined) {
      model.recordDate = cleanModel.insertDate;
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
    return model;
  }

  getItem(primaryKey: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.collection(this.tableName).doc(primaryKey).get()
        .toPromise()
        .then(doc => {
          if (doc.exists) {
            const data = doc.data() as BuySaleModel;
            data.primaryKey = doc.id;

            const returnData = new BuySaleMainModel();
            returnData.data = this.checkFields(data);
            returnData.amountFormatted = currencyFormat(returnData.data.unitAmount);
            returnData.totalAmountFormatted = currencyFormat(returnData.data.totalAmount);
            returnData.approverName = this.employeeMap.get(returnData.data.approveByPrimaryKey);
            returnData.statusTr = getStatus().get(returnData.data.status);
            returnData.transactionTypeTr = getBuySaleType().get(returnData.data.transactionType);
            resolve(Object.assign({returnData}));
          } else {
            resolve(null);
          }
        });
    });
  }

  getMainItems(currencyPrimaryKey: string): Observable<BuySaleMainModel[]> {
    this.listCollection = this.db.collection(this.tableName,
      ref => {
        let query: CollectionReference | Query = ref;
        query = query.orderBy('insertDate').where('userPrimaryKey', '==', this.authService.getUid());
        if (currencyPrimaryKey !== null) {
          query = query.where('currencyPrimaryKey', '==', currencyPrimaryKey);
        }
        return query;
      });
    this.mainList$ = this.listCollection.stateChanges().pipe(map(changes => {
      return changes.map(change => {
        const data = change.payload.doc.data() as BuySaleModel;
        data.primaryKey = change.payload.doc.id;

        const returnData = new BuySaleMainModel();
        returnData.data = this.checkFields(data);
        returnData.actionType = change.type;
        returnData.amountFormatted = currencyFormat(returnData.data.unitAmount);
        returnData.totalAmountFormatted = currencyFormat(returnData.data.totalAmount);
        returnData.employeeName = this.employeeMap.get(data.employeePrimaryKey);
        returnData.approverName = this.employeeMap.get(returnData.data.approveByPrimaryKey);
        returnData.statusTr = getStatus().get(returnData.data.status);
        returnData.transactionTypeTr = getBuySaleType().get(returnData.data.transactionType);

        return this.db.collection('tblBuySaleCurrency').doc(returnData.data.currencyPrimaryKey).valueChanges()
          .pipe(map((item: BuySaleCurrencyModel) => {
            returnData.currencyName = item !== undefined ? item.currencyName : 'Belirlenemeyen Müşteri Kaydı';
            return Object.assign({returnData});
          }));
      });
    }), flatMap(feeds => combineLatest(feeds)));
    return this.mainList$;
  }

  getCurrencyTransactions = async (currencyPrimaryKey: string):
    Promise<Array<BuySaleMainModel>> => new Promise(async (resolve, reject): Promise<void> => {
    try {
      const list = Array<BuySaleMainModel>();
      this.db.collection(this.tableName, ref =>
        ref.where('userPrimaryKey', '==', this.authService.getUid())
          .where('currencyPrimaryKey', '==', currencyPrimaryKey))
        .get().subscribe(snapshot => {
        snapshot.forEach(doc => {
          const data = doc.data() as BuySaleModel;
          data.primaryKey = doc.id;

          const returnData = new BuySaleMainModel();
          returnData.data = this.checkFields(data);
          returnData.amountFormatted = currencyFormat(returnData.data.unitAmount);
          returnData.totalAmountFormatted = currencyFormat(returnData.data.totalAmount);
          returnData.employeeName = this.employeeMap.get(data.employeePrimaryKey);
          this.bscService.getItem(currencyPrimaryKey).then(item => {
            returnData.currencyName = item.returnData.data.currencyName;
          });

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
