import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { Observable } from 'rxjs/Observable';
import { map, mergeMap } from 'rxjs/operators';
import { combineLatest } from 'rxjs';
import { AuthenticationService } from './authentication.service';
import { CustomerModel } from '../models/customer-model';
import { CustomerTargetModel } from '../models/customer-target-model';
import { CustomerTargetMainModel } from '../models/customer-target-main-model';
import { LogService } from './log.service';
import {getTodayForInput, getMonths, currencyFormat, getNumber, getFloat, getString} from '../core/correct-library';
import {CashdeskVoucherModel} from '../models/cashdesk-voucher-model';
import {PaymentModel} from '../models/payment-model';
import {PaymentMainModel} from '../models/payment-main-model';
import {SettingService} from './setting.service';
import {CustomerService} from './customer.service';
import {CustomerRelationMainModel} from '../models/customer-relation-main-model';

@Injectable({
  providedIn: 'root'
})
export class CustomerTargetService {
  listCollection: AngularFirestoreCollection<CustomerTargetModel>;
  mainList$: Observable<CustomerTargetMainModel[]>;
  tableName = 'tblCustomerTarget';
  typeMap = new Map([['monthly', 'Aylık'], ['yearly', 'Yıllık'], ['periodic', 'Periyodik']]);
  months = getMonths();

  constructor(public authService: AuthenticationService, public cusService: CustomerService,
              public logService: LogService, public db: AngularFirestore) {

  }

  async addItem(record: CustomerTargetMainModel) {
    await this.logService.addTransactionLog(record, 'insert', 'customerTarget');
    return await this.listCollection.add(Object.assign({}, record.data));
  }
  async setItem(record: CustomerTargetMainModel, primaryKey: string) {
    await this.logService.addTransactionLog(record, 'insert', 'customerTarget');
    return await this.listCollection.doc(primaryKey).set(Object.assign({}, record.data));
  }

  async removeItem(record: CustomerTargetMainModel) {
    await this.logService.addTransactionLog(record, 'delete', 'customerTarget');
    return await this.db.collection(this.tableName).doc(record.data.primaryKey).delete();
  }

  async updateItem(record: CustomerTargetMainModel) {
    await this.logService.addTransactionLog(record, 'update', 'customerTarget');
    return await this.db.collection(this.tableName).doc(record.data.primaryKey).update(Object.assign({}, record.data));
  }

  async getItem(primaryKey: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.collection(this.tableName).doc(primaryKey).get().toPromise().then(doc => {
        if (doc.exists) {
          const data = doc.data() as CustomerTargetModel;
          data.primaryKey = doc.id;

          const returnData = new CustomerTargetMainModel();
          returnData.data = this.checkFields(data);
          returnData.actionType = 'added';
          returnData.typeTr = this.typeMap.get(data.type);
          returnData.beginMonthTr = this.months.get(returnData.data.beginMonth.toString());
          returnData.finishMonthTr = this.months.get(returnData.data.finishMonth.toString());
          returnData.amountFormatted = currencyFormat(returnData.data.amount);

          Promise.all([this.cusService.getItem(returnData.data.customerCode)])
            .then((values: any) => {
              if (values[0] !== undefined || values[0] !== null) {
                const customer = values[0] as CustomerModel;
                returnData.customer = this.cusService.convertMainModel(customer);
              }
            });

          resolve(Object.assign({returnData}));
        } else {
          resolve(null);
        }
      });
    });
  }

  checkForSave(record: CustomerTargetMainModel): Promise<string> {
    return new Promise((resolve, reject) => {
      if (record.data.customerCode === '-1' || record.data.customerCode === '') {
        reject('Lütfen müşteri seçiniz.');
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
    returnData.description = '';
    returnData.userPrimaryKey = this.authService.getUid();
    returnData.insertDate = Date.now();

    return returnData;
  }

  clearMainModel(): CustomerTargetMainModel {
    const returnData = new CustomerTargetMainModel();
    returnData.data = this.clearSubModel();
    returnData.customer = this.cusService.clearMainModel();
    returnData.typeTr = 'Yıllık';
    returnData.beginMonthTr = this.months.get(returnData.data.beginMonth.toString());
    returnData.finishMonthTr = this.months.get(returnData.data.finishMonth.toString());
    returnData.actionType = 'added';
    returnData.amountFormatted = currencyFormat(returnData.data.amount);
    return returnData;
  }

  getMainItems(isActive: boolean): Observable<CustomerTargetMainModel[]> {
    this.listCollection = this.db.collection<CustomerTargetModel>(this.tableName,
    ref => ref.where('userPrimaryKey', '==', this.authService.getUid())
      .where('isActive', '==', isActive));
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
          returnData.customer = this.cusService.convertMainModel(customer);
          return Object.assign({ returnData }); }));
      });
    }), mergeMap(feeds => combineLatest(feeds)));
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
          returnData.customer = this.cusService.convertMainModel(customer);

          return Object.assign({ returnData }); }));
      });
    }), mergeMap(feeds => combineLatest(feeds)));
    return this.mainList$;
  }

}
