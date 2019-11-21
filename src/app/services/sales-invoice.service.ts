import { Injectable } from '@angular/core';
import {AngularFirestore, AngularFirestoreCollection, CollectionReference, Query} from '@angular/fire/firestore';
import { Observable } from 'rxjs/Observable';
import { CustomerModel } from '../models/customer-model';
import { map, flatMap } from 'rxjs/operators';
import { combineLatest } from 'rxjs';
import { SalesInvoiceModel } from '../models/sales-invoice-model';
import { AuthenticationService } from './authentication.service';
import { LogService } from './log.service';
import { LogModel } from '../models/log-model';

@Injectable({
  providedIn: 'root'
})
export class SalesInvoiceService {
  listCollection: AngularFirestoreCollection<SalesInvoiceModel>;
  mainList$: Observable<SalesInvoiceModel[]>;
  listCusttomer: AngularFirestoreCollection<CustomerModel>;
  customerList$: Observable<CustomerModel[]>;
  tableName = 'tblSalesInvoice';

  constructor(public authServis: AuthenticationService,
              public logService: LogService,
              public db: AngularFirestore) {

  }

  getAllItems(): Observable<SalesInvoiceModel[]> {
    this.listCollection = this.db.collection<SalesInvoiceModel>(this.tableName,
    ref => ref.orderBy('insertDate').where('userPrimaryKey', '==', this.authServis.getUid()));
    this.mainList$ = this.listCollection.valueChanges({ idField : 'primaryKey'});
    return this.mainList$;
  }

  async addItem(record: SalesInvoiceModel) {
    return await this.listCollection.add(record);
  }

  async setItem(record: SalesInvoiceModel, primaryKey: string) {
    this.logService.sendToLog(record, 'insert', 'salesInvoice');
    return await this.listCollection.doc(primaryKey).set(record);
  }

  async removeItem(record: SalesInvoiceModel) {
    await this.logService.sendToLog(record, 'delete', 'salesInvoice');
    return await this.db.collection(this.tableName).doc(record.primaryKey).delete();
  }

  async updateItem(record: SalesInvoiceModel) {
    this.logService.sendToLog(record, 'update', 'salesInvoice');
    return await this.db.collection(this.tableName).doc(record.primaryKey).update(record);
  }

  async sendToLog(record: SalesInvoiceModel, proccess: string) {
    const item = new LogModel();
    item.parentType = 'salesInvoice';
    item.parentPrimaryKey = record.primaryKey;
    item.type = 'notification';
    item.userPrimaryKey = this.authServis.getUid();
    item.isActive = true;
    item.insertDate = Date.now();
    if (proccess === 'insert') {
      item.log = record.receiptNo + ' fiş numaralı Satış Faturası oluşturuldu.';
    }  else if (proccess === 'update') {
      item.log = record.receiptNo + ' fiş numaralı Satış Faturası güncellendi.';
    } else if (proccess === 'delete') {
      item.log = record.receiptNo + ' fiş numaralı Satış Faturası kaldırıldı.';
    } else {
      //
    }
    return await this.logService.setItem(item);
  }

  getCustomerItems(customerCode: string): Observable<SalesInvoiceModel[]> {
    this.listCollection = this.db.collection(this.tableName,
      ref => ref.where('customerCode', '==', customerCode));
    this.mainList$ = this.listCollection.stateChanges().pipe(
      map(changes =>
        changes.map(c => {
          const data = c.payload.doc.data() as SalesInvoiceModel;
          data.primaryKey = c.payload.doc.id;
          return Object.assign({data, actionType: c.type});
        })
      )
    );
    return this.mainList$;
  }

  getMainItems(): Observable<SalesInvoiceModel[]> {
    this.listCollection = this.db.collection(this.tableName,
    ref => ref.orderBy('insertDate').where('userPrimaryKey', '==', this.authServis.getUid()));
    this.mainList$ = this.listCollection.stateChanges().pipe(map(changes  => {
      return changes.map( change => {
        const data = change.payload.doc.data() as SalesInvoiceModel;
        data.primaryKey = change.payload.doc.id;
        return this.db.collection('tblCustomer').doc(data.customerCode).valueChanges()
        .pipe(map( (customer: CustomerModel) => {
          return Object.assign({data, customerName: customer.name, actionType: change.type}); }));
      });
    }), flatMap(feeds => combineLatest(feeds)));
    return this.mainList$;
  }

  getMainItemsBetweenDates(startDate: Date, endDate: Date): Observable<SalesInvoiceModel[]> {
    this.listCollection = this.db.collection(this.tableName,
    ref => ref.orderBy('insertDate').startAt(startDate.getTime()).endAt(endDate.getTime())
    .where('userPrimaryKey', '==', this.authServis.getUid()));
    this.mainList$ = this.listCollection.stateChanges().pipe(map(changes  => {
      return changes.map( change => {
        const data = change.payload.doc.data() as SalesInvoiceModel;
        data.primaryKey = change.payload.doc.id;
        return this.db.collection('tblCustomer').doc(data.customerCode).valueChanges()
        .pipe(map( (customer: CustomerModel) => {
          return Object.assign({data, customerName: customer.name, actionType: change.type}); }));
      });
    }), flatMap(feeds => combineLatest(feeds)));
    return this.mainList$;
  }

  getMainItemsBetweenDatesWithCustomer(startDate: Date, endDate: Date, customerPrimaryKey: any): Observable<SalesInvoiceModel[]> {
    this.listCollection = this.db.collection(this.tableName,
      ref => {
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
        const data = change.payload.doc.data() as SalesInvoiceModel;
        data.primaryKey = change.payload.doc.id;
        return this.db.collection('tblCustomer').doc(data.customerCode).valueChanges()
          .pipe(map( (customer: CustomerModel) => {
            return Object.assign({data, customerName: customer.name, actionType: change.type}); }));
      });
    }), flatMap(feeds => combineLatest(feeds)));
    return this.mainList$;
  }
}
