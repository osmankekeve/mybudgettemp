import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument } from '@angular/fire/firestore';
import { CustomerModel } from '../models/customer-model';
import { Observable } from 'rxjs/internal/Observable';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CustomerService {

  customerCollection : AngularFirestoreCollection<CustomerModel>;
  customers : Observable<CustomerModel[]>;
  customerDoc : AngularFirestoreDocument<CustomerModel>;

  constructor(public db: AngularFirestore) { 
  }

  getAllItems() : Observable<CustomerModel[]>{
    this.customerCollection = this.db.collection<CustomerModel>('tblCustomer');
    return this.customerCollection.valueChanges({ idField : 'primaryKey'});
  }

  addItem(_customer : CustomerModel){
    this.customerCollection.add(_customer);
  }

  removeItem(_customer : CustomerModel){
    this.db.collection("tblCustomer").doc(_customer.primaryKey).delete();
  }

  updateItem(_customer : CustomerModel){
    this.db.collection("tblCustomer").doc(_customer.primaryKey).update(_customer);
  }

}
