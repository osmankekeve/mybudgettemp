import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { Observable } from 'rxjs/Observable';
import { SalesInvoiceModel } from '../models/sales-invoice-model';
import { CashDeskModel } from '../models/cash-desk-model';

@Injectable({
  providedIn: 'root'
})
export class CashDeskService {
  listCollection: AngularFirestoreCollection<CashDeskModel>;
  mainList$: Observable<CashDeskModel[]>;
  listCusttomer: AngularFirestoreCollection<CashDeskModel>;
  customerList$: Observable<CashDeskModel[]>;

  constructor(public db: AngularFirestore) {

  }

  getAllItems(): Observable<CashDeskModel[]> {
    this.listCollection = this.db.collection<CashDeskModel>('tblCashDesk');
    this.mainList$ = this.listCollection.valueChanges({ idField : 'primaryKey'});
    return this.mainList$;
  }

  addItem(record: CashDeskModel) {
    this.listCollection.add(record);
  }

  removeItem(record: CashDeskModel) {
    this.db.collection('tblCashDesk').doc(record.primaryKey).delete();
  }

  updateItem(record: CashDeskModel) {
    this.db.collection('tblCashDesk').doc(record.primaryKey).update(record);
  }

}
