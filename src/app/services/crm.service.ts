import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { Observable } from 'rxjs/Observable';
import { CustomerModel } from '../models/customer-model';
import { map, flatMap } from 'rxjs/operators';
import { combineLatest } from 'rxjs';
import { AccountTransactionModel } from '../models/account-transaction-model';
import { AuthenticationService } from './authentication.service';
import { LogService } from './log.service';
import { CustomerRelationModel } from '../models/customer-relation-model';

@Injectable({
  providedIn: 'root'
})
export class CustomerRelationService {
  listCollection: AngularFirestoreCollection<CustomerRelationModel>;
  mainList$: Observable<CustomerRelationModel[]>;
  atMod: AccountTransactionModel;
  tableName = 'tblCustomerRelation';
  relationTypeMap = new Map([['meeting', 'Toplanti'], ['mailSending', 'Mail Gönderim'],
  ['faxSending', 'Fax Gönderim'], ['phoneCall', 'Telefon Görüşmesi'], ['travel', 'Seyahat'], ['visit', 'Ziyaret']]);

  constructor(public authServis: AuthenticationService,
              public logService: LogService,
              public db: AngularFirestore) {

  }

  getAllItems(): Observable<CustomerRelationModel[]> {
    this.listCollection = this.db.collection<CustomerRelationModel>(this.tableName,
    ref => ref.orderBy('insertDate').where('userPrimaryKey', '==', this.authServis.getUid()));
    this.mainList$ = this.listCollection.valueChanges({ idField : 'primaryKey'});
    return this.mainList$;
  }

  getCustomerItems(customerCode: string): Observable<CustomerRelationModel[]> {
    // valueChanges gercek zamanli guncelleme
    this.listCollection = this.db.collection<CustomerRelationModel>
    (this.tableName, ref => ref.where('customerCode', '==', customerCode));
    this.mainList$ = this.listCollection.valueChanges({ idField : 'primaryKey'});
    return this.mainList$;
  }

  async addItem(record: CustomerRelationModel) {
    this.logService.sendToLog(record, 'insert', 'crm');
    return await this.listCollection.add(record);
  }

  async removeItem(record: CustomerRelationModel) {
      this.logService.sendToLog(record, 'delete', 'crm');
      return await this.db.collection(this.tableName).doc(record.primaryKey).delete();
  }

  async updateItem(record: CustomerRelationModel) {
    this.logService.sendToLog(record, 'update', 'crm');
    return await this.db.collection(this.tableName).doc(record.primaryKey).update(record);
  }

  async setItem(record: CustomerRelationModel, primaryKey: string) {
    this.logService.sendToLog(record, 'insert', 'crm');
    return await this.listCollection.doc(primaryKey).set(record);
  }

  getMainItems(): Observable<CustomerRelationModel[]> {
    this.listCollection = this.db.collection(this.tableName,
    ref => ref.orderBy('actionDate').where('userPrimaryKey', '==', this.authServis.getUid()));
    this.mainList$ = this.listCollection.stateChanges().pipe(map(changes  => {
      return changes.map( change => {
        const data = change.payload.doc.data() as CustomerRelationModel;
        data.primaryKey = change.payload.doc.id;
        return this.db.collection('tblCustomer').doc(data.parentPrimaryKey).valueChanges()
        .pipe(map( (customer: CustomerModel) => {
          return Object.assign({data, customerName: customer.name, actionType: change.type,
            relationTypeTR: this.relationTypeMap.get(data.relationType)}); }));
      });
    }), flatMap(feeds => combineLatest(feeds)));
    return this.mainList$;
  }

  getMainItemsBetweenDates(startDate: Date, endDate: Date): Observable<CustomerRelationModel[]> {
    this.listCollection = this.db.collection(this.tableName,
    ref => ref.orderBy('actionDate').startAt(startDate.getTime()).endAt(endDate.getTime())
    .where('userPrimaryKey', '==', this.authServis.getUid()));
    this.mainList$ = this.listCollection.stateChanges().pipe(map(changes  => {
      return changes.map( change => {
        const data = change.payload.doc.data() as CustomerRelationModel;
        data.primaryKey = change.payload.doc.id;
        return this.db.collection('tblCustomer').doc(data.parentPrimaryKey).valueChanges()
        .pipe(map( (customer: CustomerModel) => {
          return Object.assign({data, customerName: customer.name, actionType: change.type,
            relationTypeTR: this.relationTypeMap.get(data.relationType)}); }));
      });
    }), flatMap(feeds => combineLatest(feeds)));
    return this.mainList$;
  }

  getMainItemsAfterDate(afterDate: Date): Observable<CustomerRelationModel[]> {
    this.listCollection = this.db.collection(this.tableName,
    ref => ref.orderBy('actionDate').startAfter(afterDate.getTime())
    .where('userPrimaryKey', '==', this.authServis.getUid()));
    this.mainList$ = this.listCollection.stateChanges().pipe(map(changes  => {
      return changes.map( change => {
        const data = change.payload.doc.data() as CustomerRelationModel;
        data.primaryKey = change.payload.doc.id;
        return this.db.collection('tblCustomer').doc(data.parentPrimaryKey).valueChanges()
        .pipe(map( (customer: CustomerModel) => {
          return Object.assign({data, customerName: customer.name, actionType: change.type,
            relationTypeTR: this.relationTypeMap.get(data.relationType)}); }));
      });
    }), flatMap(feeds => combineLatest(feeds)));
    return this.mainList$;
  }

  getMainItemsBeforeDate(beforeDate: Date): Observable<CustomerRelationModel[]> {
    this.listCollection = this.db.collection(this.tableName,
    ref => ref.orderBy('actionDate').endBefore(beforeDate.getTime())
    .where('userPrimaryKey', '==', this.authServis.getUid()));
    this.mainList$ = this.listCollection.stateChanges().pipe(map(changes  => {
      return changes.map( change => {
        const data = change.payload.doc.data() as CustomerRelationModel;
        data.primaryKey = change.payload.doc.id;
        return this.db.collection('tblCustomer').doc(data.parentPrimaryKey).valueChanges()
        .pipe(map( (customer: CustomerModel) => {
          return Object.assign({data, customerName: customer.name, actionType: change.type,
            relationTypeTR: this.relationTypeMap.get(data.relationType)}); }));
      });
    }), flatMap(feeds => combineLatest(feeds)));
    return this.mainList$;
  }
}
