import {Injectable} from '@angular/core';
import {AngularFirestore, AngularFirestoreCollection, CollectionReference, Query} from '@angular/fire/firestore';
import {Observable} from 'rxjs/Observable';
import {map} from 'rxjs/operators';
import {AuthenticationService} from './authentication.service';
import {ReminderModel} from '../models/reminder-model';
import {CustomerModel} from '../models/customer-model';
import {ProfileService} from './profile.service';
import {getAllParentTypes, getReminderType, getStatus, getTodayForInput, getTransactionTypes} from '../core/correct-library';
import {ReminderMainModel} from '../models/reminder-main-model';

@Injectable({
  providedIn: 'root'
})
export class ReminderService {
  listCollection: AngularFirestoreCollection<ReminderModel>;
  mainList$: Observable<ReminderMainModel[]>;
  listEmployeeDailyReminderCollection$: Observable<ReminderMainModel[]>;
  listEmployeeMonthlyReminderCollection$: Observable<ReminderMainModel[]>;
  listEmployeeYearlyReminderCollection$: Observable<ReminderMainModel[]>;
  listEmployeeOneTimeReminderCollection$: Observable<ReminderMainModel[]>;
  customerList$: Observable<CustomerModel[]>;
  employeeMap = new Map();
  tableName = 'tblReminder';

  constructor(public authService: AuthenticationService, public eService: ProfileService, public db: AngularFirestore) {

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

  async addItem(record: ReminderMainModel) {
    return await this.listCollection.add(Object.assign({}, record.data));
  }

  async removeItem(record: ReminderMainModel) {
    return await this.db.collection(this.tableName).doc(record.data.primaryKey).delete();
  }

  async updateItem(record: ReminderMainModel) {
    return await this.db.collection(this.tableName).doc(record.data.primaryKey).update(Object.assign({}, record.data));
  }

  async setItem(record: ReminderMainModel, primaryKey: string) {
    return await this.listCollection.doc(primaryKey).set(Object.assign({}, record.data));
  }

  checkForSave(record: ReminderMainModel): Promise<string> {
    return new Promise((resolve, reject) => {
      if (record.data.description.trim() === '') {
        reject('Lütfen açıklama giriniz.');
      } else if (record.data.parentType !== '-1' && record.data.parentPrimaryKey === '-1') {
        reject('Lütfen müşteri seçiniz.');
      } else {
        resolve(null);
      }
    });
  }

  checkForRemove(record: ReminderMainModel): Promise<string> {
    return new Promise((resolve, reject) => {
      resolve(null);
    });
  }

  checkFields(model: ReminderModel): ReminderModel {
    const cleanModel = this.clearSubModel();
    if (model.isPersonal === undefined) { model.isPersonal = cleanModel.isPersonal; }
    if (model.isActive === undefined) { model.isActive = cleanModel.isActive; }
    if (model.description === undefined) { model.description = cleanModel.description; }
    if (model.periodType === undefined) { model.periodType = cleanModel.periodType; }
    if (model.parentType === undefined) { model.parentType = cleanModel.parentType; }
    if (model.parentPrimaryKey === undefined) { model.parentPrimaryKey = cleanModel.parentPrimaryKey; }
    if (model.parentTransactionType === undefined) { model.parentTransactionType = cleanModel.parentTransactionType; }
    return model;
  }

  clearSubModel(): ReminderModel {
    const returnData = new ReminderModel();
    returnData.primaryKey = null;
    returnData.userPrimaryKey = this.authService.getUid();
    returnData.employeePrimaryKey = this.authService.getEid();
    returnData.isPersonal = true;
    returnData.isActive = true;
    returnData.description = '';
    returnData.parentType = '-1';
    returnData.parentPrimaryKey = '';
    returnData.parentTransactionType = '-1'; // salesInvoice, collection, purchaseInvoice, payment, accountVoucher, cashDeskVoucher
    returnData.periodType = 'daily'; // daily, monthly, yearly
    returnData.year = getTodayForInput().year;
    returnData.month = getTodayForInput().month;
    returnData.day = getTodayForInput().day;
    returnData.reminderDate = Date.now();
    returnData.insertDate = Date.now();
    return returnData;
  }

  clearMainModel(): ReminderMainModel {
    const returnData = new ReminderMainModel();
    returnData.data = this.clearSubModel();
    returnData.actionType = 'added';
    returnData.employeeName = this.employeeMap.get(returnData.data.employeePrimaryKey);
    returnData.periodTypeTr = getReminderType().get(returnData.data.periodType);
    returnData.transactionTypeTr = getTransactionTypes().get(returnData.data.parentTransactionType);
    returnData.parentTypeTr = getAllParentTypes().get(returnData.data.parentType);
    return returnData;
  }

  getItem(primaryKey: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.collection(this.tableName).doc(primaryKey).get().toPromise().then(doc => {
        if (doc.exists) {
          const data = doc.data() as ReminderModel;
          data.primaryKey = doc.id;

          const returnData = new ReminderMainModel();
          returnData.data = this.checkFields(data);
          returnData.employeeName = this.employeeMap.get(data.employeePrimaryKey);
          returnData.periodTypeTr = getReminderType().get(returnData.data.periodType);
          returnData.transactionTypeTr = getTransactionTypes().get(returnData.data.parentTransactionType);
          returnData.parentTypeTr = getAllParentTypes().get(returnData.data.parentType);
          resolve(Object.assign({returnData}));
        } else {
          resolve(null);
        }
      });
    });
  }

  getMainItems(): Observable<ReminderMainModel[]> {
    this.listCollection = this.db.collection(this.tableName,
      ref => ref.where('userPrimaryKey', '==', this.authService.getUid()));
    this.mainList$ = this.listCollection.stateChanges().pipe(
      map(changes =>
        changes.map(c => {
          const data = c.payload.doc.data() as ReminderModel;
          data.primaryKey = c.payload.doc.id;

          const returnData = new ReminderMainModel();
          returnData.data = this.checkFields(data);
          returnData.actionType = c.type;
          returnData.employeeName = this.employeeMap.get(data.employeePrimaryKey);
          returnData.periodTypeTr = getReminderType().get(returnData.data.periodType);
          returnData.transactionTypeTr = getTransactionTypes().get(returnData.data.parentTransactionType);
          returnData.parentTypeTr = getAllParentTypes().get(returnData.data.parentType);
          return Object.assign({returnData});
        })
      )
    );
    return this.mainList$;
  }

  getMainItemsBetweenDates(startDate: Date, endDate: Date): Observable<ReminderMainModel[]> {
    this.listCollection = this.db.collection(this.tableName,
      ref => ref.orderBy('reminderDate')
        .where('userPrimaryKey', '==', this.authService.getUid())
        .where('isActive', '==', true)
        .where('isPersonal', '==', false)
        .where('periodType', '==', 'oneTime')
        .startAt(startDate.getTime()).endAt(endDate.getTime()));
    this.mainList$ = this.listCollection.stateChanges().pipe(
      map(changes =>
        changes.map(c => {
          const data = c.payload.doc.data() as ReminderModel;
          data.primaryKey = c.payload.doc.id;

          const returnData = new ReminderMainModel();
          returnData.data = this.checkFields(data);
          returnData.actionType = c.type;
          returnData.employeeName = this.employeeMap.get(returnData.data.employeePrimaryKey);
          returnData.periodTypeTr = getReminderType().get(returnData.data.periodType);
          returnData.transactionTypeTr = getTransactionTypes().get(returnData.data.parentTransactionType);
          returnData.parentTypeTr = getAllParentTypes().get(returnData.data.parentType);
          return Object.assign({returnData});
        })
      )
    );
    return this.mainList$;
  }

  getMainItemsTimeBetweenDates(startDate: Date, endDate: Date, isActive: string, periodType: string): Observable<ReminderMainModel[]> {
    this.listCollection = this.db.collection(this.tableName,
      ref => {
        let query: CollectionReference | Query = ref;
        query = query.orderBy('reminderDate')
          .where('userPrimaryKey', '==', this.authService.getUid())
          .where('employeePrimaryKey', '==', this.authService.getEid());
        if (startDate !== null) { query = query.startAt(startDate.getTime()); }
        if (endDate !== null) { query = query.endAt(endDate.getTime()); }
        if (isActive !== '-1') { query = query.where('isActive', '==', isActive === '1'); }
        if (periodType !== '-1') { query = query.where('periodType', '==', periodType); }
        return query;
      });
    this.mainList$ = this.listCollection.stateChanges().pipe(
      map(changes =>
        changes.map(c => {
          const data = c.payload.doc.data() as ReminderModel;
          data.primaryKey = c.payload.doc.id;

          const returnData = new ReminderMainModel();
          returnData.data = this.checkFields(data);
          returnData.actionType = c.type;
          returnData.employeeName = this.employeeMap.get(returnData.data.employeePrimaryKey);
          returnData.periodTypeTr = getReminderType().get(returnData.data.periodType);
          returnData.transactionTypeTr = getTransactionTypes().get(returnData.data.parentTransactionType);
          returnData.parentTypeTr = getAllParentTypes().get(returnData.data.parentType);
          return Object.assign({returnData});
        })
      )
    );
    return this.mainList$;
  }

  getEmployeeOneTimeReminderCollection(startDate: Date): Observable<ReminderMainModel[]> {
    this.listEmployeeOneTimeReminderCollection$ = this.db.collection(this.tableName,
      ref => ref.orderBy('reminderDate')
        .where('userPrimaryKey', '==', this.authService.getUid())
        .where('employeePrimaryKey', '==', this.authService.getEid())
        .where('isActive', '==', true)
        .where('isPersonal', '==', true)
        .where('periodType', '==', 'oneTime')
        .startAfter(startDate.getTime())).stateChanges().pipe(
      map(changes =>
        changes.map(c => {
          const data = c.payload.doc.data() as ReminderModel;
          data.primaryKey = c.payload.doc.id;

          const returnData = new ReminderMainModel();
          returnData.data = this.checkFields(data);
          returnData.actionType = c.type;
          returnData.employeeName = this.employeeMap.get(data.employeePrimaryKey);
          returnData.periodTypeTr = getReminderType().get(returnData.data.periodType);
          returnData.transactionTypeTr = getTransactionTypes().get(returnData.data.parentTransactionType);
          returnData.parentTypeTr = getAllParentTypes().get(returnData.data.parentType);
          return Object.assign({returnData});
        })
      )
    );
    return this.listEmployeeOneTimeReminderCollection$;
  }

  getEmployeeDailyReminderCollection(startDate: Date): Observable<ReminderMainModel[]> {
    this.listEmployeeDailyReminderCollection$ = this.db.collection(this.tableName,
      ref => ref.orderBy('reminderDate')
        .where('userPrimaryKey', '==', this.authService.getUid())
        .where('employeePrimaryKey', '==', this.authService.getEid())
        .where('isActive', '==', true)
        .where('isPersonal', '==', true)
        .where('periodType', '==', 'daily')).stateChanges().pipe(
      map(changes =>
        changes.map(c => {
          const data = c.payload.doc.data() as ReminderModel;
          data.primaryKey = c.payload.doc.id;

          const returnData = new ReminderMainModel();
          returnData.data = this.checkFields(data);
          returnData.actionType = c.type;
          returnData.employeeName = this.employeeMap.get(data.employeePrimaryKey);
          returnData.periodTypeTr = getReminderType().get(returnData.data.periodType);
          returnData.transactionTypeTr = getTransactionTypes().get(returnData.data.parentTransactionType);
          returnData.parentTypeTr = getAllParentTypes().get(returnData.data.parentType);
          return Object.assign({returnData});
        })
      )
    );
    return this.listEmployeeDailyReminderCollection$;
  }

  getEmployeeMonthlyReminderCollection(startDate: Date): Observable<ReminderMainModel[]> {
    this.listEmployeeMonthlyReminderCollection$ = this.db.collection(this.tableName,
      ref => ref.orderBy('reminderDate')
        .where('userPrimaryKey', '==', this.authService.getUid())
        .where('employeePrimaryKey', '==', this.authService.getEid())
        .where('isActive', '==', true)
        .where('isPersonal', '==', true)
        .where('day', '==', startDate.getDate())
        .where('periodType', '==', 'monthly')
        .startAfter(startDate.getTime())).stateChanges().pipe(
      map(changes =>
        changes.map(c => {
          const data = c.payload.doc.data() as ReminderModel;
          data.primaryKey = c.payload.doc.id;

          const returnData = new ReminderMainModel();
          returnData.data = this.checkFields(data);
          returnData.actionType = c.type;
          returnData.employeeName = this.employeeMap.get(data.employeePrimaryKey);
          returnData.periodTypeTr = getReminderType().get(returnData.data.periodType);
          returnData.transactionTypeTr = getTransactionTypes().get(returnData.data.parentTransactionType);
          returnData.parentTypeTr = getAllParentTypes().get(returnData.data.parentType);
          return Object.assign({returnData});
        })
      )
    );
    return this.listEmployeeMonthlyReminderCollection$;
  }

  getEmployeeYearlyReminderCollection(startDate: Date): Observable<ReminderMainModel[]> {
    this.listEmployeeYearlyReminderCollection$ = this.db.collection(this.tableName,
      ref => ref.orderBy('reminderDate')
        .where('userPrimaryKey', '==', this.authService.getUid())
        .where('employeePrimaryKey', '==', this.authService.getEid())
        .where('isActive', '==', true)
        .where('isPersonal', '==', true)
        .where('day', '==', startDate.getDate())
        .where('month', '==', startDate.getMonth() + 1)
        .where('periodType', '==', 'yearly')
        .startAfter(startDate.getTime())).stateChanges().pipe(
      map(changes =>
        changes.map(c => {
          const data = c.payload.doc.data() as ReminderModel;
          data.primaryKey = c.payload.doc.id;

          const returnData = new ReminderMainModel();
          returnData.data = this.checkFields(data);
          returnData.actionType = c.type;
          returnData.employeeName = this.employeeMap.get(data.employeePrimaryKey);
          returnData.periodTypeTr = getReminderType().get(returnData.data.periodType);
          returnData.transactionTypeTr = getTransactionTypes().get(returnData.data.parentTransactionType);
          returnData.parentTypeTr = getAllParentTypes().get(returnData.data.parentType);
          return Object.assign({returnData});
        })
      )
    );
    return this.listEmployeeYearlyReminderCollection$;
  }
}
