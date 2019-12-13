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

  constructor(protected authService: AuthenticationService,
              protected db: AngularFirestore) {

  }

  async setItem(record: LogModel) {
    return await this.db.collection(this.tableName).add(Object.assign({}, record));
  }

  getNotificationsBetweenDates(startDate: Date, endDate: Date): Observable < LogModel[] > {
   this.listCollection = this.db.collection(this.tableName,
    ref => ref.orderBy('insertDate')
      .where('userPrimaryKey', '==', this.authService.getUid())
      .where('isActive', '==', true)
      .where('type', '==', 'notification')
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

 async sendToLog(record: any, action: string, systemModule: string) {
   // main model mantigindaki modellerde problem olusuyor. main model icerisindeki modelden primary keyler alamiyor.
   const item = new LogModel();
   item.parentType = systemModule;
   item.parentPrimaryKey = record.primaryKey;
   item.type = 'notification';
   item.userPrimaryKey = this.authService.getUid();
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

   } else if (systemModule === 'customerTarget') {
    item.parentPrimaryKey = record.data.primaryKey;
    item.log = record.customerName + ' müşteriye Hedef ';

   } else {
    item.log = ' bilinmeyen modül ';

   }

   if (action === 'insert') {
     item.log += 'oluşturuldu.';
   }  else if (action === 'update') {
    item.log += 'güncellendi.';
   } else if (action === 'delete') {
    item.log += 'kaldırıldı.';
   } else {
     //
   }
   return await this.setItem(item);
 }

 async addToLog(parentType: string, primaryKey: string, type: string, userPrimaryKey: string, log: string) {
   const item = new LogModel();
   item.parentType = parentType;
   item.parentPrimaryKey = primaryKey;
   item.type = type;
   item.userPrimaryKey = userPrimaryKey;
   item.isActive = true;
   item.log = log;
   item.insertDate = Date.now();
   return await this.setItem(item);
 }

 async updateItem(record: LogModel) {
   return await this.db.collection(this.tableName).doc(record.primaryKey).update(record);
 }

 getMainItems(): Observable<LogModel[]> {
   this.listCollection = this.db.collection(this.tableName,
   ref => ref.orderBy('insertDate').where('userPrimaryKey', '==', this.authService.getUid()));
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
   .where('type', '==', 'notification').where('userPrimaryKey', '==', this.authService.getUid()));
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
