import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { Observable } from 'rxjs/Observable';
import { AccountTransactionModel } from '../models/account-transaction-model';
import { AuthenticationService } from './authentication.service';

@Injectable({
  providedIn: 'root'
})
export class AccountTransactionService {
  listCollection: AngularFirestoreCollection<AccountTransactionModel>;
  mainList$: Observable<AccountTransactionModel[]>;
  tableName: any = 'tblAccountTransaction';

  constructor(public authServis: AuthenticationService,
              public db: AngularFirestore) {

  }

  getAllItems(): Observable<AccountTransactionModel[]> {
    this.listCollection = this.db.collection<AccountTransactionModel>(this.tableName);
    this.mainList$ = this.listCollection.valueChanges({ idField : 'primaryKey'});
    return this.mainList$;
  }

  getRecordTransactionItems(primaryKey: string): Observable<AccountTransactionModel[]> {
    this.listCollection = this.db.collection<AccountTransactionModel>(this.tableName,
      ref => ref.where('transactionPrimaryKey', '==', primaryKey));
    this.mainList$ = this.listCollection.valueChanges({ idField : 'primaryKey'});
    return this.mainList$;
  }

  addItem(record: AccountTransactionModel) {
    this.listCollection.add(record);
  }

  removeItem(record: AccountTransactionModel) {
    this.db.collection(this.tableName).doc(record.primaryKey).delete();
  }

  updateItem(record: AccountTransactionModel) {
    this.db.collection(this.tableName).doc(record.primaryKey).update(record);
  }

  getCashDeskTransactions(cashDeskPrimaryKey: string): Observable < AccountTransactionModel[] > {
    this.listCollection = this.db.collection<AccountTransactionModel>
    (this.tableName, ref => ref.where('cashDeskPrimaryKey', '==', cashDeskPrimaryKey).orderBy('insertDate'));
    this.mainList$ = this.listCollection.valueChanges({ idField : 'primaryKey'});
    return this.mainList$;
  }

  getOnDayTransactions(): Observable < AccountTransactionModel[] > {
    const date = new Date();
    const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const end = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
    this.listCollection = this.db.collection<AccountTransactionModel>
    (this.tableName, ref => ref.orderBy('insertDate').startAt(start.getTime()).endAt(end.getTime()));
    this.mainList$ = this.listCollection.valueChanges({ idField : 'primaryKey'});
    return this.mainList$;
  }

  isRecordHasTransaction(primaryKey: string): boolean {
    this.db.collection(this.tableName, ref => ref.where('transactionPrimaryKey', '==', primaryKey))
    .get().subscribe(list => {
      if (list.size > 0) {
        return true;
      }
    });
    return false;
  }

  getNewPaymentTransactionItem(): AccountTransactionModel {
    const data = new AccountTransactionModel();
    data.userPrimaryKey = this.authServis.getUid();
    data.parentPrimaryKey = '';
    data.parentType = 'customer';
    data.transactionPrimaryKey = undefined;
    data.transactionType = 'payment';
    data.amountType = 'debit';
    data.amount = 0;
    data.cashDeskPrimaryKey = '-1';
    data.insertDate = Date.now();
    data.receiptNo = '';
    return data;
  }

}
