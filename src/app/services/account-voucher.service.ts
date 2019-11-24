import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { Observable } from 'rxjs/Observable';
import { CustomerModel } from '../models/customer-model';
import { map, flatMap } from 'rxjs/operators';
import { combineLatest } from 'rxjs';
import { AuthenticationService } from './authentication.service';
import { AccountVoucherModel } from '../models/account-voucher-model';
import { LogService } from './log.service';

@Injectable({
  providedIn: 'root'
})
export class AccountVoucherService {
  listCollection: AngularFirestoreCollection<AccountVoucherModel>;
  mainList$: Observable<AccountVoucherModel[]>;
  listCusttomer: AngularFirestoreCollection<CustomerModel>;
  customerList$: Observable<CustomerModel[]>;
  tableName = 'tblAccountVoucher';

  constructor(public authServis: AuthenticationService,
              public logService: LogService,
              public db: AngularFirestore) {

  }

  getAllItems(): Observable<AccountVoucherModel[]> {
    this.listCollection = this.db.collection<AccountVoucherModel>(this.tableName,
    ref => ref.orderBy('insertDate').where('userPrimaryKey', '==', this.authServis.getUid()));
    this.mainList$ = this.listCollection.valueChanges({ idField : 'primaryKey'});
    return this.mainList$;
  }

  async addItem(record: AccountVoucherModel) {
    this.logService.sendToLog(record, 'insert', 'accountVoucher');
    return await this.listCollection.add(record);
  }

  async removeItem(record: AccountVoucherModel) {
    this.logService.sendToLog(record, 'delete', 'accountVoucher');
    return await this.db.collection(this.tableName).doc(record.primaryKey).delete();
  }

  async updateItem(record: AccountVoucherModel) {
    this.logService.sendToLog(record, 'update', 'accountVoucher');
    return await this.db.collection(this.tableName).doc(record.primaryKey).update(record);
  }

  async setItem(record: AccountVoucherModel, primaryKey: string) {
    this.logService.sendToLog(record, 'insert', 'accountVoucher');
    return await this.listCollection.doc(primaryKey).set(record);
  }

  getItem(primaryKey: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.collection(this.tableName).doc(primaryKey).get().toPromise().then(doc => {
        if (doc.exists) {
          const data = doc.data() as AccountVoucherModel;
          data.primaryKey = doc.id;
          resolve(Object.assign({data}));
        } else {
          resolve(null);
        }
      });
    });
  }

  getCustomerItems(customerCode: string): Observable<AccountVoucherModel[]> {
    this.listCollection = this.db.collection(this.tableName,
      ref => ref.where('customerCode', '==', customerCode));
    this.mainList$ = this.listCollection.stateChanges().pipe(
      map(changes =>
        changes.map(c => {
          const data = c.payload.doc.data() as AccountVoucherModel;
          data.primaryKey = c.payload.doc.id;
          return Object.assign({data, actionType: c.type});
        })
      )
    );
    return this.mainList$;
  }

  getMainItems(): Observable<AccountVoucherModel[]> {
    this.listCollection = this.db.collection(this.tableName,
    ref => ref.orderBy('insertDate').where('userPrimaryKey', '==', this.authServis.getUid()));
    this.mainList$ = this.listCollection.stateChanges().pipe(map(changes  => {
      return changes.map( change => {
        const data = change.payload.doc.data() as AccountVoucherModel;
        data.primaryKey = change.payload.doc.id;
        return this.db.collection('tblCustomer').doc(data.customerCode).valueChanges()
        .pipe(map( (customer: CustomerModel) => {
          return Object.assign({data, customerName: customer.name, actionType: change.type}); }));
      });
    }), flatMap(feeds => combineLatest(feeds)));
    return this.mainList$;
  }

  getMainItemsBetweenDates(startDate: Date, endDate: Date): Observable<AccountVoucherModel[]> {
    this.listCollection = this.db.collection(this.tableName,
    ref => ref.orderBy('insertDate').startAt(startDate.getTime()).endAt(endDate.getTime())
    .where('userPrimaryKey', '==', this.authServis.getUid()));
    this.mainList$ = this.listCollection.stateChanges().pipe(map(changes  => {
      return changes.map( change => {
        const data = change.payload.doc.data() as AccountVoucherModel;
        data.primaryKey = change.payload.doc.id;
        return this.db.collection('tblCustomer').doc(data.customerCode).valueChanges()
        .pipe(map( (customer: CustomerModel) => {
          return Object.assign({data, customerName: customer.name, actionType: change.type}); }));
      });
    }), flatMap(feeds => combineLatest(feeds)));
    return this.mainList$;
  }
}
