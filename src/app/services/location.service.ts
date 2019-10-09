import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { Observable } from 'rxjs/Observable';
import { CustomerModel } from '../models/customer-model';
import { map, flatMap } from 'rxjs/operators';
import { combineLatest } from 'rxjs';
import { PaymentModel } from '../models/payment-model';
import { AccountTransactionModel } from '../models/account-transaction-model';
import { AuthenticationService } from './authentication.service';
import { LogService } from './log.service';
import {LocationModel} from '../models/location-model';

@Injectable({
  providedIn: 'root'
})

export class LocationService {
  listCollection: AngularFirestoreCollection<LocationModel>;
  mainList$: Observable<LocationModel[]>;
  customerList$: Observable<CustomerModel[]>;
  tableName = 'tblLocation';

  constructor(public authService: AuthenticationService,
              public logService: LogService,
              public db: AngularFirestore) {

  }

  getAllItems(): Observable<LocationModel[]> {
    this.listCollection = this.db.collection<LocationModel>(this.tableName,
      ref => ref.orderBy('insertDate').where('userPrimaryKey', '==', this.authService.getUid()));
    this.mainList$ = this.listCollection.valueChanges({idField: 'primaryKey'});
    return this.mainList$;
  }

  async addItem(record: LocationModel) {
    await this.logService.sendToLog(record, 'insert', 'location');
    return await this.listCollection.add(record);
  }

  async removeItem(record: LocationModel) {
    /* this.db.firestore.runTransaction(t => {
        return t.get(sfDocRef).then(doc => {
          const newValue = doc.data().value;
        }).then().catch(err => console.error(err));
      }); */

    await this.logService.sendToLog(record, 'delete', 'location');
    return await this.db.collection(this.tableName).doc(record.primaryKey).delete();
  }

  async updateItem(record: LocationModel) {
    await this.logService.sendToLog(record, 'update', 'location');
    return await this.db.collection(this.tableName).doc(record.primaryKey).update(record);
  }

  async setItem(record: LocationModel, primaryKey: string) {
    await this.logService.sendToLog(record, 'insert', 'location');
    return await this.listCollection.doc(primaryKey).set(record);
  }

  getMainItems(): Observable<LocationModel[]> {
    this.listCollection = this.db.collection(this.tableName,
      ref => ref.orderBy('insertDate').where('userPrimaryKey', '==', this.authService.getUid()));
    this.mainList$ = this.listCollection.stateChanges().pipe(map(changes => {
      return changes.map(change => {
        const data = change.payload.doc.data() as LocationModel;
        data.primaryKey = change.payload.doc.id;
        return this.db.collection('tblCustomer').doc(data.customerPrimaryKey).valueChanges()
          .pipe(map((customer: CustomerModel) => {
            return Object.assign({data, customerName: customer.name, actionType: change.type});
          }));
      });
    }), flatMap(feeds => combineLatest(feeds)));
    return this.mainList$;
  }

  getMainItemsBetweenDates(startDate: Date, endDate: Date): Observable<LocationModel[]> {
    this.listCollection = this.db.collection(this.tableName,
      ref => ref.orderBy('insertDate').startAt(startDate.getTime()).endAt(endDate.getTime())
        .where('userPrimaryKey', '==', this.authService.getUid()));
    this.mainList$ = this.listCollection.stateChanges().pipe(map(changes => {
      return changes.map(change => {
        const data = change.payload.doc.data() as LocationModel;
        data.primaryKey = change.payload.doc.id;
        return this.db.collection('tblCustomer').doc(data.customerPrimaryKey).valueChanges()
          .pipe(map((customer: CustomerModel) => {
            return Object.assign({data, customerName: customer.name, actionType: change.type});
          }));
      });
    }), flatMap(feeds => combineLatest(feeds)));
    return this.mainList$;
  }
}
