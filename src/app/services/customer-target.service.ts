import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { Observable } from 'rxjs/Observable';
import { map, flatMap } from 'rxjs/operators';
import { combineLatest } from 'rxjs';
import { AuthenticationService } from './authentication.service';
import { CustomerModel } from '../models/customer-model';
import { CustomerTargetModel } from '../models/customer-target-model';
import { CustomerTargetMainModel } from '../models/customer-target-main-model';
import { LogService } from './log.service';
import { getTodayForInput, getMonths } from '../core/correct-library';

@Injectable({
  providedIn: 'root'
})
export class CustomerTargetService {
  listCollection: AngularFirestoreCollection<CustomerTargetModel>;
  mainList$: Observable<CustomerTargetMainModel[]>;
  tableName = 'tblCustomerTarget';
  typeMap = new Map([['monthly', 'Aylık'], ['yearly', 'Yıllık'], ['periodic', 'Periyodik']]);
  months = getMonths();

  constructor(public authService: AuthenticationService,
              public logService: LogService,
              public db: AngularFirestore) {

  }

  async addItem(record: CustomerTargetMainModel) {
    await this.logService.sendToLog(record, 'insert', 'customerTarget');
    return await this.listCollection.add(Object.assign({}, record.data));
  }

  async removeItem(record: CustomerTargetMainModel) {
    await this.logService.sendToLog(record, 'delete', 'customerTarget');
    return await this.db.collection(this.tableName).doc(record.data.primaryKey).delete();
  }

  async updateItem(record: CustomerTargetMainModel) {
    await this.logService.sendToLog(record, 'update', 'customerTarget');
    return await this.db.collection(this.tableName).doc(record.data.primaryKey).update(Object.assign({}, record.data));
  }

  async getItem(record: CustomerTargetMainModel) {
    return this.db.collection(this.tableName).doc(record.data.primaryKey);
  }

  clearSubModel(): CustomerTargetModel {
    const returnData = new CustomerTargetModel();
    returnData.primaryKey = null;
    returnData.customerCode = '';
    returnData.type = 'yearly';
    returnData.isActive = true;
    returnData.beginMonth = getTodayForInput().month;
    returnData.finishMonth = 12;
    returnData.year = getTodayForInput().year;
    returnData.userPrimaryKey = this.authService.getUid();
    returnData.insertDate = Date.now();

    return returnData;
  }

  clearMainModel(): CustomerTargetMainModel {
    const returnData = new CustomerTargetMainModel();
    returnData.data = this.clearSubModel();
    returnData.typeTr = 'Yıllık';
    returnData.beginMonthTr = this.months.get(returnData.data.beginMonth.toString());
    returnData.finishMonthTr = this.months.get(returnData.data.finishMonth.toString());
    returnData.actionType = 'added';
    return returnData;
  }

  getMainItems(): Observable<CustomerTargetMainModel[]> {
    this.listCollection = this.db.collection<CustomerTargetModel>(this.tableName,
    ref => ref.where('userPrimaryKey', '==', this.authService.getUid()));
    this.mainList$ = this.listCollection.stateChanges().pipe(map(changes  => {
      return changes.map( change => {
        const data = change.payload.doc.data() as CustomerTargetModel;
        data.primaryKey = change.payload.doc.id;

        const returnData = new CustomerTargetMainModel();
        returnData.data = data;
        returnData.actionType = change.type;
        returnData.typeTr = this.typeMap.get(data.type);
        returnData.beginMonthTr = this.months.get(returnData.data.beginMonth.toString());
        returnData.finishMonthTr = this.months.get(returnData.data.finishMonth.toString());

        return this.db.collection('tblCustomer').doc(returnData.data.customerCode).valueChanges()
        .pipe(map( (customer: CustomerModel) => {
          returnData.customerName = customer.name;

          return Object.assign({ returnData }); }));
      });
    }), flatMap(feeds => combineLatest(feeds)));
    return this.mainList$;
  }

  getMainItemsWithCustomerPrimaryKey(customerPrimaryKey: string): Observable<CustomerTargetMainModel[]> {
    this.listCollection = this.db.collection(this.tableName,
    ref => ref.orderBy('insertDate').where('userPrimaryKey', '==', this.authService.getUid())
    .where('customerCode', '==', customerPrimaryKey));
    this.mainList$ = this.listCollection.stateChanges().pipe(map(changes  => {
      return changes.map( change => {
        const data = change.payload.doc.data() as CustomerTargetModel;
        data.primaryKey = change.payload.doc.id;

        const returnData = new CustomerTargetMainModel();
        returnData.data = data;
        returnData.actionType = change.type;
        returnData.typeTr = this.typeMap.get(data.type);
        returnData.beginMonthTr = this.months.get(returnData.data.beginMonth.toString());
        returnData.finishMonthTr = this.months.get(returnData.data.finishMonth.toString());

        return this.db.collection('tblCustomer').doc(returnData.data.customerCode).valueChanges()
        .pipe(map( (customer: CustomerModel) => {
          returnData.customerName = customer.name;

          return Object.assign({ returnData }); }));
      });
    }), flatMap(feeds => combineLatest(feeds)));
    return this.mainList$;
  }

}
