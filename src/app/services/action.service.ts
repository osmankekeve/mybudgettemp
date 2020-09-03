import {Injectable} from '@angular/core';
import {AngularFirestore, AngularFirestoreCollection} from '@angular/fire/firestore';
import {AuthenticationService} from './authentication.service';
import {Observable, combineLatest} from 'rxjs';
import {map, flatMap} from 'rxjs/operators';
import {ActionModel} from '../models/action-model';
import {ProfileModel} from '../models/profile-model';
import {ActionMainModel} from '../models/action-main-model';
import {DeliveryAddressModel} from '../models/delivery-address-model';

@Injectable({
  providedIn: 'root'
})
export class ActionService {
  listCollection: AngularFirestoreCollection<ActionModel>;
  mainList$: Observable<ActionMainModel[]>;
  constructor(protected authService: AuthenticationService,
              protected db: AngularFirestore) {

  }

  getActions_2(table: string, primaryKey: string): Observable<ActionModel[]> {
    this.listCollection = this.db.collection<ActionModel>(table).doc(primaryKey).collection('actions');
    return this.listCollection.valueChanges({ idField : 'primaryKey'});
  }

  getActions(table: string, primaryKey: string): Observable<ActionMainModel[]> {
    this.listCollection = this.db.collection(table).doc(primaryKey).collection('actions',
      ref => ref.orderBy('insertDate'));
    this.mainList$ = this.listCollection.stateChanges().pipe(map(changes => {
      return changes.map(change => {
        const data = change.payload.doc.data() as ActionModel;
        const returnData = new ActionMainModel();
        returnData.data = data;
        returnData.actionType = change.type;

        return this.db.collection('tblProfile').doc(data.employeePrimaryKey).valueChanges()
          .pipe(map((employee: ProfileModel) => {
            returnData.employeeName = employee.longName;
            return Object.assign({returnData});
          }));
      });
    }), flatMap(feeds => combineLatest(feeds)));
    return this.mainList$;
  }

  addAction(table: string, primaryKey: string, importance: number, action: string) {
    const data = this.newModel();
    data.importance = importance;
    data.action = action;

    this.db.collection(table).doc(primaryKey)
      .collection('actions')
      .add(Object.assign({}, data));
  }

  addActionToCustomer(primaryKey: string, importance: number, action: string) {
    const data = this.newModel();
    data.importance = importance;
    data.action = action;

    this.db.collection('tblCustomer').doc(primaryKey)
      .collection('actions')
      .add(Object.assign({}, data));
  }

  removeActions(tableName: string, primaryKey: string) {
    this.db.collection(tableName).doc(primaryKey)
      .collection('actions').get().subscribe(snapshot => {
      snapshot.forEach(doc => {
        doc.ref.delete();
      });
    });
  }

  newModel(): ActionModel {

    const returnData = new ActionModel();
    returnData.importance = 1;
    returnData.action = '';
    returnData.employeePrimaryKey = this.authService.getEid();
    returnData.insertDate = Date.now();

    return returnData;
  }

}
