import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { Observable } from 'rxjs/Observable';
import { AuthenticationService } from './authentication.service';
import { CashdeskVoucherModel } from '../models/cashdesk-voucher-model';

@Injectable({
  providedIn: 'root'
})
export class CashdeskVoucherService {
  listCollection: AngularFirestoreCollection<CashdeskVoucherModel>;
  mainList$: Observable<CashdeskVoucherModel[]>;
  tableName: 'tblCashDeskVoucher';

  constructor(public authServis: AuthenticationService,
              public db: AngularFirestore) {

  }

  getAllItems(): Observable<CashdeskVoucherModel[]> {
    this.listCollection = this.db.collection<CashdeskVoucherModel>(this.tableName,
    ref => ref.orderBy('insertDate').where('userPrimaryKey', '==', this.authServis.getUid()));
    this.mainList$ = this.listCollection.valueChanges({ idField : 'primaryKey'});
    return this.mainList$;
  }

  getCustomerItems(customerCode: string): Observable<CashdeskVoucherModel[]> {
    // valueChanges gercek zamanli guncelleme
    this.listCollection = this.db.collection<CashdeskVoucherModel>
    (this.tableName, ref => ref.where('customerCode', '==', customerCode));
    this.mainList$ = this.listCollection.valueChanges({ idField : 'primaryKey'});
    return this.mainList$;
  }

  async addItem(record: CashdeskVoucherModel) {
    return await this.listCollection.add(record);
  }

  async removeItem(record: CashdeskVoucherModel) {
    return await this.db.collection(this.tableName).doc(record.primaryKey).delete();
  }

  async updateItem(record: CashdeskVoucherModel) {
    return await this.db.collection(this.tableName).doc(record.primaryKey).update(record);
  }

  async setItem(record: CashdeskVoucherModel, primaryKey: string) {
    return await this.listCollection.doc(primaryKey).set(record);
  }
}
