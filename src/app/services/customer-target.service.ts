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
import {getTodayForInput, getMonths, currencyFormat, getNumber, getFloat} from '../core/correct-library';
import {CashdeskVoucherModel} from '../models/cashdesk-voucher-model';

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

  checkForSave(record: CustomerTargetMainModel): Promise<string> {
    return new Promise((resolve, reject) => {
      if (record.data.customerCode === '-1' || record.data.customerCode === '') {
        reject('Lütfen müşteri seçiniz.');
      } else if (getNumber(record.data.year) < getTodayForInput().year) {
        reject('Lütfen yıl seçiniz.');
      } else if (record.data.type === 'monthly' && record.data.beginMonth < 1) {
        reject('Lütfen ay seçiniz.');
      } else if (record.data.type === 'periodic' && record.data.beginMonth < 1) {
        reject('Lütfen başlangıç ayı seçiniz.');
      } else if (record.data.type === 'periodic' && record.data.finishMonth < 1) {
        reject('Lütfen bitiş ayı seçiniz.');
      } else if (getFloat(record.data.amount) <= 0) {
        reject('Lütfen hedef giriniz.');
      } else {
        resolve(null);
      }
    });
  }

  checkForRemove(record: CustomerTargetMainModel): Promise<string> {
    return new Promise((resolve, reject) => {
      resolve(null);
    });
  }

  checkFields(model: CustomerTargetModel): CustomerTargetModel {
    const cleanModel = this.clearSubModel();
    if (model.customerCode === undefined) { model.customerCode = cleanModel.customerCode; }
    if (model.type === undefined) { model.type = cleanModel.type; }
    if (model.isActive === undefined) { model.isActive = cleanModel.isActive; }
    if (model.beginMonth === undefined) { model.beginMonth = cleanModel.beginMonth; }
    if (model.finishMonth === undefined) { model.finishMonth = cleanModel.finishMonth; }
    if (model.amount === undefined) { model.amount = cleanModel.amount; }
    if (model.description === undefined) { model.description = cleanModel.description; }

    return model;
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
    returnData.amount = 0;
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
    returnData.amountFormatted = currencyFormat(returnData.data.amount);
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
        returnData.data = this.checkFields(data);
        returnData.actionType = change.type;
        returnData.typeTr = this.typeMap.get(data.type);
        returnData.beginMonthTr = this.months.get(returnData.data.beginMonth.toString());
        returnData.finishMonthTr = this.months.get(returnData.data.finishMonth.toString());
        returnData.amountFormatted = currencyFormat(returnData.data.amount);

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
        returnData.data = this.checkFields(data);
        returnData.actionType = change.type;
        returnData.typeTr = this.typeMap.get(data.type);
        returnData.beginMonthTr = this.months.get(returnData.data.beginMonth.toString());
        returnData.finishMonthTr = this.months.get(returnData.data.finishMonth.toString());
        returnData.amountFormatted = currencyFormat(returnData.data.amount);

        return this.db.collection('tblCustomer').doc(returnData.data.customerCode).valueChanges()
        .pipe(map( (customer: CustomerModel) => {
          returnData.customerName = customer.name;

          return Object.assign({ returnData }); }));
      });
    }), flatMap(feeds => combineLatest(feeds)));
    return this.mainList$;
  }

}
