import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument } from '@angular/fire/firestore';
import { CustomerModel } from '../models/customer-model';
import { Observable } from 'rxjs/internal/Observable';
import { map, flatMap } from 'rxjs/operators';
import { combineLatest } from 'rxjs';
import { AuthenticationService } from './authentication.service';

@Injectable({
  providedIn: 'root'
})
export class CustomerService {

  listCollection: AngularFirestoreCollection<CustomerModel>;
  mainList$: Observable<CustomerModel[]>;
  customerDoc: AngularFirestoreDocument<CustomerModel>;
  tableName = 'tblCustomer';

  constructor(public authServis: AuthenticationService,
              public db: AngularFirestore) {
  }

  getAllItems(): Observable<CustomerModel[]> {
    this.listCollection = this.db.collection<CustomerModel>(this.tableName,
    ref => ref.where('userPrimaryKey', '==', this.authServis.getUid()).orderBy('name', 'asc'));
    return this.listCollection.valueChanges({ idField : 'primaryKey'});
  }

  getAllActiveItems(): Observable<CustomerModel[]> {
    this.listCollection = this.db.collection<CustomerModel>(this.tableName,
    ref => ref
    .where('userPrimaryKey', '==', this.authServis.getUid())
    .where('isActive', '==', true)
    .orderBy('name', 'asc'));
    return this.listCollection.valueChanges({ idField : 'primaryKey'});
  }

  async addItem(customer: CustomerModel) {
    return await this.listCollection.add(customer);
  }

  async removeItem(customer: CustomerModel) {
    return await this.db.collection(this.tableName).doc(customer.primaryKey).delete();
  }

  async updateItem(customer: CustomerModel) {
    return await this.db.collection(this.tableName).doc(customer.primaryKey).update(customer);
  }

  getMainItems(): Observable<CustomerModel[]> {
    this.listCollection = this.db.collection(this.tableName, ref => ref.where('userPrimaryKey', '==', this.authServis.getUid())
    .orderBy('name', 'asc'));
    this.mainList$ = this.listCollection.stateChanges().pipe(map(changes  => {
      return changes.map( change => {
        const data = change.payload.doc.data() as CustomerModel;
        data.primaryKey = change.payload.doc.id;
        return this.db.collection(this.tableName).doc('-1').valueChanges()
        .pipe(map( (customer: CustomerModel) => {
          return Object.assign({data, actionType: change.type}); }));
      });
    }), flatMap(feeds => combineLatest(feeds)));
    return this.mainList$;
  }

}
