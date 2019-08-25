import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument } from '@angular/fire/firestore';
import { CustomerModel } from '../models/customer-model';
import { Observable } from 'rxjs/internal/Observable';

@Injectable({
  providedIn: 'root'
})
export class CustomerService {

  customerCollection: AngularFirestoreCollection<CustomerModel>;
  customers: Observable<CustomerModel[]>;
  customerDoc: AngularFirestoreDocument<CustomerModel>;

  constructor(public db: AngularFirestore) {
  }

  getAllItems(): Observable<CustomerModel[]> {
    this.customerCollection = this.db.collection<CustomerModel>('tblCustomer');
    return this.customerCollection.valueChanges({ idField : 'primaryKey'});
  }

  addItem(customer: CustomerModel) {
    this.customerCollection.add(customer);
  }

  removeItem(customer: CustomerModel) {
    this.db.collection('tblCustomer').doc(customer.primaryKey).delete();
  }

  updateItem(customer: CustomerModel) {
    this.db.collection('tblCustomer').doc(customer.primaryKey).update(customer);
  }

}
