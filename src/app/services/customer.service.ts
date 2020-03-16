import { Injectable } from '@angular/core';
import {
  AngularFirestore,
  AngularFirestoreCollection,
  AngularFirestoreDocument,
  CollectionReference, Query
} from '@angular/fire/firestore';
import { CustomerModel } from '../models/customer-model';
import { Observable } from 'rxjs/internal/Observable';
import { map, flatMap } from 'rxjs/operators';
import { combineLatest } from 'rxjs';
import { AuthenticationService } from './authentication.service';
import {PurchaseInvoiceModel} from '../models/purchase-invoice-model';
import {ReminderModel} from '../models/reminder-model';
import {LogService} from './log.service';
import {ProfileService} from './profile.service';
import {CustomerMainModel} from '../models/customer-main-model';
import {getPaymentTypes, getTerms} from '../core/correct-library';

@Injectable({
  providedIn: 'root'
})
export class CustomerService {

  listCollection: AngularFirestoreCollection<CustomerModel>;
  mainList$: Observable<CustomerModel[]>;
  mainList2$: Observable<CustomerMainModel[]>;
  tableName = 'tblCustomer';
  employeeMap = new Map();

  constructor(public authService: AuthenticationService, public eService: ProfileService, public db: AngularFirestore) {
    if (this.authService.isUserLoggedIn()) {
      this.eService.getItems().subscribe(list => {
        this.employeeMap.clear();
        this.employeeMap.set('-1', null);
        list.forEach(item => {
          this.employeeMap.set(item.primaryKey, item);
        });
      });
    }
  }

  getAllItems(): Observable<CustomerModel[]> {
    this.listCollection = this.db.collection<CustomerModel>(this.tableName,
    ref => ref.where('userPrimaryKey', '==', this.authService.getUid()).orderBy('name', 'asc'));
    return this.listCollection.valueChanges({ idField : 'primaryKey'});
  }

  getAllActiveItems(): Observable<CustomerModel[]> {
    this.listCollection = this.db.collection<CustomerModel>(this.tableName,
    ref => ref
    .where('userPrimaryKey', '==', this.authService.getUid())
    .where('isActive', '==', true)
    .orderBy('name', 'asc'));
    return this.listCollection.valueChanges({ idField : 'primaryKey'});
  }

  async addItem(record: CustomerMainModel) {
    return await this.listCollection.add(Object.assign({}, record.data));
  }

  async setItem(record: CustomerMainModel, primaryKey: string) {
    return await this.listCollection.doc(primaryKey).set(Object.assign({}, record.data));
  }

  async removeItem(record: CustomerMainModel) {
    return await this.db.collection(this.tableName).doc(record.data.primaryKey).delete();
  }

  async updateItem(record: CustomerMainModel) {
    return await this.db.collection(this.tableName).doc(record.data.primaryKey).update(Object.assign({}, record.data));
  }

  clearModel(): CustomerModel {

    const returnData = new CustomerModel();
    returnData.primaryKey = undefined;
    returnData.userPrimaryKey = this.authService.getUid();
    returnData.employeePrimaryKey = this.authService.getEid();
    returnData.executivePrimary = '-1';
    returnData.code = '';
    returnData.name = null;
    returnData.owner = null;
    returnData.phone1 = '';
    returnData.phone2 = '';
    returnData.email = '';
    returnData.address = '';
    returnData.isActive = true;
    returnData.taxOffice = '';
    returnData.taxNumber = '';
    returnData.postCode = '';
    returnData.paymentTypeKey = '-1';
    returnData.termKey = '-1';

    return returnData;
  }

  clearMainModel(): CustomerMainModel {

    const returnData = new CustomerMainModel();
    returnData.data = this.clearModel();
    returnData.employee = this.employeeMap.get(returnData.data.employeePrimaryKey);
    returnData.executive = this.employeeMap.get(returnData.data.executivePrimary);
    returnData.paymentTypeTr = getPaymentTypes().get(returnData.data.paymentTypeKey);
    returnData.termTr = getTerms().get(returnData.data.termKey);

    return returnData;
  }

  checkFields(model: CustomerModel): CustomerModel {
    const cleanModel = this.clearModel();
    if (model.employeePrimaryKey === undefined) { model.employeePrimaryKey = '-1'; }
    if (model.executivePrimary === undefined) { model.executivePrimary = cleanModel.executivePrimary; }
    if (model.code === undefined) { model.code = cleanModel.code; }
    if (model.name === undefined) { model.name = cleanModel.name; }
    if (model.owner === undefined) { model.owner = cleanModel.owner; }
    if (model.phone1 === undefined) { model.phone1 = cleanModel.phone1; }
    if (model.phone2 === undefined) { model.phone2 = cleanModel.phone2; }
    if (model.email === undefined) { model.email = cleanModel.email; }
    if (model.address === undefined) { model.address = cleanModel.address; }
    if (model.isActive === undefined) { model.isActive = cleanModel.isActive; }
    if (model.taxOffice === undefined) { model.taxOffice = cleanModel.taxOffice; }
    if (model.taxNumber === undefined) { model.taxNumber = cleanModel.taxNumber; }
    if (model.postCode === undefined) { model.postCode = cleanModel.postCode; }
    if (model.paymentTypeKey === undefined) { model.paymentTypeKey = cleanModel.paymentTypeKey; }
    if (model.termKey === undefined) { model.termKey = cleanModel.termKey; }

    return model;
  }

  getItem(primaryKey: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.collection(this.tableName).doc(primaryKey).get().toPromise().then(doc => {
        if (doc.exists) {
          let data = doc.data() as CustomerModel;
          data.primaryKey = doc.id;
          data = this.checkFields(data);
          resolve(Object.assign({data}));
        } else {
          resolve(null);
        }
      });
    });
  }

  getMainItems(isActive: boolean): Observable<CustomerMainModel[]> {
    // left join siz
    this.listCollection = this.db.collection(this.tableName,
      ref => {
        let query: CollectionReference | Query = ref;
        query = query.orderBy('name', 'asc')
          .where('userPrimaryKey', '==', this.authService.getUid());
        if (isActive !== null) {
          query = query.where('isActive', '==', isActive);
        }
        return query;
      });
    this.mainList2$ = this.listCollection.stateChanges().pipe(
      map(changes =>
        changes.map(c => {
          const data = c.payload.doc.data() as CustomerModel;
          data.primaryKey = c.payload.doc.id;

          const returnData = new CustomerMainModel();
          returnData.data = this.checkFields(data);
          returnData.actionType = c.type;
          returnData.employee = this.employeeMap.get(data.employeePrimaryKey);
          returnData.executive = this.employeeMap.get(data.executivePrimary);
          returnData.paymentTypeTr = getPaymentTypes().get(returnData.data.paymentTypeKey);
          returnData.termTr = getTerms().get(returnData.data.termKey);
          return Object.assign({returnData});
        })
      )
    );
    return this.mainList2$;
  }

  getCustomersForReport = async (customerPrimaryKey: string, isActive: boolean):
    // tslint:disable-next-line:cyclomatic-complexity
    Promise<Array<CustomerModel>> => new Promise(async (resolve, reject): Promise<void> => {
    try {
      const list = Array<CustomerModel>();
      this.db.collection(this.tableName, ref => {
        let query: CollectionReference | Query = ref;
        query = query.orderBy('name', 'asc')
          .where('userPrimaryKey', '==', this.authService.getUid())
          .where('isActive', '==', isActive);
        if (customerPrimaryKey !== undefined && customerPrimaryKey !== null && customerPrimaryKey !== '-1') {
          query = query.where('primaryKey', '==', customerPrimaryKey);
        }
        return query;
      })
        .get().subscribe(snapshot => {
        snapshot.forEach(doc => {
          let data = doc.data() as CustomerModel;
          data.primaryKey = doc.id;
          data = this.checkFields(data);
          list.push(data);
        });
        resolve(list);
      });

    } catch (error) {
      console.error(error);
      reject({code: 401, message: 'You do not have permission or there is a problem about permissions!'});
    }
  })
}
