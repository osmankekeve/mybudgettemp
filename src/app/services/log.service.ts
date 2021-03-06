import {Injectable} from '@angular/core';
import {AngularFirestore, AngularFirestoreCollection} from '@angular/fire/firestore';
import {AuthenticationService} from './authentication.service';
import {LogModel} from '../models/log-model';
import {Observable, combineLatest} from 'rxjs';
import {CustomerModel} from '../models/customer-model';
import {map, mergeMap} from 'rxjs/operators';
import {ProfileService} from './profile.service';
import {ProfileMainModel} from '../models/profile-main-model';

@Injectable({
  providedIn: 'root'
})
export class LogService {
  listCollection: AngularFirestoreCollection<LogModel>;
  mainList$: Observable<LogModel[]>;
  tableName = 'tblLogs';

  constructor(protected authService: AuthenticationService, protected db: AngularFirestore, protected proService: ProfileService) {

  }

  async setItem(record: LogModel) {
    return await this.db.collection(this.tableName).add(Object.assign({}, record));
  }

  async setItemToUser(record: LogModel, profilePrimaryKey: string) {
    return await this.db.collection('tblProfile').doc(profilePrimaryKey).collection(this.tableName).add(Object.assign({}, record));
  }

  async addToLogUser(parentType: string, parentPrimaryKey: string, type: string, log: string, profilePrimaryKey: string) {
    const item = new LogModel();
    item.parentType = parentType;
    item.parentPrimaryKey = parentPrimaryKey;
    item.type = type; // notification
    item.userPrimaryKey = this.authService.getUid();
    item.employeePrimaryKey = this.authService.getEid();
    item.isActive = true;
    item.log = log;
    item.insertDate = Date.now();
    return await this.setItemToUser(item, profilePrimaryKey);
  }

  async addTransactionLog(record: any, action: string, systemModule: string) {
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
      item.log = record.data.receiptNo + ' fi?? numaral?? Sat???? Faturas??';

    } else if (systemModule === 'collection') {
      item.parentPrimaryKey = record.data.primaryKey;
      item.log = record.data.receiptNo + ' fi?? numaral?? Tahsilat';

    } else if (systemModule === 'purchaseInvoice') {
      item.parentPrimaryKey = record.data.primaryKey;
      item.log = record.data.receiptNo + ' fi?? numaral?? Al??m Faturas??';

    } else if (systemModule === 'payment') {
      item.parentPrimaryKey = record.data.primaryKey;
      item.log = record.data.receiptNo + ' fi?? numaral?? ??deme';

    } else if (systemModule === 'cashDesk') {
      item.parentPrimaryKey = record.primaryKey;
      item.log = record.receiptNo + ' fi?? numaral?? Kasa';

    } else if (systemModule === 'accountVoucher') {
      item.parentPrimaryKey = record.data.primaryKey;
      item.log = record.data.receiptNo + ' fi?? numaral?? Hesap Fi??i';

    } else if (systemModule === 'cashdeskVoucher') {
      item.parentPrimaryKey = record.data.primaryKey;
      item.log = record.data.receiptNo + ' fi?? numaral?? Kasa Fi??i';

    } else if (systemModule === 'crm') {
      item.parentPrimaryKey = record.data.primaryKey;
      item.log = ' Etkinlik ';

    } else if (systemModule === 'visit') {
      item.parentPrimaryKey = record.visit.primaryKey;
      item.log = record.customer.data.name + ' m????teriye ziyaret';

    } else if (systemModule === 'fileUpload') {
      item.parentPrimaryKey = record.primaryKey;
      item.log = record.fileName + ' isimli dosya';

    } else if (systemModule === 'customerTarget') {
      item.parentPrimaryKey = record.data.primaryKey;
      item.log = record.customerName + ' M????teriye Hedef';

    } else if (systemModule === 'mail') {
      item.parentPrimaryKey = record.data.primaryKey;
      item.log = record.customerName + ' al??c??s??na mail  (' + record.isSendTr + ')';

    } else if (systemModule === 'customer-account') {
      item.parentPrimaryKey = record.data.primaryKey;
      item.log = record.data.name  ;

    } else if (systemModule === 'customer') {
      item.parentPrimaryKey = record.data.primaryKey;
      item.log = record.data.name + ' isimli M????teri';

    } else if (systemModule === 'product') {
      item.parentPrimaryKey = record.data.primaryKey;
      item.log = record.data.productName + '(' + record.data.productCode + ')' + ' isimli ??r??n';

    } else if (systemModule === 'product-unit') {
      item.parentPrimaryKey = record.data.primaryKey;
      item.log = record.data.unitName + ' isimli ??r??n Birimi';

    } else if (systemModule === 'product-price') {
      item.parentPrimaryKey = record.data.primaryKey;
      item.log = record.product.data.productName + ' isimli ??r??ne Fiyat';

    } else if (systemModule === 'product-discount') {
      item.parentPrimaryKey = record.data.primaryKey;
      item.log = record.product.data.productName + ' isimli ??r??ne ??skonto';

    } else if (systemModule === 'product-unit-mapping') {
      item.parentPrimaryKey = record.data.primaryKey;
      item.log = record.product.data.productName + ' isimli ??r??ne ait Birim';

    } else if (systemModule === 'buy-sale') {
      item.parentPrimaryKey = record.data.primaryKey;
      item.log = record.currencyName + ' d??vize ait ' + ' ' + record.transactionTypeTr + ' i??lemi';

    } else if (systemModule === 'salesOrder') {
      item.parentPrimaryKey = record.data.primaryKey;
      item.log = record.data.receiptNo + ' fi?? numaral?? Sat???? Sipari??i';

    } else if (systemModule === 'purchaseOrder') {
      item.parentPrimaryKey = record.data.primaryKey;
      item.log = record.data.receiptNo + ' fi?? numaral?? Al??m Sipari??i';

    } else if (systemModule === 'campaign') {
      item.parentPrimaryKey = record.data.primaryKey;
      item.log = record.data.code + ' kodlu Kampanya';

    } else if (systemModule === 'price-list') {
      item.parentPrimaryKey = record.data.primaryKey;
      item.log = record.data.listName + ' isimli Fiyat Listesi';

    } else if (systemModule === 'discount-list') {
      item.parentPrimaryKey = record.data.primaryKey;
      item.log = record.data.listName + ' isimli iskonto Listesi';

    } else if (systemModule === 'stock-voucher') {
      item.parentPrimaryKey = record.data.primaryKey;
      item.log = record.data.receiptNo + ' fi?? numaral?? Stok Fi??i';

    } else {
      item.log = ' bilinmeyen mod??l ';
    }

    if (action === 'insert') {
      item.log += ' olu??turuldu.';
    } else if (action === 'update') {
      item.log += ' g??ncellendi.';
    } else if (action === 'delete') {
      item.log += ' kald??r??ld??.';
    } else if (action === 'approved') {
      item.log += ' onayland??.';
    } else if (action === 'rejected') {
      item.log += ' geri ??evrildi.';
    } else if (action === 'closed') {
      item.log += ' kapat??ld??.';
    } else if (action === 'canceled') {
      item.log += 'iptal edildi.';
    } else if (action === 'done') {
      item.log += ' i??lemler bitirildi.';
    } else {
      //
    }

    Promise.all([this.proService.getMainItemsAsPromise()])
      .then((values: any) => {
        if (values[0] !== undefined || values[0] !== null) {
          const returnData = values[0] as Array<ProfileMainModel>;
          // tslint:disable-next-line:no-shadowed-variable
          returnData.forEach((record) => {
            this.setItemToUser(item, record.data.primaryKey);
          });
        }
      });
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
    this.listCollection = this.db.collection('tblProfile').doc(this.authService.getEid()).collection(this.tableName,
      ref => ref.orderBy('insertDate'));
    this.mainList$ = this.listCollection.stateChanges().pipe(map(changes => {
      return changes.map(change => {
        const data = change.payload.doc.data() as LogModel;
        data.primaryKey = change.payload.doc.id;
        return this.db.collection('tblCustomer').doc('-1').valueChanges()
          .pipe(map((customer: CustomerModel) => {
            return Object.assign({data, actionType: change.type});
          }));
      });
    }), mergeMap(feeds => combineLatest(feeds)));
    return this.mainList$;
  }

  getNotifications(startDate: Date, endDate: Date): Observable<LogModel[]> {
    this.listCollection = this.db.collection('tblProfile').doc(this.authService.getEid()).collection(this.tableName,
      ref => ref.orderBy('insertDate').startAt(startDate.getTime()).endAt(endDate.getTime())
        .where('type', '==', 'notification'));
    this.mainList$ = this.listCollection.stateChanges().pipe(map(changes => {
      return changes.map(change => {
        const data = change.payload.doc.data() as LogModel;
        data.primaryKey = change.payload.doc.id;
        return this.db.collection('tblCustomer').doc('-1').valueChanges()
          .pipe(map((customer: CustomerModel) => {
            return Object.assign({data, actionType: change.type});
          }));
      });
    }), mergeMap(feeds => combineLatest(feeds)));
    return this.mainList$;
  }

  getNotificationsBetweenDates_remove(startDate: Date, endDate: Date): Observable<LogModel[]> {
    this.listCollection = this.db.collection('tblProfile').doc(this.authService.getEid()).collection(this.tableName,
      ref => ref.orderBy('insertDate')
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
    }), mergeMap(feeds => combineLatest(feeds)));
    return this.mainList$;
  }

  getNotificationsBetweenDates(startDate: Date, endDate: Date): Observable<LogModel[]> {
    // left join siz
    this.listCollection = this.db.collection('tblProfile').doc(this.authService.getEid()).collection(this.tableName,
      ref => ref.orderBy('insertDate')
        .where('isActive', '==', true)
        .where('type', '==', 'notification')
        .startAt(startDate.getTime()).endAt(endDate.getTime()));
    this.mainList$ = this.listCollection.stateChanges().pipe(
      map(changes =>
        changes.map(c => {
          const data = c.payload.doc.data() as LogModel;
          data.primaryKey = c.payload.doc.id;
          return Object.assign({data, actionType: c.type});
        })
      )
    );
    return this.mainList$;
  }

}
