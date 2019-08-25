import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { Observable } from 'rxjs/Observable';
import { CustomerModel } from '../models/customer-model';
import { map, flatMap } from 'rxjs/operators';
import { combineLatest } from 'rxjs';
import { PaymentModel } from '../models/payment-model';
import { AccountTransactionService } from './account-transaction-service';
import { AccountTransactionModel } from '../models/account-transaction-model';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  listCollection: AngularFirestoreCollection<PaymentModel>;
  mainList$: Observable<PaymentModel[]>;
  listCusttomer: AngularFirestoreCollection<CustomerModel>;
  customerList$: Observable<CustomerModel[]>;
  transactionList$: Observable<PaymentModel[]>;
  atMod: AccountTransactionModel;

  constructor(public db: AngularFirestore, public atService: AccountTransactionService) {

  }

  getAllItems(): Observable<PaymentModel[]> {
    this.listCollection = this.db.collection<PaymentModel>('tblPayment', ref => ref.orderBy('insertDate'));
    this.mainList$ = this.listCollection.valueChanges({ idField : 'primaryKey'});
    return this.mainList$;
  }

  getCustomerItems(customerCode: string): Observable<PaymentModel[]> {
    // valueChanges gercek zamanli guncelleme
    this.listCollection = this.db.collection<PaymentModel>
    ('tblPayment', ref => ref.where('customerCode', '==', customerCode));
    this.mainList$ = this.listCollection.valueChanges({ idField : 'primaryKey'});
    return this.mainList$;
  }

  clearTransactionItem(): void {
    this.atMod.userPrimaryKey = 'Ax75AL0DUUcT1r6lzfNZ5TMBnhg1';
    this.atMod.parentPrimaryKey = '';
    this.atMod.parentType = 'customer';
    this.atMod.transactionPrimaryKey = undefined;
    this.atMod.transactionType = 'payment';
    this.atMod.amountType = 'debit';
    this.atMod.amount = 0;
    this.atMod.cashDeskPrimaryKey = '-1';
    this.atMod.insertDate = new Date();
    this.atMod.receiptNo = '';
  }

  addItem(record: PaymentModel) {
    this.clearTransactionItem();
    this.listCollection.add(record).then(item => {
      this.atMod.userPrimaryKey = 'Ax75AL0DUUcT1r6lzfNZ5TMBnhg1';
      this.atMod.parentPrimaryKey = record.customerCode;
      this.atMod.parentType = 'customer';
      this.atMod.transactionPrimaryKey = item.id;
      this.atMod.transactionType = 'payment';
      this.atMod.amountType = 'debit';
      this.atMod.amount = record.amount * -1;
      this.atMod.cashDeskPrimaryKey = record.cashDeskPrimaryKey;
      this.atMod.insertDate = record.insertDate;
      this.atMod.receiptNo = record.receiptNo;
      this.atService.addItem(this.atMod);
    });
  }

  removeItem(record: PaymentModel) {
    /* this.db.firestore.runTransaction(t => {
        return t.get(sfDocRef).then(doc => {
          const newValue = doc.data().value;
        }).then().catch(err => console.error(err));
      }); */

    this.db.collection('tblPayment').doc(record.primaryKey).delete().then(item => {
      this.atService.getRecordTransaction(record.primaryKey).subscribe(list => {
        list.forEach((item2) => {
          const delItem = item2 as AccountTransactionModel;
          this.atService.removeItem(delItem);
        });
      });
    });
  }

  updateItem(record: PaymentModel) {
    this.clearTransactionItem();
    this.db.collection('tblPayment').doc(record.primaryKey).update(record).then(item => {

    });
  }

  getItems(): Observable<PaymentModel[]> {
    this.listCollection = this.db.collection('tblPayment', ref => ref.orderBy('insertDate'));
    this.mainList$ = this.listCollection.snapshotChanges().pipe(map(changes  => {
      return changes.map( change => {
        const data = change.payload.doc.data() as PaymentModel;
        data.primaryKey = change.payload.doc.id;
        return this.db.collection('tblCustomer').doc(data.customerCode).valueChanges().pipe(map( (customer: CustomerModel) => {
            return Object.assign({data, customerName: customer.name}); }));
            /* data.customer = customer;
            return Object.assign({data}); })); */
      });
    }), flatMap(feeds => combineLatest(feeds)));
    return this.mainList$;
  }
}
