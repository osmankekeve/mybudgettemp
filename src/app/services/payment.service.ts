import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { Observable } from 'rxjs/Observable';
import { CustomerModel } from '../models/customer-model';
import { map, flatMap } from 'rxjs/operators';
import { combineLatest } from 'rxjs';
import { PaymentModel } from '../models/payment-model';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  listCollection: AngularFirestoreCollection<PaymentModel>;
  mainList$: Observable<PaymentModel[]>;
  listCusttomer: AngularFirestoreCollection<CustomerModel>;
  customerList$: Observable<CustomerModel[]>;

  constructor(public db: AngularFirestore) {

  }

  getAllItems(): Observable<PaymentModel[]> {
    this.listCollection = this.db.collection<PaymentModel>('tblPayment');
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

  addItem(record: PaymentModel) {
    this.listCollection.add(record);
  }

  removeItem(record: PaymentModel) {
    this.db.collection('tblPayment').doc(record.primaryKey).delete();
  }

  updateItem(record: PaymentModel) {
    this.db.collection('tblPayment').doc(record.primaryKey).update(record);
  }

  getItems(): Observable<PaymentModel[]> {
    this.listCollection = this.db.collection('tblPayment');
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
