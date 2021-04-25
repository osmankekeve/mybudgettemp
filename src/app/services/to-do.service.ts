import {Injectable} from '@angular/core';
import {AngularFirestore, AngularFirestoreCollection, CollectionReference, Query} from '@angular/fire/firestore';
import {Observable} from 'rxjs/Observable';
import {map} from 'rxjs/operators';
import {AuthenticationService} from './authentication.service';
import {ProfileService} from './profile.service';
import {TodoListModel} from '../models/to-do-list-model';
import {TodoListMainModel} from '../models/to-do-list-main-model';

@Injectable({
  providedIn: 'root'
})
export class ToDoService {
  listCollection: AngularFirestoreCollection<TodoListModel>;
  mainList$: Observable<TodoListMainModel[]>;
  employeeMap = new Map();
  tableName = 'tblTodoList';

  constructor(public authService: AuthenticationService,
              public eService: ProfileService,
              public db: AngularFirestore) {

    if (this.authService.isUserLoggedIn()) {
      this.eService.getItems().toPromise().then(list => {
        this.employeeMap.clear();
        this.employeeMap.set('-1', 'Tüm Kullanıcılar');
        list.forEach(item => {
          this.employeeMap.set(item.primaryKey, item);
        });
      });
    }
  }

  async addItem(record: TodoListMainModel) {
    return await this.listCollection.add(Object.assign({}, record.data));
  }

  async removeItem(record: TodoListMainModel) {
    return await this.db.collection(this.tableName).doc(record.data.primaryKey).delete();
  }

  async updateItem(record: TodoListMainModel) {
    return await this.db.collection(this.tableName).doc(record.data.primaryKey).update(Object.assign({}, record.data));
  }

  async setItem(record: TodoListMainModel) {
    return await this.listCollection.doc(record.data.primaryKey).set(Object.assign({}, record.data));
  }

  checkForSave(record: TodoListMainModel): Promise<string> {
    return new Promise((resolve, reject) => {
      if (record.data.todoText.trim() === '') {
        reject('Lüfen açıklama giriniz.');
      } else {
        resolve(null);
      }
    });
  }

  checkForRemove(record: TodoListMainModel): Promise<string> {
    return new Promise((resolve, reject) => {
      resolve(null);
    });
  }

  getItem(primaryKey: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.collection(this.tableName).doc(primaryKey).get().toPromise().then(doc => {
        if (doc.exists) {
          const data = doc.data() as TodoListModel;
          data.primaryKey = doc.id;

          const returnData = new TodoListMainModel();
          returnData.data = data;
          returnData.isActiveTr = returnData.data.isActive === true ? 'Aktif' : 'Pasif';
          returnData.employee = this.employeeMap.get(returnData.data.employeePrimaryKey);

          resolve(Object.assign({returnData}));
        } else {
          resolve(null);
        }
      });
    });
  }

  clearSubModel(): TodoListModel {

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

  clearMainModel(): TodoListMainModel {
    const returnData = new TodoListMainModel();
    returnData.data = this.clearSubModel();
    returnData.employee = this.employeeMap.get(returnData.data.employeePrimaryKey);
    returnData.actionType = 'added';
    returnData.isActiveTr = returnData.data.isActive === true ? 'Aktif' : 'Pasif';
    return returnData;
  }

  getMainItemsTimeBetweenDates(startDate: Date, endDate: Date, isActive: string): Observable<TodoListMainModel[]> {
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

          const returnData = new TodoListMainModel();
          returnData.actionType = c.type;
          returnData.data = data;
          returnData.isActiveTr = returnData.data.isActive === true ? 'Aktif' : 'Pasif';
          returnData.employee = this.employeeMap.get(returnData.data.employeePrimaryKey);

          return Object.assign({returnData});
        })
      )
    );
    return this.mainList$;
  }

}
