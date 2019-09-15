import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { Observable } from 'rxjs/Observable';
import { CustomerModel } from '../models/customer-model';
import { map, flatMap } from 'rxjs/operators';
import { combineLatest } from 'rxjs';
import { CollectionModel } from '../models/collection-model';
import { AuthenticationService } from './authentication.service';

@Injectable({
  providedIn: 'root'
})
export class CollectionService {
  listCollection: AngularFirestoreCollection<CollectionModel>;
  mainList$: Observable<CollectionModel[]>;
  listCusttomer: AngularFirestoreCollection<CustomerModel>;
  customerList$: Observable<CustomerModel[]>;

  constructor(public authServis: AuthenticationService,
              public db: AngularFirestore) {

  }

  getAllItems(): Observable<CollectionModel[]> {
    this.listCollection = this.db.collection<CollectionModel>('tblCollection',
    ref => ref.orderBy('insertDate').where('userPrimaryKey', '==', this.authServis.getUid()));
    this.mainList$ = this.listCollection.valueChanges({ idField : 'primaryKey'});
    return this.mainList$;
  }

  getCustomerItems(customerCode: string): Observable<CollectionModel[]> {
    // valueChanges gercek zamanli guncelleme
    this.listCollection = this.db.collection<CollectionModel>
    ('tblCollection', ref => ref.where('customerCode', '==', customerCode));
    this.mainList$ = this.listCollection.valueChanges({ idField : 'primaryKey'});
    return this.mainList$;
  }

  async addItem(record: CollectionModel) {
    return await this.listCollection.add(record);
  }

  async removeItem(record: CollectionModel) {
    return await this.db.collection('tblCollection').doc(record.primaryKey).delete();
  }

  async updateItem(record: CollectionModel) {
    return await this.db.collection('tblCollection').doc(record.primaryKey).update(record);
  }

  async setItem(record: CollectionModel, primaryKey: string) {
    return await this.listCollection.doc(primaryKey).set(record);
  }

  getMainItems(): Observable<CollectionModel[]> {
    this.listCollection = this.db.collection('tblCollection',
    ref => ref.orderBy('insertDate').where('userPrimaryKey', '==', this.authServis.getUid()));
    this.mainList$ = this.listCollection.stateChanges().pipe(map(changes  => {
      return changes.map( change => {
        const data = change.payload.doc.data() as CollectionModel;
        data.primaryKey = change.payload.doc.id;
        return this.db.collection('tblCustomer').doc(data.customerCode).valueChanges()
        .pipe(map( (customer: CustomerModel) => {
          return Object.assign({data, customerName: customer.name, actionType: change.type}); }));
      });
    }), flatMap(feeds => combineLatest(feeds)));
    return this.mainList$;
  }
}
