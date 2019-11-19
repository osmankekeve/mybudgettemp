import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { Observable } from 'rxjs/Observable';
import { CustomerModel } from '../models/customer-model';
import { map, flatMap } from 'rxjs/operators';
import { combineLatest } from 'rxjs';
import { AuthenticationService } from './authentication.service';
import { LogService } from './log.service';
import { VisitModel } from '../models/visit-model';

@Injectable({
  providedIn: 'root'
})
export class VisitService {
  listCollection: AngularFirestoreCollection<VisitModel>;
  mainList$: Observable<VisitModel[]>;
  tableName = 'tblVisit';

  constructor(public authServis: AuthenticationService,
              public logService: LogService,
              public db: AngularFirestore) {

  }

  getAllItems(): Observable<VisitModel[]> {
    this.listCollection = this.db.collection<VisitModel>(this.tableName,
    ref => ref.orderBy('insertDate').where('userPrimaryKey', '==', this.authServis.getUid()));
    this.mainList$ = this.listCollection.valueChanges({ idField : 'primaryKey'});
    return this.mainList$;
  }

  getCustomerItems(customerCode: string): Observable<VisitModel[]> {
    // valueChanges gercek zamanli guncelleme
    this.listCollection = this.db.collection<VisitModel>
    (this.tableName, ref => ref.where('customerCode', '==', customerCode));
    this.mainList$ = this.listCollection.valueChanges({ idField : 'primaryKey'});
    return this.mainList$;
  }

  async addItem(record: VisitModel) {
    this.logService.sendToLog(record, 'insert', 'visit');
    return await this.listCollection.add(record);
  }

  async removeItem(record: VisitModel) {
      this.logService.sendToLog(record, 'delete', 'visit');
      return await this.db.collection(this.tableName).doc(record.primaryKey).delete();
  }

  async updateItem(record: VisitModel) {
    this.logService.sendToLog(record, 'update', 'visit');
    return await this.db.collection(this.tableName).doc(record.primaryKey).update(record);
  }

  async setItem(record: VisitModel, primaryKey: string) {
    this.logService.sendToLog(record, 'insert', 'visit');
    return await this.listCollection.doc(primaryKey).set(record);
  }

  getMainItems(): Observable<VisitModel[]> {
    this.listCollection = this.db.collection(this.tableName,
    ref => ref.orderBy('actionDate').where('userPrimaryKey', '==', this.authServis.getUid()));
    this.mainList$ = this.listCollection.stateChanges().pipe(map(changes  => {
      return changes.map( change => {
        const data = change.payload.doc.data() as VisitModel;
        data.primaryKey = change.payload.doc.id;
        return this.db.collection('tblCustomer').doc(data.customerPrimaryKey).valueChanges()
        .pipe(map( (customer: CustomerModel) => {
          return Object.assign({data, customerName: customer.name, actionType: change.type}); }));
      });
    }), flatMap(feeds => combineLatest(feeds)));
    return this.mainList$;
  }

  getMainItemsBetweenDates(startDate: Date, endDate: Date): Observable<VisitModel[]> {
    this.listCollection = this.db.collection(this.tableName,
    ref => ref.orderBy('actionDate').startAt(startDate.getTime()).endAt(endDate.getTime())
    .where('userPrimaryKey', '==', this.authServis.getUid()));
    this.mainList$ = this.listCollection.stateChanges().pipe(map(changes  => {
      return changes.map( change => {
        const data = change.payload.doc.data() as VisitModel;
        data.primaryKey = change.payload.doc.id;
        return this.db.collection('tblCustomer').doc(data.customerPrimaryKey).valueChanges()
        .pipe(map( (customer: CustomerModel) => {
          return Object.assign({data, customerName: customer.name, actionType: change.type}); }));
      });
    }), flatMap(feeds => combineLatest(feeds)));
    return this.mainList$;
  }

  getMainItemsAfterDate(afterDate: Date): Observable<VisitModel[]> {
    this.listCollection = this.db.collection(this.tableName,
    ref => ref.orderBy('actionDate').startAfter(afterDate.getTime())
    .where('userPrimaryKey', '==', this.authServis.getUid()));
    this.mainList$ = this.listCollection.stateChanges().pipe(map(changes  => {
      return changes.map( change => {
        const data = change.payload.doc.data() as VisitModel;
        data.primaryKey = change.payload.doc.id;
        return this.db.collection('tblCustomer').doc(data.customerPrimaryKey).valueChanges()
        .pipe(map( (customer: CustomerModel) => {
          return Object.assign({data, customerName: customer.name, actionType: change.type}); }));
      });
    }), flatMap(feeds => combineLatest(feeds)));
    return this.mainList$;
  }

  getMainItemsBeforeDate(beforeDate: Date): Observable<VisitModel[]> {
    this.listCollection = this.db.collection(this.tableName,
    ref => ref.orderBy('actionDate').endBefore(beforeDate.getTime())
    .where('userPrimaryKey', '==', this.authServis.getUid()));
    this.mainList$ = this.listCollection.stateChanges().pipe(map(changes  => {
      return changes.map( change => {
        const data = change.payload.doc.data() as VisitModel;
        data.primaryKey = change.payload.doc.id;
        return this.db.collection('tblCustomer').doc(data.customerPrimaryKey).valueChanges()
        .pipe(map( (customer: CustomerModel) => {
          return Object.assign({data, customerName: customer.name, actionType: change.type}); }));
      });
    }), flatMap(feeds => combineLatest(feeds)));
    return this.mainList$;
  }
}
