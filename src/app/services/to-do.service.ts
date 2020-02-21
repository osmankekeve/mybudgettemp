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
import {TodoListModel} from '../models/to-do-list-model';
import {CollectionModel} from '../models/collection-model';

@Injectable({
  providedIn: 'root'
})
export class ToDoService {
  listCollection: AngularFirestoreCollection<TodoListModel>;
  mainList$: Observable<TodoListModel[]>;
  employeeMap = new Map();
  tableName = 'tblTodoList';

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

  async addItem(record: TodoListModel) {
    return await this.listCollection.add(Object.assign({}, record));
  }

  async removeItem(record: TodoListModel) {
    return await this.db.collection(this.tableName).doc(record.primaryKey).delete();
  }

  async updateItem(record: TodoListModel) {
    return await this.db.collection(this.tableName).doc(record.primaryKey).update(Object.assign({}, record));
  }

  getItem(primaryKey: string): Promise<any> {
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

  clearModel(): TodoListModel {

    const returnData = new TodoListModel();
    returnData.primaryKey = null;
    returnData.userPrimaryKey = this.authService.getUid();
    returnData.employeePrimaryKey = this.authService.getEid();
    returnData.todoText = '';
    returnData.isActive = true;
    returnData.result = '';
    returnData.insertDate = Date.now();

    return returnData;
  }

  getMainItemsTimeBetweenDates(startDate: Date, endDate: Date, isActive: string): Observable<TodoListModel[]> {
    this.listCollection = this.db.collection(this.tableName,
      ref => {
        let query: CollectionReference | Query = ref;
        query = query.orderBy('insertDate')
          .where('userPrimaryKey', '==', this.authService.getUid())
          .where('employeePrimaryKey', '==', this.authService.getEid());
        if (startDate !== undefined) { query = query.startAt(startDate.getTime()); }
        if (endDate !== undefined) { query = query.endAt(endDate.getTime()); }
        if (isActive !== undefined && isActive !== '-1') { query = query.where('isActive', '==', isActive === '1'); }
        return query;
      });
    this.mainList$ = this.listCollection.stateChanges().pipe(
      map(changes =>
        changes.map(c => {
          const data = c.payload.doc.data() as TodoListModel;
          data.primaryKey = c.payload.doc.id;
          return Object.assign({data, actionType: c.type, employeeName: this.employeeMap.get(data.employeePrimaryKey)});
        })
      )
    );
    return this.mainList$;
  }

}
