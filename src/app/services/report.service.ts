import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { Observable } from 'rxjs/Observable';
import { CustomerModel } from '../models/customer-model';
import { map, flatMap } from 'rxjs/operators';
import { combineLatest } from 'rxjs';
import { SalesInvoiceModel } from '../models/sales-invoice-model';
import { AuthenticationService } from './authentication.service';
import { CustomerService } from './customer.service';

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  listCollection: AngularFirestoreCollection<SalesInvoiceModel>;
  mainList$: Observable<SalesInvoiceModel[]>;
  listCusttomer: AngularFirestoreCollection<CustomerModel>;
  customerList$: Observable<CustomerModel[]>;

  constructor(public authServis: AuthenticationService,
              public customerService: CustomerService,
              public db: AngularFirestore) {

  }

  getItems(): Observable<SalesInvoiceModel[]> {

    this.customerService.getAllItems().toPromise().then(list => {
      list.forEach(customer => {
        this.db.collection('tblAccountTransaction', ref => ref.where('parentPrimaryKey', '==', customer.primaryKey));

      });





    });








    this.listCollection = this.db.collection('tblSalesInvoice',
    ref => ref.orderBy('insertDate').where('userPrimaryKey', '==', this.authServis.getUid()));
    this.mainList$ = this.listCollection.snapshotChanges().pipe(map(changes  => {
      return changes.map( change => {
        const data = change.payload.doc.data() as SalesInvoiceModel;
        data.primaryKey = change.payload.doc.id;
        return this.db.collection('tblCustomer').doc(data.customerCode).valueChanges().pipe(map( (customer: CustomerModel) => {
            return Object.assign({data, customerName: customer.name}); }));
      });
    }), flatMap(feeds => combineLatest(feeds)));
    return this.mainList$;
  }
}