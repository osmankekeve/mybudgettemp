import {Injectable} from '@angular/core';
import {AngularFirestore, AngularFirestoreCollection} from '@angular/fire/firestore';
import {Observable} from 'rxjs/Observable';
import {CustomerModel} from '../models/customer-model';
import {map, flatMap, startWith} from 'rxjs/operators';
import {combineLatest} from 'rxjs';
import {AuthenticationService} from './authentication.service';
import {LogService} from './log.service';
import {CustomerRelationModel} from '../models/customer-relation-model';
import {AccountVoucherModel} from '../models/account-voucher-model';
import {CashdeskVoucherModel} from '../models/cashdesk-voucher-model';

@Injectable({
  providedIn: 'root'
})
export class CustomerRelationService {
  listCollection: AngularFirestoreCollection<CustomerRelationModel>;
  mainList$: Observable<CustomerRelationModel[]>;
  tableName = 'tblCustomerRelation';
  relationTypeMap = new Map([['meeting', 'Toplanti'], ['mailSending', 'Mail Gönderim'],
    ['faxSending', 'Fax Gönderim'], ['phoneCall', 'Telefon Görüşmesi'], ['travel', 'Seyahat'], ['visit', 'Ziyaret']]);

  constructor(public authService: AuthenticationService,
              public logService: LogService,
              public db: AngularFirestore) {

  }

  getAllItems(): Observable<CustomerRelationModel[]> {
    this.listCollection = this.db.collection<CustomerRelationModel>(this.tableName,
      ref => ref.orderBy('insertDate').where('userPrimaryKey', '==', this.authService.getUid()));
    this.mainList$ = this.listCollection.valueChanges({idField: 'primaryKey'});
    return this.mainList$;
  }

  async addItem(record: CustomerRelationModel) {
    await this.logService.sendToLog(record, 'insert', 'crm');
    return await this.listCollection.add(Object.assign({}, record));
  }

  async removeItem(record: CustomerRelationModel) {
    await this.logService.sendToLog(record, 'delete', 'crm');
    return await this.db.collection(this.tableName).doc(record.primaryKey).delete();
  }

  async updateItem(record: CustomerRelationModel) {
    await this.logService.sendToLog(record, 'update', 'crm');
    return await this.db.collection(this.tableName).doc(record.primaryKey).update(Object.assign({}, record));
  }

  async setItem(record: CustomerRelationModel, primaryKey: string) {
    this.logService.sendToLog(record, 'insert', 'crm');
    return await this.listCollection.doc(primaryKey).set(record);
  }

  clearSubModel(): CustomerRelationModel {

    const returnData = new CustomerRelationModel();
    returnData.primaryKey = null;
    returnData.userPrimaryKey = this.authService.getUid();
    returnData.employeePrimaryKey = this.authService.getEid();
    returnData.parentPrimaryKey = '-1';
    returnData.parentType = '-1'; // customer
    returnData.relationType = '-1'; // meeting, mailSending, phoneCall, visit, faxSending
    returnData.status = 'waiting'; // waiting
    returnData.description = '';
    returnData.actionDate = Date.now();
    returnData.insertDate = Date.now();

    return returnData;
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

    return model;
  }

  getItem(primaryKey: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.collection(this.tableName).doc(primaryKey).get().toPromise().then(doc => {
        if (doc.exists) {
          let data = doc.data() as CustomerRelationModel;
          data.primaryKey = doc.id;
          data = this.checkFields(data);
          resolve(Object.assign({data}));
        } else {
          resolve(null);
        }
      });
    });
  }

  getMainItems(): Observable<CustomerRelationModel[]> {
    this.listCollection = this.db.collection(this.tableName,
      ref => ref.orderBy('actionDate').where('userPrimaryKey', '==', this.authService.getUid()));
    this.mainList$ = this.listCollection.stateChanges().pipe(map(changes => {
      return changes.map(change => {
        let data = change.payload.doc.data() as CustomerRelationModel;
        data.primaryKey = change.payload.doc.id;
        data = this.checkFields(data);
        return this.db.collection('tblCustomer').doc(data.parentPrimaryKey).valueChanges()
          .pipe(map((customer: CustomerModel) => {
            return Object.assign({
              data, customerName: customer.name, actionType: change.type,
              relationTypeTR: this.relationTypeMap.get(data.relationType)
            });
          }));
      });
    }), flatMap(feeds => combineLatest(feeds)));
    return this.mainList$;
  }

  getMainItemsBetweenDates(startDate: Date, endDate: Date): Observable<CustomerRelationModel[]> {
    this.listCollection = this.db.collection(this.tableName,
      ref => ref.orderBy('actionDate').startAt(startDate.getTime()).endAt(endDate.getTime())
        .where('userPrimaryKey', '==', this.authService.getUid()));
    this.mainList$ = this.listCollection.stateChanges().pipe(map(changes => {
      return changes.map(change => {
        let data = change.payload.doc.data() as CustomerRelationModel;
        data.primaryKey = change.payload.doc.id;
        data = this.checkFields(data);

        return this.db.collection('tblCustomer').doc(data.parentPrimaryKey).valueChanges()
          .pipe(map((customer: CustomerModel) => {
            return Object.assign({
              data, customerName: customer.name, actionType: change.type,
              relationTypeTR: this.relationTypeMap.get(data.relationType)
            });
          }));
      });
    }), flatMap(feeds => combineLatest(feeds)));
    return this.mainList$;
  }

  getMainItemsBetweenDatesAsPromise = async (startDate: Date, endDate: Date):
    Promise<Array<CustomerRelationModel>> => new Promise(async (resolve, reject): Promise<void> => {
    try {
      const list = Array<CustomerRelationModel>();
      this.db.collection(this.tableName, ref =>
        ref.orderBy('insertDate').startAt(startDate.getTime()).endAt(endDate.getTime()))
        .get().subscribe(snapshot => {
        snapshot.forEach(doc => {
          let returnData = doc.data() as CustomerRelationModel;
          returnData.primaryKey = doc.id;
          returnData = this.checkFields(returnData);

          list.push(returnData);
        });
        resolve(list);
      });

    } catch (error) {
      console.error(error);
      reject({code: 401, message: 'You do not have permission or there is a problem about permissions!'});
    }
  })
}
