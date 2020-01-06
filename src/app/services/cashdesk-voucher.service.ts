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

@Injectable({
  providedIn: 'root'
})
export class CashdeskVoucherService {
  listCollection: AngularFirestoreCollection<CashdeskVoucherModel>;
  mainList$: Observable<CashdeskVoucherModel[]>;
  tableName = 'tblCashDeskVoucher';

  constructor(public authService: AuthenticationService, public sService: SettingService,
              public logService: LogService,
              public db: AngularFirestore) {

  }

  getAllItems(): Observable<CashdeskVoucherModel[]> {
    this.listCollection = this.db.collection<CashdeskVoucherModel>(this.tableName,
    ref => ref.orderBy('insertDate').where('userPrimaryKey', '==', this.authService.getUid()));
    this.mainList$ = this.listCollection.valueChanges({ id : 'primaryKey'});
    return this.mainList$;
  }

  async addItem(record: CashdeskVoucherModel) {
    await this.logService.sendToLog(record, 'insert', 'cashdeskVoucher');
    await this.sService.increaseCashDeskNumber();
    return await this.listCollection.add(record);
  }

  async removeItem(record: CashdeskVoucherModel) {
    await this.logService.sendToLog(record, 'delete', 'cashdeskVoucher');
    return await this.db.collection(this.tableName).doc(record.primaryKey).delete();
  }

  async updateItem(record: CashdeskVoucherModel) {
    await this.logService.sendToLog(record, 'update', 'cashdeskVoucher');
    return await this.db.collection(this.tableName).doc(record.primaryKey).update(record);
  }

  async setItem(record: CashdeskVoucherModel, primaryKey: string) {
    await this.logService.sendToLog(record, 'insert', 'cashdeskVoucher');
    await this.sService.increaseCashDeskNumber();
    return await this.listCollection.doc(primaryKey).set(record);
  }

  getItem(primaryKey: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.collection(this.tableName).doc(primaryKey).get().toPromise().then(doc => {
        if (doc.exists) {
          const data = doc.data() as CashdeskVoucherModel;
          data.primaryKey = doc.id;
          resolve(Object.assign({data}));
        } else {
          resolve(null);
        }
      });
    });
  }

  getMainItems(): Observable<CashdeskVoucherModel[]> {
    this.listCollection = this.db.collection(this.tableName,
    ref => ref.orderBy('insertDate').where('userPrimaryKey', '==', this.authService.getUid()));
    this.mainList$ = this.listCollection.stateChanges().pipe(map(changes  => {
      return changes.map( change => {
        const data = change.payload.doc.data() as CashdeskVoucherModel;
        data.primaryKey = change.payload.doc.id;
        return this.db.collection('tblCashDesk').doc(data.firstCashDeskPrimaryKey).valueChanges().pipe(map( (item: CashDeskModel) => {
          return Object.assign({data, casDeskName: item.name, actionType: change.type}); }));
      });
    }), flatMap(feeds => combineLatest(feeds)));
    return this.mainList$;
  }

  getMainItemsBetweenDates(startDate: Date, endDate: Date): Observable<CashdeskVoucherModel[]> {
    this.listCollection = this.db.collection(this.tableName,
    ref => ref.orderBy('insertDate').startAt(startDate.getTime()).endAt(endDate.getTime())
    .where('userPrimaryKey', '==', this.authService.getUid()));
    this.mainList$ = this.listCollection.stateChanges().pipe(map(changes  => {
      return changes.map( change => {
        const data = change.payload.doc.data() as CashdeskVoucherModel;
        data.primaryKey = change.payload.doc.id;
        return this.db.collection('tblCashDesk').doc(data.firstCashDeskPrimaryKey).valueChanges().pipe(map( (item: CashDeskModel) => {
          return Object.assign({data, casDeskName: item.name, actionType: change.type}); }));
      });
    }), flatMap(feeds => combineLatest(feeds)));
    return this.mainList$;
  }
}
