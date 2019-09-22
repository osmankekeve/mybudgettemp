import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
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

  constructor(public authServis: AuthenticationService,
              public logService: LogService,
              public db: AngularFirestore) {

  }

  getAllItems(): Observable<SalesInvoiceModel[]> {
    this.listCollection = this.db.collection<SalesInvoiceModel>('tblSalesInvoice',
    ref => ref.orderBy('insertDate').where('userPrimaryKey', '==', this.authServis.getUid()));
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

  async addItem(record: SalesInvoiceModel) {
    return await this.listCollection.add(record);
  }

  async setItem(record: SalesInvoiceModel, primaryKey: string) {
    this.sendToLog(record, 'insert');
    return await this.listCollection.doc(primaryKey).set(record);
  }

  async removeItem(record: SalesInvoiceModel) {
    await this.sendToLog(record, 'delete');
    return await this.db.collection('tblSalesInvoice').doc(record.primaryKey).delete();
  }

  async updateItem(record: SalesInvoiceModel) {
    this.sendToLog(record, 'update');
    return await this.db.collection('tblSalesInvoice').doc(record.primaryKey).update(record);
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

  getMainItems(): Observable<SalesInvoiceModel[]> {
    this.listCollection = this.db.collection('tblSalesInvoice',
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
}
