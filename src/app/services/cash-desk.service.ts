import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { Observable } from 'rxjs/Observable';
import { SalesInvoiceModel } from '../models/sales-invoice-model';
import { CashDeskModel } from '../models/cash-desk-model';
import { AuthenticationService } from './authentication.service';

@Injectable({
  providedIn: 'root'
})
export class CashDeskService {
  listCollection: AngularFirestoreCollection<CashDeskModel>;
  mainList$: Observable<CashDeskModel[]>;
  listCusttomer: AngularFirestoreCollection<CashDeskModel>;
  customerList$: Observable<CashDeskModel[]>;

  constructor(public authServis: AuthenticationService,
              public db: AngularFirestore) {

  }

  getAllItems(): Observable<CashDeskModel[]> {
    this.listCollection = this.db.collection<CashDeskModel>('tblCashDesk',
    ref => ref.where('userPrimaryKey', '==', this.authServis.getUid()));
    this.mainList$ = this.listCollection.valueChanges({ idField : 'primaryKey'});
    return this.mainList$;
  }

  async addItem(record: CashDeskModel) {
    return await this.listCollection.add(record);
  }

  async removeItem(record: CashDeskModel) {
    return await this.db.collection('tblCashDesk').doc(record.primaryKey).delete();
  }

  async updateItem(record: CashDeskModel) {
    return await this.db.collection('tblCashDesk').doc(record.primaryKey).update(record);
  }

}
