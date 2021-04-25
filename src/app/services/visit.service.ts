import {Injectable} from '@angular/core';
import {AngularFirestore, AngularFirestoreCollection} from '@angular/fire/firestore';
import {Observable} from 'rxjs/Observable';
import {CustomerModel} from '../models/customer-model';
import {map, mergeMap} from 'rxjs/operators';
import {combineLatest} from 'rxjs';
import {AuthenticationService} from './authentication.service';
import {LogService} from './log.service';
import {VisitModel} from '../models/visit-model';
import {ProfileService} from './profile.service';
import {VisitMainModel} from '../models/visit-main-model';
import {CustomerService} from './customer.service';

@Injectable({
  providedIn: 'root'
})
export class VisitService {
  listCollection: AngularFirestoreCollection<VisitModel>;
  mainList$: Observable<VisitMainModel[]>;
  employeeMap = new Map();
  customerMap = new Map();
  tableName = 'tblVisit';

  constructor(public authService: AuthenticationService, public logService: LogService, public eService: ProfileService,
              public db: AngularFirestore, public cusService: CustomerService) {

    this.eService.getItems().toPromise().then(list => {
      this.employeeMap.clear();
      this.employeeMap.set('-1', 'Tüm Kullanıcılar');
      list.forEach(item => {
        this.employeeMap.set(item.primaryKey, item.longName);
      });
    });
    this.cusService.getAllItems().toPromise().then(list => {
      this.customerMap.clear();
      list.forEach(item => {
        this.customerMap.set(item.primaryKey, this.cusService.convertMainModel(item));
      });
    });
  }

  async addItem(record: VisitMainModel) {
    await this.logService.addTransactionLog(record, 'insert', 'visit');
    return await this.listCollection.add(Object.assign({}, record.visit));
  }

  async removeItem(record: VisitMainModel) {
    await this.logService.addTransactionLog(record, 'delete', 'visit');
    return await this.db.collection(this.tableName).doc(record.visit.primaryKey).delete();
  }

  async updateItem(record: VisitMainModel) {
    await this.logService.addTransactionLog(record, 'update', 'visit');
    return await this.db.collection(this.tableName).doc(record.visit.primaryKey).update(record.visit);
  }

  async setItem(record: VisitMainModel, primaryKey: string) {
    await this.logService.addTransactionLog(record, 'insert', 'visit');
    return await this.listCollection.doc(primaryKey).set(Object.assign({}, record.visit));
  }

  checkForSave(record: VisitMainModel): Promise<string> {
    return new Promise((resolve, reject) => {
      resolve(null);
    });
  }

  checkForRemove(record: VisitMainModel): Promise<string> {
    return new Promise((resolve, reject) => {
      resolve(null);
    });
  }

  checkFields(model: VisitModel): VisitModel {
    const cleanModel = this.clearVisitModel();
    if (model.isVisited === undefined) { model.isVisited = cleanModel.isVisited; }
    if (model.result === undefined) { model.result = cleanModel.result; }

    return model;
  }

  getItem(primaryKey: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.collection(this.tableName).doc(primaryKey).get().toPromise().then(doc => {
        if (doc.exists) {
          const data = doc.data() as VisitModel;
          data.primaryKey = doc.id;

          const returnData = new VisitMainModel();
          returnData.visit = data;
          returnData.actionType = '';
          returnData.customer = this.customerMap.get(returnData.visit.customerPrimaryKey);
          returnData.employeeName = this.employeeMap.get(data.employeePrimaryKey);
          returnData.isVisitedTr = returnData.visit.isVisited ? 'Ziyaret Edildi' : 'Ziyaret Edilmedi';

          resolve(Object.assign({returnData}));
        } else {
          resolve(null);
        }
      });
    });
  }

  clearVisitModel(): VisitModel {
    const returnData = new VisitModel();
    returnData.primaryKey = null;
    returnData.isVisited = false;
    returnData.result = '';
    returnData.longitude = 0.0;
    returnData.latitude = 0.0;
    returnData.visitStartDate = 0;
    returnData.visitFinishDate = 0;
    returnData.userPrimaryKey = this.authService.getUid();
    returnData.insertDate = Date.now();

    return returnData;
  }

  clearVisitMainModel(): VisitMainModel {
    const returnData = new VisitMainModel();
    returnData.visit = this.clearVisitModel();
    returnData.customer = this.cusService.clearMainModel();
    returnData.customerName = '';
    returnData.employeeName = this.employeeMap.get(returnData.visit.employeePrimaryKey);
    returnData.isVisitedTr = 'Ziyaret Edilmedi';
    returnData.actionType = 'added';
    return returnData;
  }

  getMainItemsBetweenDates(startDate: Date, endDate: Date): Observable<VisitMainModel[]> {
    this.listCollection = this.db.collection(this.tableName,
      ref => ref.orderBy('visitDate').startAt(startDate.getTime()).endAt(endDate.getTime())
        .where('userPrimaryKey', '==', this.authService.getUid()));
    this.mainList$ = this.listCollection.stateChanges().pipe(map(changes => {
      return changes.map(change => {
        const data = change.payload.doc.data() as VisitModel;
        data.primaryKey = change.payload.doc.id;

        const returnData = new VisitMainModel();
        returnData.visit = this.checkFields(data);
        returnData.actionType = change.type;
        returnData.employeeName = this.employeeMap.get(data.employeePrimaryKey);
        returnData.isVisitedTr = returnData.visit.isVisited ? 'Ziyaret Edildi' : 'Ziyaret Edilmedi';

        return this.db.collection('tblCustomer').doc(data.customerPrimaryKey).valueChanges()
          .pipe(map((customer: CustomerModel) => {
            returnData.customer = this.cusService.convertMainModel(customer);
            return Object.assign({returnData});
          }));
      });
    }), mergeMap(feeds => combineLatest(feeds)));
    return this.mainList$;
  }

  getMainItemsWithCustomerPrimaryKey(customerPrimaryKey: string): Observable<VisitMainModel[]> {
    this.listCollection = this.db.collection(this.tableName,
      ref => ref.orderBy('visitDate').where('userPrimaryKey', '==', this.authService.getUid())
        .where('customerPrimaryKey', '==', customerPrimaryKey));
    this.mainList$ = this.listCollection.stateChanges().pipe(map(changes => {
      return changes.map(change => {
        const data = change.payload.doc.data() as VisitModel;
        data.primaryKey = change.payload.doc.id;

        const returnData = new VisitMainModel();
        returnData.visit = this.checkFields(data);
        returnData.actionType = change.type;
        returnData.employeeName = this.employeeMap.get(data.employeePrimaryKey);
        returnData.isVisitedTr = returnData.visit.isVisited ? 'Ziyaret Edildi' : 'Ziyaret Edilmedi';

        return this.db.collection('tblCustomer').doc(data.customerPrimaryKey).valueChanges()
          .pipe(map((customer: CustomerModel) => {
            returnData.customer = this.cusService.convertMainModel(customer);

            return Object.assign({returnData});
          }));
      });
    }), mergeMap(feeds => combineLatest(feeds)));
    return this.mainList$;
  }

  getMainItemsBetweenDatesAsPromise = async (startDate: Date, endDate: Date):
    Promise<Array<VisitMainModel>> => new Promise(async (resolve, reject): Promise<void> => {
    try {
      const list = Array<VisitMainModel>();
      this.db.collection(this.tableName, ref =>
        ref.orderBy('insertDate').startAt(startDate.getTime()).endAt(endDate.getTime()))
        .get().toPromise().then(snapshot => {
        snapshot.forEach(doc => {
          const data = doc.data() as VisitModel;
          data.primaryKey = doc.id;

          const returnData = new VisitMainModel();
          returnData.visit = this.checkFields(data);
          returnData.actionType = 'added';
          returnData.employeeName = this.employeeMap.get(data.employeePrimaryKey);
          returnData.isVisitedTr = returnData.visit.isVisited ? 'Ziyaret Edildi' : 'Ziyaret Edilmedi';
          returnData.customer = this.customerMap.get(returnData.visit.customerPrimaryKey);

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
