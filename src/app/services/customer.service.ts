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
    this.customerCollection = db.collection<CustomerModel>('tblCustomer',ref=> ref.orderBy('name','asc'));

    this.customers = this.customerCollection.snapshotChanges().pipe(
      map((actions:any) => actions.map(a => {
        const data = a.payload.doc.data() as CustomerModel;
        data.primaryKey = a.payload.doc.id;
        let id = a.payload.doc.id;
        return { id, ...data };
      }))
    );
    this.customerCollection.stateChanges
  }

  getAllItems() : Observable<CustomerModel[]>{
    return this.customers;
  }

  addItem(_customer : CustomerModel){
    this.customerCollection.add(_customer);
  }

  removeItem(_customer : CustomerModel){
    this.db.collection("tblCustomer").doc(_customer.primaryKey).delete();
  }

}
