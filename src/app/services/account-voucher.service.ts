import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { Observable } from 'rxjs/Observable';
import { CustomerModel } from '../models/customer-model';
import { map, flatMap } from 'rxjs/operators';
import { combineLatest } from 'rxjs';
import { AuthenticationService } from './authentication.service';
import { AccountVoucherModel } from '../models/account-voucher-model';

@Injectable({
  providedIn: 'root'
})
export class AccountVoucherService {
  listCollection: AngularFirestoreCollection<AccountVoucherModel>;
  mainList$: Observable<AccountVoucherModel[]>;
  listCusttomer: AngularFirestoreCollection<CustomerModel>;
  customerList$: Observable<CustomerModel[]>;

  constructor(public authServis: AuthenticationService,
              public db: AngularFirestore) {

  }

  getAllItems(): Observable<AccountVoucherModel[]> {
    this.listCollection = this.db.collection<AccountVoucherModel>('tblAccountVoucher',
    ref => ref.orderBy('insertDate').where('userPrimaryKey', '==', this.authServis.getUid()));
    this.mainList$ = this.listCollection.valueChanges({ idField : 'primaryKey'});
    return this.mainList$;
  }

  getCustomerItems(customerCode: string): Observable<AccountVoucherModel[]> {
    // valueChanges gercek zamanli guncelleme
    this.listCollection = this.db.collection<AccountVoucherModel>
    ('tblAccountVoucher', ref => ref.where('customerCode', '==', customerCode));
    this.mainList$ = this.listCollection.valueChanges({ idField : 'primaryKey'});
    return this.mainList$;
  }

  async addItem(record: AccountVoucherModel) {
    return await this.listCollection.add(record);
  }

  async removeItem(record: AccountVoucherModel) {
    return await this.db.collection('tblAccountVoucher').doc(record.primaryKey).delete();
  }

  async updateItem(record: AccountVoucherModel) {
    return await this.db.collection('tblAccountVoucher').doc(record.primaryKey).update(record);
  }

  async setItem(record: AccountVoucherModel, primaryKey: string) {
    return await this.listCollection.doc(primaryKey).set(record);
  }

  getItems(): Observable<AccountVoucherModel[]> {
    this.listCollection = this.db.collection('tblAccountVoucher',
    ref => ref.orderBy('insertDate').where('userPrimaryKey', '==', this.authServis.getUid()));
    this.mainList$ = this.listCollection.snapshotChanges().pipe(map(changes  => {
      return changes.map( change => {
        const data = change.payload.doc.data() as AccountVoucherModel;
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
