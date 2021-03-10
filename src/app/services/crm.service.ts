import {Injectable} from '@angular/core';
import {AngularFirestore, AngularFirestoreCollection} from '@angular/fire/firestore';
import {Observable} from 'rxjs/Observable';
import {CustomerModel} from '../models/customer-model';
import {map, mergeMap} from 'rxjs/operators';
import {combineLatest} from 'rxjs';
import {AuthenticationService} from './authentication.service';
import {LogService} from './log.service';
import {CustomerRelationModel} from '../models/customer-relation-model';
import {CustomerRelationMainModel} from '../models/customer-relation-main-model';
import {CustomerService} from './customer.service';

@Injectable({
  providedIn: 'root'
})
export class CustomerRelationService {
  listCollection: AngularFirestoreCollection<CustomerRelationModel>;
  mainList$: Observable<CustomerRelationMainModel[]>;
  tableName = 'tblCustomerRelation';
  relationTypeMap = new Map([['meeting', 'Toplanti'], ['mailSending', 'Mail Gönderim'],
    ['faxSending', 'Fax Gönderim'], ['phoneCall', 'Telefon Görüşmesi'], ['travel', 'Seyahat'], ['visit', 'Ziyaret']]);
  customerMap = new Map();

  constructor(public authService: AuthenticationService, public cusService: CustomerService, public logService: LogService,
              public db: AngularFirestore) {

    if (this.authService.isUserLoggedIn()) {
      this.cusService.getAllItems().subscribe(list => {
        this.customerMap.clear();
        list.forEach(item => {
          this.customerMap.set(item.primaryKey, this.cusService.convertMainModel(item));
        });
      });
    }

  }

  async addItem(record: CustomerRelationMainModel) {
    await this.logService.addTransactionLog(record, 'insert', 'crm');
    return await this.listCollection.add(Object.assign({}, record.data));
  }

  async removeItem(record: CustomerRelationMainModel) {
    await this.logService.addTransactionLog(record, 'delete', 'crm');
    return await this.db.collection(this.tableName).doc(record.data.primaryKey).delete();
  }

  async updateItem(record: CustomerRelationMainModel) {
    await this.logService.addTransactionLog(record, 'update', 'crm');
    return await this.db.collection(this.tableName).doc(record.data.primaryKey).update(Object.assign({}, record.data));
  }

  async setItem(record: CustomerRelationMainModel, primaryKey: string) {
    await this.logService.addTransactionLog(record, 'insert', 'crm');
    return await this.listCollection.doc(primaryKey).set(Object.assign({}, record.data));
  }

  checkForSave(record: CustomerRelationMainModel): Promise<string> {
    return new Promise((resolve, reject) => {
      if (record.data.parentPrimaryKey === '' || record.data.parentPrimaryKey === '-1') {
        reject('Lüfen müşteri seçiniz.');
      }
      if (record.data.parentType === '' || record.data.parentType === '-1') {
        reject('Lüfen kayıt tipi seçiniz.');
      }
      if (record.data.relationType === '' || record.data.relationType === '-1') {
        reject('Lüfen etkinlik tipi seçiniz.');
      }
      resolve(null);
    });
  }

  checkForRemove(record: CustomerRelationMainModel): Promise<string> {
    return new Promise((resolve, reject) => {
      resolve(null);
    });
  }

  checkFields(model: CustomerRelationModel): CustomerRelationModel {
    const cleanModel = this.clearSubModel();
    if (model.employeePrimaryKey === undefined) {
      model.employeePrimaryKey = '-1';
    }
    if (model.parentPrimaryKey === undefined) {
      model.parentPrimaryKey = cleanModel.parentPrimaryKey;
    }
    if (model.parentType === undefined) {
      model.parentType = cleanModel.parentType;
    }
    if (model.relationType === undefined) {
      model.relationType = cleanModel.relationType;
    }
    if (model.status === undefined) {
      model.status = cleanModel.status;
    }
    if (model.description === undefined) {
      model.description = cleanModel.description;
    }
    if (model.actionDate === undefined) {
      model.actionDate = cleanModel.actionDate;
    }
    if (model.platform === undefined) {
      model.platform = cleanModel.platform;
    }

    return model;
  }

  clearSubModel(): CustomerRelationModel {

    const returnData = new CustomerRelationModel();
    returnData.primaryKey = null;
    returnData.userPrimaryKey = this.authService.getUid();
    returnData.employeePrimaryKey = this.authService.getEid();
    returnData.parentPrimaryKey = '-1';
    returnData.parentType = 'customer'; // customer
    returnData.relationType = '-1'; // meeting, mailSending, phoneCall, visit, faxSending
    returnData.status = 'waiting'; // waiting
    returnData.platform = 'web'; // waiting
    returnData.description = '';
    returnData.actionDate = Date.now();
    returnData.insertDate = Date.now();

    return returnData;
  }

  clearMainModel(): CustomerRelationMainModel {
    const returnData = new CustomerRelationMainModel();
    returnData.data = this.clearSubModel();
    returnData.customer = this.cusService.clearMainModel();
    returnData.actionType = 'added';
    returnData.relationTypeTR = this.relationTypeMap.get(returnData.data.relationType);
    return returnData;
  }

  getItem(primaryKey: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.collection(this.tableName).doc(primaryKey).get().toPromise()
        .then(doc => {
        if (doc.exists) {
          const data = doc.data() as CustomerRelationModel;
          data.primaryKey = doc.id;

          const returnData = new CustomerRelationMainModel();
          returnData.data = this.checkFields(data);
          returnData.customer = this.customerMap.get(returnData.data.parentPrimaryKey);
          resolve(Object.assign({returnData}));
        } else {
          resolve(null);
        }
      });
    });
  }

  getMainItems(): Observable<CustomerRelationMainModel[]> {
    this.listCollection = this.db.collection(this.tableName,
      ref => ref.orderBy('actionDate').where('userPrimaryKey', '==', this.authService.getUid()));
    this.mainList$ = this.listCollection.stateChanges().pipe(map(changes => {
      return changes.map(change => {
        const data = change.payload.doc.data() as CustomerRelationModel;
        data.primaryKey = change.payload.doc.id;

        const returnData = new CustomerRelationMainModel();
        returnData.data = this.checkFields(data);
        returnData.actionType = change.type;
        returnData.relationTypeTR = this.relationTypeMap.get(returnData.data.relationType);

        return this.db.collection('tblCustomer').doc(data.parentPrimaryKey).valueChanges()
          .pipe(map((customer: CustomerModel) => {
            returnData.customer = customer !== undefined ? this.cusService.convertMainModel(customer) : undefined;
            return Object.assign({returnData});
          }));
      });
    }), mergeMap(feeds => combineLatest(feeds)));
    return this.mainList$;
  }

  getMainItemsBetweenDates(startDate: Date, endDate: Date): Observable<CustomerRelationMainModel[]> {
    this.listCollection = this.db.collection(this.tableName,
      ref => ref.orderBy('actionDate').startAt(startDate.getTime()).endAt(endDate.getTime())
        .where('userPrimaryKey', '==', this.authService.getUid()));
    this.mainList$ = this.listCollection.stateChanges().pipe(map(changes => {
      return changes.map(change => {
        const data = change.payload.doc.data() as CustomerRelationModel;
        data.primaryKey = change.payload.doc.id;

        const returnData = new CustomerRelationMainModel();
        returnData.data = this.checkFields(data);
        returnData.actionType = change.type;
        returnData.relationTypeTR = this.relationTypeMap.get(returnData.data.relationType);

        return this.db.collection('tblCustomer').doc(data.parentPrimaryKey).valueChanges()
          .pipe(map((customer: CustomerModel) => {
            returnData.customer = customer !== undefined ? this.cusService.convertMainModel(customer) : undefined;
            return Object.assign({returnData});
          }));
      });
    }), mergeMap(feeds => combineLatest(feeds)));
    return this.mainList$;
  }

  getMainItemsBetweenDatesAsPromise = async (startDate: Date, endDate: Date):
    Promise<Array<CustomerRelationMainModel>> => new Promise(async (resolve, reject): Promise<void> => {
    try {
      const list = Array<CustomerRelationMainModel>();
      this.db.collection(this.tableName, ref =>
        ref.orderBy('insertDate').startAt(startDate.getTime()).endAt(endDate.getTime()))
        .get().subscribe(snapshot => {
        snapshot.forEach(doc => {
          const data = doc.data() as CustomerRelationModel;
          data.primaryKey = doc.id;

          const returnData = new CustomerRelationMainModel();
          returnData.data = this.checkFields(data);
          returnData.customer = returnData.data.parentPrimaryKey !== '-1' ?
            this.customerMap.get(returnData.data.parentPrimaryKey) :
            undefined;
          returnData.relationTypeTR = this.relationTypeMap.get(returnData.data.relationType);

          list.push(returnData);
        });
        resolve(list);
      });

    } catch (error) {
      console.error(error);
      reject({message: 'Error: ' + error});
    }
  })
}
