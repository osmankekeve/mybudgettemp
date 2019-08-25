import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { Observable } from 'rxjs/Observable';
import { AccountTransactionModel } from '../models/account-transaction-model';

@Injectable({
  providedIn: 'root'
})
export class AccountTransactionService {
  listCollection: AngularFirestoreCollection<AccountTransactionModel>;
  mainList$: Observable<AccountTransactionModel[]>;

  constructor(public db: AngularFirestore) {

  }

  getAllItems(): Observable<AccountTransactionModel[]> {
    this.listCollection = this.db.collection<AccountTransactionModel>('tblAccountTransaction');
    this.mainList$ = this.listCollection.valueChanges({ idField : 'primaryKey'});
    return this.mainList$;
  }

  addItem(record: AccountTransactionModel) {
    this.listCollection.add(record);
  }

  removeItem(record: AccountTransactionModel) {
    this.db.collection('tblAccountTransaction').doc(record.primaryKey).delete();
  }

  updateItem(record: AccountTransactionModel) {
    this.db.collection('tblAccountTransaction').doc(record.primaryKey).update(record);
  }

  getCashDeskTransactions(cashDeskPrimaryKey: string): Observable<AccountTransactionModel[]> {
    this.listCollection = this.db.collection<AccountTransactionModel>
    ('tblAccountTransaction', ref => ref.where('cashDeskPrimaryKey', '==', cashDeskPrimaryKey));
    this.mainList$ = this.listCollection.valueChanges({ idField : 'primaryKey'});
    return this.mainList$;
  }

  getRecordTransaction(parentPrimaryKey: string): Observable<AccountTransactionModel[]> {
    this.listCollection = this.db.collection<AccountTransactionModel>
    ('tblAccountTransaction', ref => ref.where('parentPrimaryKey', '==', parentPrimaryKey));
    this.mainList$ = this.listCollection.valueChanges({ idField : 'primaryKey'});
    return this.mainList$;
  }

}
