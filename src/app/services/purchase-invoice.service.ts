import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument } from '@angular/fire/firestore';
import { Observable } from 'rxjs/Observable';
import { PurchaseInvoiceModel } from '../models/purchase-invoice-model';
import { CustomerModel } from '../models/customer-model';
import { map, flatMap } from 'rxjs/operators';
import { combineLatest } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PurchaseInvoiceService {
  listCollection: AngularFirestoreCollection<PurchaseInvoiceModel>;
  mainList$: Observable<PurchaseInvoiceModel[]>;
  listCusttomer: AngularFirestoreCollection<CustomerModel>;
  customerList$: Observable<CustomerModel[]>;

  constructor(public db: AngularFirestore) {

  }

  getAllItems(): Observable<PurchaseInvoiceModel[]> {
    this.listCollection = this.db.collection<PurchaseInvoiceModel>('tblPurchaseInvoice');
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

  addItem(record: PurchaseInvoiceModel) {
    this.listCollection.add(record);
  }

  removeItem(record: PurchaseInvoiceModel) {
    this.db.collection('tblPurchaseInvoice').doc(record.primaryKey).delete();
  }

  updateItem(record: PurchaseInvoiceModel) {
    this.db.collection('tblPurchaseInvoice').doc(record.primaryKey).update(record);
  }

  getItems(): Observable<PurchaseInvoiceModel[]> {
    this.listCollection = this.db.collection('tblPurchaseInvoice');
    this.mainList$ = this.listCollection.snapshotChanges().pipe(map(changes  => {
      return changes.map( change => {
        const data = change.payload.doc.data() as PurchaseInvoiceModel;
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
