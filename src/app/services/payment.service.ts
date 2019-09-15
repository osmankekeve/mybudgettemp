import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { Observable } from 'rxjs/Observable';
import { CustomerModel } from '../models/customer-model';
import { map, flatMap } from 'rxjs/operators';
import { combineLatest } from 'rxjs';
import { PaymentModel } from '../models/payment-model';
import { AccountTransactionModel } from '../models/account-transaction-model';
import { AuthenticationService } from './authentication.service';

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

  constructor(public authServis: AuthenticationService,
              public db: AngularFirestore) {

  }

  getAllItems(): Observable<PaymentModel[]> {
    this.listCollection = this.db.collection<PaymentModel>('tblPayment',
    ref => ref.orderBy('insertDate').where('userPrimaryKey', '==', this.authServis.getUid()));
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

  async addItem(record: PaymentModel) {
    return await this.listCollection.add(record);
  }

  async removeItem(record: PaymentModel) {
    /* this.db.firestore.runTransaction(t => {
        return t.get(sfDocRef).then(doc => {
          const newValue = doc.data().value;
        }).then().catch(err => console.error(err));
      }); */

      return await this.db.collection('tblPayment').doc(record.primaryKey).delete();
  }

  async updateItem(record: PaymentModel) {
    return await this.db.collection('tblPayment').doc(record.primaryKey).update(record);
  }

  getMainItems(): Observable<PaymentModel[]> {
    this.listCollection = this.db.collection('tblPayment',
    ref => ref.orderBy('insertDate').where('userPrimaryKey', '==', this.authServis.getUid()));
    this.mainList$ = this.listCollection.stateChanges().pipe(map(changes  => {
      return changes.map( change => {
        const returnData = change.payload.doc.data() as PaymentModel;
        returnData.primaryKey = change.payload.doc.id;
        return this.db.collection('tblCustomer').doc(returnData.customerCode).valueChanges()
        .pipe(map( (customer: CustomerModel) => {
          return Object.assign({returnData, customerName: customer.name, actionType: change.type}); }));
      });
    }), flatMap(feeds => combineLatest(feeds)));
    return this.mainList$;
  }
}
