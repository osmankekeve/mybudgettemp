import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument } from '@angular/fire/firestore';
import { CustomerModel } from '../models/customer-model';
import { Observable } from 'rxjs/internal/Observable';
import { AuthenticationService } from './authentication.service';

@Injectable({
  providedIn: 'root'
})
export class CustomerService {

  customerCollection: AngularFirestoreCollection<CustomerModel>;
  customers: Observable<CustomerModel[]>;
  customerDoc: AngularFirestoreDocument<CustomerModel>;

  constructor(public authServis: AuthenticationService,
              public db: AngularFirestore) {
  }

  getAllItems(): Observable<CustomerModel[]> {
    this.customerCollection = this.db.collection<CustomerModel>('tblCustomer',
    ref => ref.where('userPrimaryKey', '==', this.authServis.getUid()));
    return this.customerCollection.valueChanges({ idField : 'primaryKey'});
  }

  async addItem(customer: CustomerModel) {
    return await this.customerCollection.add(customer);
  }

  async removeItem(customer: CustomerModel) {
    return await this.db.collection('tblCustomer').doc(customer.primaryKey).delete();
  }

  async updateItem(customer: CustomerModel) {
    return await this.db.collection('tblCustomer').doc(customer.primaryKey).update(customer);
  }

}
