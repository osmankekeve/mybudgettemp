import { Injectable } from '@angular/core';
import {AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument, CollectionReference, Query} from '@angular/fire/firestore';
import { Observable } from 'rxjs/Observable';
import { PurchaseInvoiceModel } from '../models/purchase-invoice-model';
import { CustomerModel } from '../models/customer-model';
import { map, flatMap } from 'rxjs/operators';
import { combineLatest } from 'rxjs';
import { AuthenticationService } from './authentication.service';
import { LogService } from './log.service';
import {QueryFn} from '@angular/fire/firestore/interfaces';

@Injectable({
  providedIn: 'root'
})
export class PurchaseInvoiceService {
  listCollection: AngularFirestoreCollection<PurchaseInvoiceModel>;
  mainList$: Observable<PurchaseInvoiceModel[]>;
  listCusttomer: AngularFirestoreCollection<CustomerModel>;
  customerList$: Observable<CustomerModel[]>;

  constructor(public authServis: AuthenticationService,
              public logService: LogService,
              public db: AngularFirestore) {

  }

  getAllItems(): Observable<PurchaseInvoiceModel[]> {
    this.listCollection = this.db.collection<PurchaseInvoiceModel>('tblPurchaseInvoice',
    ref => ref.orderBy('insertDate').where('userPrimaryKey', '==', this.authServis.getUid()));
    this.mainList$ = this.listCollection.valueChanges({ idField : 'primaryKey'});
    return this.mainList$;
  }

  getCustomerItems(customerCode: string): Observable<PurchaseInvoiceModel[]> {
    // valueChanges gercek zamanli guncelleme
    this.listCollection = this.db.collection<PurchaseInvoiceModel>
    ('tblPurchaseInvoice', ref => ref.where('customerCode', '==', customerCode));
    this.mainList$ = this.listCollection.valueChanges({ idField : 'primaryKey'});
    return this.mainList$;
  }

  async addItem(record: PurchaseInvoiceModel) {
    this.logService.sendToLog(record, 'insert', 'purchaseInvoice');
    return await this.listCollection.add(record);
  }

  async setItem(record: PurchaseInvoiceModel, primaryKey: string) {
    this.logService.sendToLog(record, 'insert', 'purchaseInvoice');
    return await this.listCollection.doc(primaryKey).set(record);
  }

  async removeItem(record: PurchaseInvoiceModel) {
    this.logService.sendToLog(record, 'delete', 'purchaseInvoice');
    return await this.db.collection('tblPurchaseInvoice').doc(record.primaryKey).delete();
  }

  async updateItem(record: PurchaseInvoiceModel) {
    this.logService.sendToLog(record, 'update', 'purchaseInvoice');
    return await this.db.collection('tblPurchaseInvoice').doc(record.primaryKey).update(record);
  }

  getMainItems(): Observable<PurchaseInvoiceModel[]> {
    this.listCollection = this.db.collection('tblPurchaseInvoice',
    ref => ref.orderBy('insertDate').where('userPrimaryKey', '==', this.authServis.getUid()));
    this.mainList$ = this.listCollection.stateChanges().pipe(map(changes  => {
      return changes.map( change => {
        const data = change.payload.doc.data() as PurchaseInvoiceModel;
        data.primaryKey = change.payload.doc.id;
        return this.db.collection('tblCustomer').doc(data.customerCode).valueChanges()
        .pipe(map( (customer: CustomerModel) => {
          return Object.assign({data, customerName: customer.name, actionType: change.type}); }));
      });
    }), flatMap(feeds => combineLatest(feeds)));
    return this.mainList$;
  }

  getMainItemsBetweenDates(startDate: Date, endDate: Date): Observable<PurchaseInvoiceModel[]> {
    this.listCollection = this.db.collection('tblPurchaseInvoice',
    ref => ref.orderBy('insertDate').startAt(startDate.getTime()).endAt(endDate.getTime())
    .where('userPrimaryKey', '==', this.authServis.getUid()));
    this.mainList$ = this.listCollection.stateChanges().pipe(map(changes  => {
      return changes.map( change => {
        const data = change.payload.doc.data() as PurchaseInvoiceModel;
        data.primaryKey = change.payload.doc.id;
        return this.db.collection('tblCustomer').doc(data.customerCode).valueChanges()
        .pipe(map( (customer: CustomerModel) => {
          return Object.assign({data, customerName: customer.name, actionType: change.type}); }));
      });
    }), flatMap(feeds => combineLatest(feeds)));
    return this.mainList$;
  }

  getMainItemsBetweenDatesWithCustomer(startDate: Date, endDate: Date, customerPrimaryKey: any): Observable<PurchaseInvoiceModel[]> {
    this.listCollection = this.db.collection('tblPurchaseInvoice', ref => {
        let query: CollectionReference | Query = ref;
        query = query.orderBy('insertDate').startAt(startDate.getTime()).endAt(endDate.getTime())
          .where('userPrimaryKey', '==', this.authServis.getUid());
        if (customerPrimaryKey !== '-1') {
          query = query.where('customerCode', '==', customerPrimaryKey);
        }
        return query;
      });
    this.mainList$ = this.listCollection.stateChanges().pipe(map(changes  => {
      return changes.map( change => {
        const data = change.payload.doc.data() as PurchaseInvoiceModel;
        data.primaryKey = change.payload.doc.id;
        return this.db.collection('tblCustomer').doc(data.customerCode).valueChanges()
          .pipe(map( (customer: CustomerModel) => {
            return Object.assign({data, customerName: customer.name, actionType: change.type}); }));
      });
    }), flatMap(feeds => combineLatest(feeds)));
    return this.mainList$;
  }

}
