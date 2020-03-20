import { Injectable } from '@angular/core';
import {AngularFirestore, AngularFirestoreCollection, CollectionReference, Query} from '@angular/fire/firestore';
import { Observable } from 'rxjs/Observable';
import { AuthenticationService } from './authentication.service';
import { CashdeskVoucherModel } from '../models/cashdesk-voucher-model';
import { map, flatMap } from 'rxjs/operators';
import { combineLatest } from 'rxjs';
import { CashDeskModel } from '../models/cash-desk-model';
import { LogService } from './log.service';
import {SettingService} from './setting.service';
import {CashDeskVoucherMainModel} from '../models/cashdesk-voucher-main-model';
import {CashDeskService} from './cash-desk.service';
import {currencyFormat, getCashDeskVoucherType, isNullOrEmpty} from '../core/correct-library';
import {ProfileService} from './profile.service';
import {AccountVoucherModel} from '../models/account-voucher-model';
import {CashDeskMainModel} from '../models/cash-desk-main-model';

@Injectable({
  providedIn: 'root'
})
export class CashDeskVoucherService {
  listCollection: AngularFirestoreCollection<CashdeskVoucherModel>;
  mainList$: Observable<CashDeskVoucherMainModel[]>;
  cashDeskMap = new Map();
  cashDeskVoucherTypeMap = new Map();
  employeeMap = new Map();
  tableName = 'tblCashDeskVoucher';

  constructor(public authService: AuthenticationService, public sService: SettingService, public eService: ProfileService,
              public logService: LogService, public cdService: CashDeskService, public db: AngularFirestore) {
    this.cdService.getItems().subscribe(list => {
      this.cashDeskMap.clear();
      list.forEach((data: any) => {
        const item = data as CashDeskModel;
        this.cashDeskMap.set(item.primaryKey, item.name);
      });
    });
    this.cashDeskVoucherTypeMap = getCashDeskVoucherType();
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

  async addItem(record: CashDeskVoucherMainModel) {
    await this.logService.sendToLog(record, 'insert', 'cashdeskVoucher');
    await this.sService.increaseCashDeskNumber();
    return await this.listCollection.add(Object.assign({}, record.data));
  }

  async removeItem(record: CashDeskVoucherMainModel) {
    await this.logService.sendToLog(record, 'delete', 'cashdeskVoucher');
    return await this.db.collection(this.tableName).doc(record.data.primaryKey).delete();
  }

  async updateItem(record: CashDeskVoucherMainModel) {
    await this.logService.sendToLog(record, 'update', 'cashdeskVoucher');
    return await this.db.collection(this.tableName).doc(record.data.primaryKey).update(Object.assign({}, record.data));
  }

  async setItem(record: CashDeskVoucherMainModel, primaryKey: string) {
    await this.logService.sendToLog(record, 'insert', 'cashdeskVoucher');
    await this.sService.increaseCashDeskNumber();
    return await this.listCollection.doc(primaryKey).set(Object.assign({}, record.data));
  }

  checkForSave(record: CashDeskVoucherMainModel): Promise<string> {
    return new Promise((resolve, reject) => {
      if (record.data.type === '' ||  record.data.type === '-1') {
        reject('Lütfen fiş tipi seçiniz.');
      } else if (record.data.transactionType === '' ||  record.data.transactionType === '-1') {
        reject('Lütfen işlem tipi seçiniz.');
      } else if (record.data.receiptNo === '') {
        reject('Lütfen fiş numarası.');
      } else if (record.data.firstCashDeskPrimaryKey === '') {
        reject('Lütfen ana kasa seçiniz.');
      } else if (record.data.amount <= 0) {
        reject('Tutar sıfırdan büyük olmalıdır.');
      } else if (isNullOrEmpty(record.data.insertDate)) {
        reject('Lütfen kayıt tarihi seçiniz.');
      } else {
        resolve(null);
      }
    });
  }

  checkForRemove(record: CashDeskVoucherMainModel): Promise<string> {
    return new Promise((resolve, reject) => {
      resolve(null);
    });
  }

  clearSubModel(): CashdeskVoucherModel {

    const returnData = new CashdeskVoucherModel();
    returnData.primaryKey = null;
    returnData.userPrimaryKey = this.authService.getUid();
    returnData.employeePrimaryKey = this.authService.getEid();
    returnData.type = '-1'; // kontrole takılsın istediğim için -1 değeri verdim
    returnData.transactionType = '-1';
    returnData.receiptNo = ''; // kontrole takılmayacak ancak valid kontrolünde olacak
    returnData.firstCashDeskPrimaryKey = '';
    returnData.secondCashDeskPrimaryKey = '';
    returnData.amount = 0;
    returnData.description = '';
    returnData.insertDate = Date.now();

    return returnData;
  }

  clearMainModel(): CashDeskVoucherMainModel {
    const returnData = new CashDeskVoucherMainModel();
    returnData.data = this.clearSubModel();
    returnData.employeeName = this.employeeMap.get(returnData.data.employeePrimaryKey);
    returnData.casDeskName = '';
    returnData.secondCashDeskName = '';
    returnData.actionType = 'added';
    returnData.amountFormatted = currencyFormat(returnData.data.amount);
    return returnData;
  }

  checkFields(model: CashdeskVoucherModel): CashdeskVoucherModel {
    const cleanModel = this.clearSubModel();
    if (model.employeePrimaryKey === undefined) { model.employeePrimaryKey = '-1'; }
    if (model.firstCashDeskPrimaryKey === undefined) { model.firstCashDeskPrimaryKey = cleanModel.firstCashDeskPrimaryKey; }
    if (model.secondCashDeskPrimaryKey === undefined) { model.secondCashDeskPrimaryKey = cleanModel.secondCashDeskPrimaryKey; }
    if (model.type === undefined) { model.type = cleanModel.type; }
    if (model.transactionType === undefined) { model.transactionType = cleanModel.transactionType; }
    if (model.receiptNo === undefined) { model.receiptNo = cleanModel.receiptNo; }
    if (model.amount === undefined) { model.amount = cleanModel.amount; }
    if (model.description === undefined) { model.description = cleanModel.description; }

    return model;
  }

  getItem(primaryKey: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.collection(this.tableName).doc(primaryKey).get().toPromise().then(doc => {
        if (doc.exists) {
          const data = doc.data() as CashdeskVoucherModel;
          data.primaryKey = doc.id;

          const returnData = new CashDeskVoucherMainModel();
          returnData.data = this.checkFields(data);
          returnData.typeTr = this.cashDeskVoucherTypeMap.get(data.type);
          returnData.casDeskName = this.cashDeskMap.get(data.firstCashDeskPrimaryKey);
          returnData.secondCashDeskName = data.secondCashDeskPrimaryKey === '-1' ?
            '-' : this.cashDeskMap.get(data.secondCashDeskPrimaryKey);
          returnData.amountFormatted = currencyFormat(returnData.data.amount);
          resolve(Object.assign({returnData}));
        } else {
          resolve(null);
        }
      });
    });
  }

  getMainItemsBetweenDates(startDate: Date, endDate: Date): Observable<CashDeskVoucherMainModel[]> {
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
      return query;
    });
    this.mainList$ = this.listCollection.stateChanges().pipe(map(changes  => {
      return changes.map( change => {
        const data = change.payload.doc.data() as CashdeskVoucherModel;
        data.primaryKey = change.payload.doc.id;

        const returnData = new CashDeskVoucherMainModel();
        returnData.data = this.checkFields(data);
        returnData.typeTr = this.cashDeskVoucherTypeMap.get(data.type);
        returnData.casDeskName = this.cashDeskMap.get(data.firstCashDeskPrimaryKey);
        returnData.secondCashDeskName = data.secondCashDeskPrimaryKey === '-1' ? '-' : this.cashDeskMap.get(data.secondCashDeskPrimaryKey);
        returnData.actionType = change.type;
        returnData.amountFormatted = currencyFormat(returnData.data.amount);

        return this.db.collection('tblCashDesk').doc(data.firstCashDeskPrimaryKey).valueChanges().pipe(map( (item: CashDeskModel) => {
          // returnData.casDeskName = item !== undefined ? item.name : 'Belirlenemeyen Kasa Kaydı';
          return Object.assign({returnData}); }));
      });
    }), flatMap(feeds => combineLatest(feeds)));
    return this.mainList$;
  }
}
