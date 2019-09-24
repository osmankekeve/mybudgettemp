import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { Observable } from 'rxjs/Observable';
import { AuthenticationService } from './authentication.service';
import { CashdeskVoucherModel } from '../models/cashdesk-voucher-model';
import { map, flatMap } from 'rxjs/operators';
import { combineLatest } from 'rxjs';
import { CashDeskModel } from '../models/cash-desk-model';
import { LogService } from './log.service';

@Injectable({
  providedIn: 'root'
})
export class CashdeskVoucherService {
  listCollection: AngularFirestoreCollection<CashdeskVoucherModel>;
  mainList$: Observable<CashdeskVoucherModel[]>;

  constructor(public authServis: AuthenticationService,
              public logService: LogService,
              public db: AngularFirestore) {

  }

  getAllItems(): Observable<CashdeskVoucherModel[]> {
    this.listCollection = this.db.collection<CashdeskVoucherModel>('tblCashDeskVoucher',
    ref => ref.orderBy('insertDate').where('userPrimaryKey', '==', this.authServis.getUid()));
    this.mainList$ = this.listCollection.valueChanges({ id : 'primaryKey'});
    return this.mainList$;
  }

  getCustomerItems(customerCode: string): Observable<CashdeskVoucherModel[]> {
    // valueChanges gercek zamanli guncelleme
    this.listCollection = this.db.collection<CashdeskVoucherModel>
    ('tblCashDeskVoucher', ref => ref.where('customerCode', '==', customerCode));
    this.mainList$ = this.listCollection.valueChanges({ idField : 'primaryKey'});
    return this.mainList$;
  }

  async addItem(record: CashdeskVoucherModel) {
    this.logService.sendToLog(record, 'insert', 'cashdeskVoucher');
    return await this.listCollection.add(record);
  }

  async removeItem(record: CashdeskVoucherModel) {
    this.logService.sendToLog(record, 'delete', 'cashdeskVoucher');
    return await this.db.collection('tblCashDeskVoucher').doc(record.primaryKey).delete();
  }

  async updateItem(record: CashdeskVoucherModel) {
    this.logService.sendToLog(record, 'update', 'cashdeskVoucher');
    return await this.db.collection('tblCashDeskVoucher').doc(record.primaryKey).update(record);
  }

  async setItem(record: CashdeskVoucherModel, primaryKey: string) {
    this.logService.sendToLog(record, 'insert', 'cashdeskVoucher');
    return await this.listCollection.doc(primaryKey).set(record);
  }

  getMainItems(): Observable<CashdeskVoucherModel[]> {
    this.listCollection = this.db.collection('tblCashDeskVoucher',
    ref => ref.orderBy('insertDate').where('userPrimaryKey', '==', this.authServis.getUid()));
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
