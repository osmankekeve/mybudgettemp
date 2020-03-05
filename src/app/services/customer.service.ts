import { Injectable } from '@angular/core';
import {
  AngularFirestore,
  AngularFirestoreCollection,
  AngularFirestoreDocument,
  CollectionReference, Query
} from '@angular/fire/firestore';
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
  tableName = 'tblCustomer';

  constructor(public authService: AuthenticationService,
              public db: AngularFirestore) {
  }

  getAllItems(): Observable<CustomerModel[]> {
    this.listCollection = this.db.collection<CustomerModel>(this.tableName,
    ref => ref.where('userPrimaryKey', '==', this.authService.getUid()).orderBy('name', 'asc'));
    return this.listCollection.valueChanges({ idField : 'primaryKey'});
  }

  getAllActiveItems(): Observable<CustomerModel[]> {
    this.listCollection = this.db.collection<CustomerModel>(this.tableName,
    ref => ref
    .where('userPrimaryKey', '==', this.authService.getUid())
    .where('isActive', '==', true)
    .orderBy('name', 'asc'));
    return this.listCollection.valueChanges({ idField : 'primaryKey'});
  }

  async addItem(customer: CustomerModel) {
    return await this.listCollection.add(customer);
  }

  async setItem(customer: CustomerModel, primaryKey: string) {
    return await this.listCollection.doc(primaryKey).set(Object.assign({}, customer));
  }

  async removeItem(customer: CustomerModel) {
    return await this.db.collection(this.tableName).doc(customer.primaryKey).delete();
  }

  async updateItem(customer: CustomerModel) {
    return await this.db.collection(this.tableName).doc(customer.primaryKey).update(customer);
  }

  getItem(primaryKey: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.collection(this.tableName).doc(primaryKey).get().toPromise().then(doc => {
        if (doc.exists) {
          const data = doc.data() as CustomerModel;
          data.primaryKey = doc.id;
          resolve(Object.assign({data}));
        } else {
          resolve(null);
        }
      });
    });
  }

  getMainItems(isActive: boolean): Observable<CustomerModel[]> {
    this.listCollection = this.db.collection(this.tableName,
      ref => {
        let query: CollectionReference | Query = ref;
        query = query.orderBy('name', 'asc')
          .where('userPrimaryKey', '==', this.authService.getUid())
          .where('isActive', '==', isActive);
        return query;
      });
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

  getCustomersForReport = async (customerPrimaryKey: string, isActive: boolean):
    // tslint:disable-next-line:cyclomatic-complexity
    Promise<Array<CustomerModel>> => new Promise(async (resolve, reject): Promise<void> => {
    try {
      const list = Array<CustomerModel>();
      this.db.collection(this.tableName, ref => {
        let query: CollectionReference | Query = ref;
        query = query.orderBy('name', 'asc')
          .where('userPrimaryKey', '==', this.authService.getUid())
          .where('isActive', '==', isActive);
        if (customerPrimaryKey !== undefined && customerPrimaryKey !== null && customerPrimaryKey !== '-1') {
          query = query.where('primaryKey', '==', customerPrimaryKey);
        }
        return query;
      })
        .get().subscribe(snapshot => {
        snapshot.forEach(doc => {
          const data = doc.data() as CustomerModel;
          data.primaryKey = doc.id;
          list.push(data);
        });
        resolve(list);
      });

    } catch (error) {
      console.error(error);
      reject({code: 401, message: 'You do not have permission or there is a problem about permissions!'});
    }
  })

}
