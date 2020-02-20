import {Injectable} from '@angular/core';
import {AngularFirestore, AngularFirestoreCollection, CollectionReference, Query} from '@angular/fire/firestore';
import {Observable} from 'rxjs/Observable';
import {map, flatMap} from 'rxjs/operators';
import {AuthenticationService} from './authentication.service';
import {ReminderModel} from '../models/reminder-model';
import {CustomerModel} from '../models/customer-model';
import {ProfileService} from './profile.service';
import {ProfileMainModel} from '../models/profile-main-model';
import {SalesInvoiceMainModel} from '../models/sales-invoice-main-model';
import {SalesInvoiceModel} from '../models/sales-invoice-model';
import {combineLatest} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ReminderService {
  listCollection: AngularFirestoreCollection<ReminderModel>;
  listEmployeeDailyReminderCollection: AngularFirestoreCollection<ReminderModel>;
  mainList$: Observable<ReminderModel[]>;
  listEmployeeDailyReminderCollection$: Observable<ReminderModel[]>;
  listEmployeeMonthlyReminderCollection$: Observable<ReminderModel[]>;
  listEmployeeYearlyReminderCollection$: Observable<ReminderModel[]>;
  customerList$: Observable<CustomerModel[]>;
  employeeMap = new Map();
  tableName = 'tblReminder';

  constructor(public authService: AuthenticationService,
              public eService: ProfileService,
              public db: AngularFirestore) {

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

  getAllItems(): Observable<ReminderModel[]> {
    this.listCollection = this.db.collection<ReminderModel>(this.tableName,
      ref => ref.where('userPrimaryKey', '==', this.authService.getUid()));
    this.mainList$ = this.listCollection.valueChanges({idField: 'primaryKey'});
    return this.mainList$;
  }

  async addItem(record: ReminderModel) {
    return await this.listCollection.add(record);
  }

  async removeItem(record: ReminderModel) {
    return await this.db.collection(this.tableName).doc(record.primaryKey).delete();
  }

  async updateItem(record: ReminderModel) {
    return await this.db.collection(this.tableName).doc(record.primaryKey).update(record);
  }

  getItem(primaryKey: string): Observable<ReminderModel> {
    this.db.collection(this.tableName).doc(primaryKey).get().subscribe(item => {
      const data = item as ReminderModel;
      data.primaryKey = item.id;
      return data;
    });
    return null;
  }

  getItem2(primaryKey: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.collection(this.tableName).doc(primaryKey).get().toPromise().then(doc => {
        if (doc.exists) {
          const data = doc.data() as ReminderModel;
          data.primaryKey = doc.id;
          resolve(Object.assign({data, employeeName: this.employeeMap.get(data.employeePrimaryKey)}));
        } else {
          resolve(null);
        }
      });
    });
  }

  getMainItems(): Observable<ReminderModel[]> {
    this.listCollection = this.db.collection(this.tableName,
      ref => ref.where('userPrimaryKey', '==', this.authService.getUid()));
    this.mainList$ = this.listCollection.stateChanges().pipe(
      map(changes =>
        changes.map(c => {
          const data = c.payload.doc.data() as ReminderModel;
          data.primaryKey = c.payload.doc.id;
          return Object.assign({data, actionType: c.type, employeeName: this.employeeMap.get(data.employeePrimaryKey)});
        })
      )
    );
    return this.mainList$;
  }

  getMainItemsBetweenDates(startDate: Date, endDate: Date): Observable<ReminderModel[]> {
    this.listCollection = this.db.collection(this.tableName,
      ref => ref.orderBy('reminderDate')
        .where('userPrimaryKey', '==', this.authService.getUid())
        .where('isActive', '==', true)
        .where('periodType', '==', 'oneTime')
        .startAt(startDate.getTime()).endAt(endDate.getTime()));
    this.mainList$ = this.listCollection.stateChanges().pipe(
      map(changes =>
        changes.map(c => {
          const data = c.payload.doc.data() as ReminderModel;
          data.primaryKey = c.payload.doc.id;
          return Object.assign({data, actionType: c.type, employeeName: this.employeeMap.get(data.employeePrimaryKey)});
        })
      )
    );
    return this.mainList$;
  }

  getMainItemsTimeBetweenDates(startDate: Date, endDate: Date, isActive: string, periodType: string): Observable<ReminderModel[]> {
    this.listCollection = this.db.collection(this.tableName,
      ref => {
        let query: CollectionReference | Query = ref;
        query = query.orderBy('reminderDate').startAt(startDate.getTime()).endAt(endDate.getTime())
          .where('userPrimaryKey', '==', this.authService.getUid())
          .where('employeePrimaryKey', '==', this.authService.getEid());
        if (isActive !== '-1') { query = query.where('isActive', '==', isActive === '1'); }
        if (periodType !== '-1') { query = query.where('periodType', '==', periodType); }
        return query;
      });
    this.mainList$ = this.listCollection.stateChanges().pipe(
      map(changes =>
        changes.map(c => {
          const data = c.payload.doc.data() as ReminderModel;
          data.primaryKey = c.payload.doc.id;
          return Object.assign({data, actionType: c.type, employeeName: this.employeeMap.get(data.employeePrimaryKey)});
        })
      )
    );
    return this.mainList$;
  }

  getEmployeeDailyReminderCollection(startDate: Date): Observable<ReminderModel[]> {
    this.listEmployeeDailyReminderCollection$ = this.db.collection(this.tableName,
      ref => ref.orderBy('reminderDate')
        .where('userPrimaryKey', '==', this.authService.getUid())
        .where('employeePrimaryKey', '==', this.authService.getEid())
        .where('isActive', '==', true)
        .where('periodType', '==', 'daily')
        .startAfter(startDate.getTime())).stateChanges().pipe(
      map(changes =>
        changes.map(c => {
          const data = c.payload.doc.data() as ReminderModel;
          data.primaryKey = c.payload.doc.id;
          return Object.assign({data, actionType: c.type, employeeName: this.employeeMap.get(data.employeePrimaryKey)});
        })
      )
    );
    return this.listEmployeeDailyReminderCollection$;
  }

  getEmployeeMonthlyReminderCollection(startDate: Date): Observable<ReminderModel[]> {
    this.listEmployeeMonthlyReminderCollection$ = this.db.collection(this.tableName,
      ref => ref.orderBy('reminderDate')
        .where('userPrimaryKey', '==', this.authService.getUid())
        .where('employeePrimaryKey', '==', this.authService.getEid())
        .where('isActive', '==', true)
        .where('day', '==', startDate.getDate())
        .where('periodType', '==', 'monthly')
        .startAfter(startDate.getTime())).stateChanges().pipe(
      map(changes =>
        changes.map(c => {
          const data = c.payload.doc.data() as ReminderModel;
          data.primaryKey = c.payload.doc.id;
          return Object.assign({data, actionType: c.type, employeeName: this.employeeMap.get(data.employeePrimaryKey)});
        })
      )
    );
    return this.listEmployeeMonthlyReminderCollection$;
  }

  getEmployeeYearlyReminderCollection(startDate: Date): Observable<ReminderModel[]> {
    this.listEmployeeYearlyReminderCollection$ = this.db.collection(this.tableName,
      ref => ref.orderBy('reminderDate')
        .where('userPrimaryKey', '==', this.authService.getUid())
        .where('employeePrimaryKey', '==', this.authService.getEid())
        .where('isActive', '==', true)
        .where('day', '==', startDate.getDate())
        .where('month', '==', startDate.getMonth() + 1)
        .where('periodType', '==', 'yearly')
        .startAfter(startDate.getTime())).stateChanges().pipe(
      map(changes =>
        changes.map(c => {
          const data = c.payload.doc.data() as ReminderModel;
          data.primaryKey = c.payload.doc.id;
          return Object.assign({data, actionType: c.type, employeeName: this.employeeMap.get(data.employeePrimaryKey)});
        })
      )
    );
    return this.listEmployeeYearlyReminderCollection$;
  }

}
