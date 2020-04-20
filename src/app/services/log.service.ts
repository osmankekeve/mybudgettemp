import {Injectable} from '@angular/core';
import {AngularFirestore, AngularFirestoreCollection} from '@angular/fire/firestore';
import {AuthenticationService} from './authentication.service';
import {LogModel} from '../models/log-model';
import {Observable, combineLatest} from 'rxjs';
import {CustomerModel} from '../models/customer-model';
import {map, flatMap} from 'rxjs/operators';

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

  getNotificationsBetweenDates(startDate: Date, endDate: Date): Observable<LogModel[]> {
    this.listCollection = this.db.collection(this.tableName,
      ref => ref.orderBy('insertDate')
        .where('userPrimaryKey', '==', this.authService.getUid())
        .where('isActive', '==', true)
        .where('type', '==', 'notification')
        .startAt(startDate.getTime()).endAt(endDate.getTime()));
    this.mainList$ = this.listCollection.stateChanges().pipe(map(changes => {
      return changes.map(change => {
        const data = change.payload.doc.data() as LogModel;
        data.primaryKey = change.payload.doc.id;
        return this.db.collection('tblCustomer').doc('-1').valueChanges().pipe(map((customer: CustomerModel) => {
          return Object.assign({data, actionType: change.type});
        }));
      });
    }), flatMap(feeds => combineLatest(feeds)));
    return this.mainList$;
  }

  async sendToLog(record: any, action: string, systemModule: string) {
    // main model mantigindaki modellerde problem olusuyor. main model icerisindeki modelden primary keyler alamiyor.
    const item = new LogModel();
    item.parentType = systemModule;
    item.type = 'notification';
    item.userPrimaryKey = this.authService.getUid();
    item.employeePrimaryKey = this.authService.getEid();
    item.isActive = true;
    item.insertDate = Date.now();
    if (systemModule === 'salesInvoice') {
      item.parentPrimaryKey = record.data.primaryKey;
      item.log = record.data.receiptNo + ' fiş numaralı Satış Faturası ';

    } else if (systemModule === 'collection') {
      item.parentPrimaryKey = record.data.primaryKey;
      item.log = record.data.receiptNo + ' fiş numaralı Tahsilat ';

    } else if (systemModule === 'purchaseInvoice') {
      item.parentPrimaryKey = record.data.primaryKey;
      item.log = record.data.receiptNo + ' fiş numaralı Alım Faturası ';

    } else if (systemModule === 'payment') {
      item.parentPrimaryKey = record.data.primaryKey;
      item.log = record.data.receiptNo + ' fiş numaralı Ödeme ';

    }  else if (systemModule === 'cashDesk') {
      item.parentPrimaryKey = record.primaryKey;
      item.log = record.receiptNo + ' fiş numaralı Kasa ';

    } else if (systemModule === 'accountVoucher') {
      item.parentPrimaryKey = record.primaryKey;
      item.log = record.receiptNo + ' fiş numaralı Hesap Fişi ';

    } else if (systemModule === 'cashdeskVoucher') {
      item.parentPrimaryKey = record.data.primaryKey;
      item.log = record.data.receiptNo + ' fiş numaralı Kasa Fişi ';

    } else if (systemModule === 'crm') {
      item.parentPrimaryKey = record.data.primaryKey;
      item.log = ' Etkinlik ';

    } else if (systemModule === 'visit') {
      item.parentPrimaryKey = record.visit.primaryKey;
      item.log = record.customerName + ' müşteriye Ziyaret ';

    } else if (systemModule === 'fileUpload') {
      item.parentPrimaryKey = record.primaryKey;
      item.log = record.fileName + ' isimli dosya ';

    } else if (systemModule === 'customerTarget') {
      item.parentPrimaryKey = record.data.primaryKey;
      item.log = record.customerName + ' müşteriye Hedef ';

    } else if (systemModule === 'mail') {
      item.parentPrimaryKey = record.data.primaryKey;
      item.log = record.customerName + ' alıcısına mail  (' + record.isSendTr + ') ';

    } else if (systemModule === 'customer-account') {
      item.parentPrimaryKey = record.data.primaryKey;
      item.log = record.customer.name + ' hesap ';

    } else if (systemModule === 'customer') {
      item.parentPrimaryKey = record.data.primaryKey;
      item.log = record.data.name + ' isimli Müşteri ';

    } else {
      item.log = ' bilinmeyen modül ';
    }

    if (action === 'insert') {
      item.log += 'oluşturuldu.';
    } else if (action === 'update') {
      item.log += 'güncellendi.';
    } else if (action === 'delete') {
      item.log += 'kaldırıldı.';
    } else if (action === 'approved') {
      item.log += 'onaylandı.';
    } else if (action === 'rejected') {
      item.log += 'geri çevrildi.';
    } else {
      //
    }
    return await this.setItem(item);
  }

  async addToLog(parentType: string, parentPrimaryKey: string, type: string, log: string) {
    const item = new LogModel();
    item.parentType = parentType;
    item.parentPrimaryKey = parentPrimaryKey;
    item.type = type; // notification
    item.userPrimaryKey = this.authService.getUid();
    item.employeePrimaryKey = this.authService.getEid();
    item.isActive = true;
    item.log = log;
    item.insertDate = Date.now();
    return await this.setItem(item);
  }

  async addToBug(log: string): Promise<void> {
    const item = new LogModel();
    item.parentType = '';
    item.parentPrimaryKey = '';
    item.type = 'bug'; // notification
    item.userPrimaryKey = this.authService.getUid();
    item.employeePrimaryKey = this.authService.getEid();
    item.isActive = true;
    item.log = log;
    item.insertDate = Date.now();
    await this.setItem(item);
  }

  async updateItem(record: LogModel) {
    return await this.db.collection(this.tableName).doc(record.primaryKey).update(record);
  }

  getMainItems(): Observable<LogModel[]> {
    this.listCollection = this.db.collection(this.tableName,
      ref => ref.orderBy('insertDate').where('userPrimaryKey', '==', this.authService.getUid()));
    this.mainList$ = this.listCollection.stateChanges().pipe(map(changes => {
      return changes.map(change => {
        const data = change.payload.doc.data() as LogModel;
        data.primaryKey = change.payload.doc.id;
        return this.db.collection('tblCustomer').doc('-1').valueChanges()
          .pipe(map((customer: CustomerModel) => {
            return Object.assign({data, actionType: change.type});
          }));
      });
    }), flatMap(feeds => combineLatest(feeds)));
    return this.mainList$;
  }

  getNotifications(startDate: Date, endDate: Date): Observable<LogModel[]> {
    this.listCollection = this.db.collection(this.tableName,
      ref => ref.orderBy('insertDate').startAt(startDate.getTime()).endAt(endDate.getTime())
        .where('type', '==', 'notification').where('userPrimaryKey', '==', this.authService.getUid()));
    this.mainList$ = this.listCollection.stateChanges().pipe(map(changes => {
      return changes.map(change => {
        const data = change.payload.doc.data() as LogModel;
        data.primaryKey = change.payload.doc.id;
        return this.db.collection('tblCustomer').doc('-1').valueChanges()
          .pipe(map((customer: CustomerModel) => {
            return Object.assign({data, actionType: change.type});
          }));
      });
    }), flatMap(feeds => combineLatest(feeds)));
    return this.mainList$;
  }

}
