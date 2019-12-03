import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { AuthenticationService } from './authentication.service';
import { LogModel } from '../models/log-model';
import { Observable, combineLatest } from 'rxjs';
import { CustomerModel } from '../models/customer-model';
import { map, flatMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class LogService {
  listCollection: AngularFirestoreCollection<LogModel>;
  mainList$: Observable<LogModel[]>;
  tableName = 'tblLogs';

  constructor(public authServis: AuthenticationService,
              public db: AngularFirestore) {

  }

  async setItem(record: LogModel) {
    return await this.db.collection(this.tableName).add(Object.assign({}, record));
  }

  getNotificationsBetweenDates(startDate: Date, endDate: Date): Observable < LogModel[] > {
   this.listCollection = this.db.collection(this.tableName,
    ref => ref.orderBy('insertDate').where('userPrimaryKey', '==', this.authServis.getUid()).where('isActive', '==', true)
    .startAt(startDate.getTime()).endAt(endDate.getTime()));
   this.mainList$ = this.listCollection.stateChanges().pipe(map(changes  => {
   return changes.map( change => {
     const data = change.payload.doc.data() as LogModel;
     data.primaryKey = change.payload.doc.id;
     return this.db.collection('tblCustomer').doc('-1').valueChanges().pipe(map( (customer: CustomerModel) => {
       return Object.assign({data, actionType: change.type}); }));
   });
 }), flatMap(feeds => combineLatest(feeds)));
   return this.mainList$;
 }

 async sendToLog(record: any, proccess: string, systemModule: string) {
   const item = new LogModel();
   item.parentType = systemModule;
   item.parentPrimaryKey = record.primaryKey;
   item.type = 'notification';
   item.userPrimaryKey = this.authServis.getUid();
   item.isActive = true;
   item.insertDate = Date.now();
   if (systemModule === 'salesInvoice') {
    item.log = record.receiptNo + ' fiş numaralı Satış Faturası ';

   } else if (systemModule === 'collection') {
    item.log = record.receiptNo + ' fiş numaralı Tahsilat ';

   } else if (systemModule === 'purchaseInvoice') {
    item.log = record.receiptNo + ' fiş numaralı Alım Faturası ';

   } else if (systemModule === 'payment') {
    item.log = record.receiptNo + ' fiş numaralı Ödeme ';

   } else if (systemModule === 'customer') {
    item.log = record.receiptNo + ' fiş numaralı Müşteri ';

   } else if (systemModule === 'cashDesk') {
    item.log = record.receiptNo + ' fiş numaralı Kasa ';

   } else if (systemModule === 'accountVoucher') {
    item.log = record.receiptNo + ' fiş numaralı Hesap Fişi ';

   } else if (systemModule === 'cashdeskVoucher') {
    item.log = record.receiptNo + ' fiş numaralı Kasa Fişi ';

   } else if (systemModule === 'crm') {
     item.log = ' Etkinlik ';

   } else if (systemModule === 'visit') {
    item.log = record.customerName + ' müşteriye Ziyaret ';

   } else if (systemModule === 'fileUpload') {
    item.log = record.fileName + ' isimli dosya ';

   } else {
    item.log = ' bilinmeyen modül ';

   }

   if (proccess === 'insert') {
     item.log += 'oluşturuldu.';
   }  else if (proccess === 'update') {
    item.log += 'güncellendi.';
   } else if (proccess === 'delete') {
    item.log += 'kaldırıldı.';
   } else {
     //
   }
   return await this.setItem(item);
 }

 async updateItem(record: LogModel) {
   return await this.db.collection(this.tableName).doc(record.primaryKey).update(record);
 }

 getMainItems(): Observable<LogModel[]> {
   this.listCollection = this.db.collection(this.tableName,
   ref => ref.orderBy('insertDate').where('userPrimaryKey', '==', this.authServis.getUid()));
   this.mainList$ = this.listCollection.stateChanges().pipe(map(changes  => {
     return changes.map( change => {
       const data = change.payload.doc.data() as LogModel;
       data.primaryKey = change.payload.doc.id;
       return this.db.collection('tblCustomer').doc('-1').valueChanges()
       .pipe(map( (customer: CustomerModel) => {
         return Object.assign({data, actionType: change.type}); }));
     });
   }), flatMap(feeds => combineLatest(feeds)));
   return this.mainList$;
 }

 getNotifications(startDate: Date, endDate: Date): Observable<LogModel[]> {
   this.listCollection = this.db.collection(this.tableName,
   ref => ref.orderBy('insertDate').startAt(startDate.getTime()).endAt(endDate.getTime())
   .where('type', '==', 'notification').where('userPrimaryKey', '==', this.authServis.getUid()));
   this.mainList$ = this.listCollection.stateChanges().pipe(map(changes  => {
     return changes.map( change => {
       const data = change.payload.doc.data() as LogModel;
       data.primaryKey = change.payload.doc.id;
       return this.db.collection('tblCustomer').doc('-1').valueChanges()
       .pipe(map( (customer: CustomerModel) => {
         return Object.assign({data, actionType: change.type}); }));
     });
   }), flatMap(feeds => combineLatest(feeds)));
   return this.mainList$;
 }

}
