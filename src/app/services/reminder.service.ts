import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { Observable } from 'rxjs/Observable';
import { map, flatMap } from 'rxjs/operators';
import { combineLatest } from 'rxjs';
import { AuthenticationService } from './authentication.service';
import {ReminderModel} from '../models/reminder-model';
import {ProfileModel} from '../models/profile-model';
import {CustomerModel} from '../models/customer-model';
import {CustomerService} from './customer.service';
import {PurchaseInvoiceModel} from '../models/purchase-invoice-model';
import {ProfileService} from './profile.service';

@Injectable({
  providedIn: 'root'
})
export class ReminderService {
  listCollection: AngularFirestoreCollection<ReminderModel>;
  mainList$: Observable<ReminderModel[]>;
  customerList$: Observable<CustomerModel[]>;
  employeeMap = new Map();
  tableName = 'tblReminder';

  constructor(public authService: AuthenticationService,
              public eService: ProfileService,
              public db: AngularFirestore) {
    this.eService.getAllItems().subscribe(list => {
      this.employeeMap.clear();
      this.employeeMap.set('-1', 'Tüm Kullanıcılar');
      list.forEach(item => {
        this.employeeMap.set(item.primaryKey, item.longName);
      });
    });
  }

  getAllItems(): Observable<ReminderModel[]> {
    this.listCollection = this.db.collection<ReminderModel>(this.tableName,
    ref => ref.where('userPrimaryKey', '==', this.authService.getUid()));
    this.mainList$ = this.listCollection.valueChanges({ idField : 'primaryKey'});
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

  getMainItemsOneTimeBetweenDates(startDate: Date, endDate: Date): Observable<ReminderModel[]> {
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

}
