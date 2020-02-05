import { Injectable } from '@angular/core';
import {AngularFirestore, AngularFirestoreCollection, CollectionReference, Query} from '@angular/fire/firestore';
import { Observable } from 'rxjs/Observable';
import { CustomerModel } from '../models/customer-model';
import { map, flatMap } from 'rxjs/operators';
import { combineLatest } from 'rxjs';
import { CollectionModel } from '../models/collection-model';
import { AuthenticationService } from './authentication.service';
import { LogService } from './log.service';
import {SettingService} from './setting.service';
import {CollectionMainModel} from '../models/collection-main-model';
import {ProfileService} from './profile.service';
import {AccountVoucherMainModel} from '../models/account-voucher-main-model';

@Injectable({
  providedIn: 'root'
})
export class CollectionService {
  listCollection: AngularFirestoreCollection<CollectionModel>;
  mainList$: Observable<CollectionMainModel[]>;
  customerList$: Observable<CustomerModel[]>;
  employeeMap = new Map();
  tableName = 'tblCollection';

  constructor(public authService: AuthenticationService, public sService: SettingService,
              public logService: LogService, public eService: ProfileService, public db: AngularFirestore) {

    if (this.authService.isUserLoggedIn()) {
      this.eService.getItems().subscribe(list => {
        this.employeeMap.clear();
        this.employeeMap.set('-1', 'Tüm Kullanıcılar');
        list.forEach(item => {
          this.employeeMap.set(item.primaryKey, item.longName);
        });
      });
    }
  }

  async addItem(record: CollectionMainModel) {
    await this.logService.sendToLog(record, 'insert', 'collection');
    await this.sService.increaseCollectionNumber();
    return await this.listCollection.add(Object.assign({}, record.data));
  }

  async removeItem(record: CollectionMainModel) {
    await this.logService.sendToLog(record, 'delete', 'collection');
    return await this.db.collection(this.tableName).doc(record.data.primaryKey).delete();
  }

  async updateItem(record: CollectionMainModel) {
    await this.logService.sendToLog(record, 'update', 'collection');
    return await this.db.collection(this.tableName).doc(record.data.primaryKey).update(Object.assign({}, record.data));
  }

  async setItem(record: CollectionMainModel, primaryKey: string) {
    await this.logService.sendToLog(record, 'insert', 'collection');
    await this.sService.increaseCollectionNumber();
    return await this.listCollection.doc(primaryKey).set(Object.assign({}, record.data));
  }

  clearSubModel(): CollectionModel {

    const returnData = new CollectionModel();
    returnData.primaryKey = null;
    returnData.customerCode = '-1';
    returnData.receiptNo = '';
    returnData.type = '-1';
    returnData.userPrimaryKey = this.authService.getUid();
    returnData.employeePrimaryKey = this.authService.getEid();
    returnData.amount = null;
    returnData.description = '';
    returnData.insertDate = Date.now();

    return returnData;
  }

  clearMainModel(): CollectionMainModel {
    const returnData = new CollectionMainModel();
    returnData.data = this.clearSubModel();
    returnData.customerName = '';
    returnData.employeeName = this.employeeMap.get(returnData.data.employeePrimaryKey);
    returnData.actionType = 'added';
    return returnData;
  }

  getItem(primaryKey: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.collection(this.tableName).doc(primaryKey).get().toPromise().then(doc => {
        if (doc.exists) {
          const data = doc.data() as CollectionModel;
          data.primaryKey = doc.id;

          const returnData = new AccountVoucherMainModel();
          returnData.data = data;
          returnData.employeeName = this.employeeMap.get(returnData.data.employeePrimaryKey);
          resolve(Object.assign({returnData}));
        } else {
          resolve(null);
        }
      });
    });
  }

  getCustomerItems(customerCode: string): Observable<CollectionMainModel[]> {
    this.listCollection = this.db.collection(this.tableName,
      ref => ref.where('customerCode', '==', customerCode));
    this.mainList$ = this.listCollection.stateChanges().pipe(
      map(changes =>
        changes.map(c => {
          const data = c.payload.doc.data() as CollectionModel;
          data.primaryKey = c.payload.doc.id;

          const returnData = new CollectionMainModel();
          returnData.actionType = c.type;
          returnData.data = data;
          returnData.employeeName = this.employeeMap.get(returnData.data.employeePrimaryKey);

          return Object.assign({returnData});
        })
      )
    );
    return this.mainList$;
  }

  getMainItems(): Observable<CollectionMainModel[]> {
    this.listCollection = this.db.collection(this.tableName,
    ref => ref.orderBy('insertDate').where('userPrimaryKey', '==', this.authService.getUid()));
    this.mainList$ = this.listCollection.stateChanges().pipe(map(changes  => {
      return changes.map( change => {
        const data = change.payload.doc.data() as CollectionModel;
        data.primaryKey = change.payload.doc.id;

        const returnData = new CollectionMainModel();
        returnData.actionType = change.type;
        returnData.data = data;
        returnData.employeeName = this.employeeMap.get(returnData.data.employeePrimaryKey);

        return this.db.collection('tblCustomer').doc(data.customerCode).valueChanges()
        .pipe(map( (customer: CustomerModel) => {
          returnData.customerName = customer !== undefined ? customer.name : 'Belirlenemeyen Müşteri Kaydı';
          return Object.assign({returnData}); }));
      });
    }), flatMap(feeds => combineLatest(feeds)));
    return this.mainList$;
  }

  getMainItemsBetweenDates(startDate: Date, endDate: Date): Observable<CollectionMainModel[]> {
    this.listCollection = this.db.collection(this.tableName,
      ref => ref.orderBy('insertDate').startAt(startDate.getTime()).endAt(endDate.getTime())
        .where('userPrimaryKey', '==', this.authService.getUid()));
    this.mainList$ = this.listCollection.stateChanges().pipe(map(changes  => {
      return changes.map( change => {
        const data = change.payload.doc.data() as CollectionModel;
        data.primaryKey = change.payload.doc.id;

        const returnData = new CollectionMainModel();
        returnData.actionType = change.type;
        returnData.data = data;
        returnData.employeeName = this.employeeMap.get(returnData.data.employeePrimaryKey);

        return this.db.collection('tblCustomer').doc(data.customerCode).valueChanges()
          .pipe(map( (customer: CustomerModel) => {
            returnData.customerName = customer !== undefined ? customer.name : 'Belirlenemeyen Müşteri Kaydı';
            return Object.assign({returnData}); }));
      });
    }), flatMap(feeds => combineLatest(feeds)));
    return this.mainList$;
  }

  getMainItemsBetweenDatesWithCustomer(startDate: Date, endDate: Date, customerPrimaryKey: any): Observable<CollectionMainModel[]> {
    this.listCollection = this.db.collection(this.tableName,
      ref => {
        let query: CollectionReference | Query = ref;
        query = query.orderBy('insertDate').startAt(startDate.getTime()).endAt(endDate.getTime())
          .where('userPrimaryKey', '==', this.authService.getUid());
        if (customerPrimaryKey !== '-1') {
          query = query.where('customerCode', '==', customerPrimaryKey);
        }
        return query;
      });
    this.mainList$ = this.listCollection.stateChanges().pipe(map(changes  => {
      return changes.map( change => {
        const data = change.payload.doc.data() as CollectionModel;
        data.primaryKey = change.payload.doc.id;

        const returnData = new CollectionMainModel();
        returnData.actionType = change.type;
        returnData.data = data;
        returnData.employeeName = this.employeeMap.get(returnData.data.employeePrimaryKey);

        return this.db.collection('tblCustomer').doc(data.customerCode).valueChanges()
          .pipe(map( (customer: CustomerModel) => {
            returnData.customerName = customer !== undefined ? customer.name : 'Belirlenemeyen Müşteri Kaydı';
            return Object.assign({returnData}); }));
      });
    }), flatMap(feeds => combineLatest(feeds)));
    return this.mainList$;
  }
}
