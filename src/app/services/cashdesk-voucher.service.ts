import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
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
import {getCashDeskVoucherType} from '../core/correct-library';
import {ProfileService} from './profile.service';

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

  clearSubModel(): CashdeskVoucherModel {

    const returnData = new CashdeskVoucherModel();
    returnData.primaryKey = null;
    returnData.userPrimaryKey = this.authService.getUid();
    returnData.employeePrimaryKey = this.authService.getEid();
    returnData.type = '-1';
    returnData.transactionType = '';
    returnData.receiptNo = '';
    returnData.firstCashDeskPrimaryKey = '-1';
    returnData.secondCashDeskPrimaryKey = '';
    returnData.amount = null;
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
    return returnData;
  }

  getItem(primaryKey: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.collection(this.tableName).doc(primaryKey).get().toPromise().then(doc => {
        if (doc.exists) {
          const data = doc.data() as CashdeskVoucherModel;
          data.primaryKey = doc.id;

          const returnData = new CashDeskVoucherMainModel();
          returnData.data = data;
          returnData.typeTr = this.cashDeskVoucherTypeMap.get(data.type);
          returnData.casDeskName = this.cashDeskMap.get(data.firstCashDeskPrimaryKey);
          returnData.secondCashDeskName = data.secondCashDeskPrimaryKey === '-1' ?
            '-' : this.cashDeskMap.get(data.secondCashDeskPrimaryKey);
          resolve(Object.assign({returnData}));
        } else {
          resolve(null);
        }
      });
    });
  }

  getMainItems(): Observable<CashDeskVoucherMainModel[]> {
    this.listCollection = this.db.collection(this.tableName,
    ref => ref.orderBy('insertDate').where('userPrimaryKey', '==', this.authService.getUid()));
    this.mainList$ = this.listCollection.stateChanges().pipe(map(changes  => {
      return changes.map( change => {
        const data = change.payload.doc.data() as CashdeskVoucherModel;
        data.primaryKey = change.payload.doc.id;

        const returnData = new CashDeskVoucherMainModel();
        returnData.data = data;
        returnData.typeTr = this.cashDeskVoucherTypeMap.get(data.type);
        returnData.secondCashDeskName = data.secondCashDeskPrimaryKey === '-1' ? '-' : this.cashDeskMap.get(data.secondCashDeskPrimaryKey);
        returnData.actionType = change.type;

        return this.db.collection('tblCashDesk').doc(data.firstCashDeskPrimaryKey).valueChanges().pipe(map( (item: CashDeskModel) => {
          returnData.casDeskName = item !== undefined ? item.name : 'Belirlenemeyen Kasa Kaydı';
          return Object.assign({returnData}); }));
      });
    }), flatMap(feeds => combineLatest(feeds)));
    return this.mainList$;
  }

  getMainItemsBetweenDates(startDate: Date, endDate: Date): Observable<CashDeskVoucherMainModel[]> {
    this.listCollection = this.db.collection(this.tableName,
    ref => ref.orderBy('insertDate').startAt(startDate.getTime()).endAt(endDate.getTime())
    .where('userPrimaryKey', '==', this.authService.getUid()));
    this.mainList$ = this.listCollection.stateChanges().pipe(map(changes  => {
      return changes.map( change => {
        const data = change.payload.doc.data() as CashdeskVoucherModel;
        data.primaryKey = change.payload.doc.id;

        const returnData = new CashDeskVoucherMainModel();
        returnData.data = data;
        returnData.typeTr = this.cashDeskVoucherTypeMap.get(data.type);
        returnData.casDeskName = this.cashDeskMap.get(data.firstCashDeskPrimaryKey);
        returnData.secondCashDeskName = data.secondCashDeskPrimaryKey === '-1' ? '-' : this.cashDeskMap.get(data.secondCashDeskPrimaryKey);
        returnData.actionType = change.type;

        return this.db.collection('tblCashDesk').doc(data.firstCashDeskPrimaryKey).valueChanges().pipe(map( (item: CashDeskModel) => {
          // returnData.casDeskName = item !== undefined ? item.name : 'Belirlenemeyen Kasa Kaydı';
          return Object.assign({returnData}); }));
      });
    }), flatMap(feeds => combineLatest(feeds)));
    return this.mainList$;
  }
}
