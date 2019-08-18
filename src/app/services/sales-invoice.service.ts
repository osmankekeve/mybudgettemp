import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { Observable } from 'rxjs/Observable';
import { CustomerModel } from '../models/customer-model';
import { map, flatMap } from 'rxjs/operators';
import { combineLatest } from 'rxjs';
import { SalesInvoiceModel } from '../models/sales-invoice-model';

@Injectable({
  providedIn: 'root'
})
export class SalesInvoiceService {
  listCollection: AngularFirestoreCollection<SalesInvoiceModel>;
  mainList$: Observable<SalesInvoiceModel[]>;
  listCusttomer: AngularFirestoreCollection<CustomerModel>;
  customerList$: Observable<CustomerModel[]>;

  constructor(public db: AngularFirestore) {

  }

  getAllItems(): Observable<SalesInvoiceModel[]> {
    this.listCollection = this.db.collection<SalesInvoiceModel>('tblSalesInvoice');
    this.mainList$ = this.listCollection.valueChanges({ idField : 'primaryKey'});
    return this.mainList$;
  }

  getCustomerItems(customerCode: string): Observable<SalesInvoiceModel[]> {
    // valueChanges gercek zamanli guncelleme
    this.listCollection = this.db.collection<SalesInvoiceModel>
    ('tblSalesInvoice', ref => ref.where('customerCode', '==', customerCode));
    this.mainList$ = this.listCollection.valueChanges({ idField : 'primaryKey'});
    return this.mainList$;
  }

  addItem(record: SalesInvoiceModel) {
    this.listCollection.add(record);
  }

  removeItem(record: SalesInvoiceModel) {
    this.db.collection('tblSalesInvoice').doc(record.primaryKey).delete();
  }

  updateItem(record: SalesInvoiceModel) {
    this.db.collection('tblSalesInvoice').doc(record.primaryKey).update(record);
  }

  getItems(): Observable<SalesInvoiceModel[]> {
    this.listCollection = this.db.collection('tblSalesInvoice');
    this.mainList$ = this.listCollection.snapshotChanges().pipe(map(changes  => {
      return changes.map( change => {
        const data = change.payload.doc.data() as SalesInvoiceModel;
        data.primaryKey = change.payload.doc.id;
        return this.db.collection('tblCustomer').doc(data.customerCode).valueChanges().pipe(map( (customer: CustomerModel) => {
            return Object.assign({data, customerName: customer.name}); }));
            /* data.customer = customer;
            return Object.assign({data}); })); */
      });
    }), flatMap(feeds => combineLatest(feeds)));
    return this.mainList$;
  }
}
