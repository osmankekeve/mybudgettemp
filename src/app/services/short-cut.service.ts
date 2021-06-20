import {Injectable} from '@angular/core';
import {AngularFirestore, AngularFirestoreCollection} from '@angular/fire/firestore';
import {Observable} from 'rxjs/Observable';
import {map, mergeMap} from 'rxjs/operators';
import {combineLatest} from 'rxjs';
import {AuthenticationService} from './authentication.service';
import { ShortCutRecordModel } from '../models/short-cut-model';
import { ShortCutRecordMainModel } from '../models/short-cut-main-model';

@Injectable({
  providedIn: 'root'
})
export class ShortCutRecordService {
  listCollection: AngularFirestoreCollection<ShortCutRecordModel>;
  mainList$: Observable<ShortCutRecordMainModel[]>;
  tableName = 'tblShortCutRecord';

  constructor(public authService: AuthenticationService,
              public db: AngularFirestore) {
                this.listCollection = this.db.collection(this.tableName);
  }

  async addItem(record: ShortCutRecordModel) {
    return await this.listCollection.add(Object.assign({}, record));
  }

  async removeItem(record: ShortCutRecordModel) {
    return await this.db.collection(this.tableName).doc(record.primaryKey).delete();
  }

  async updateItem(record: ShortCutRecordModel) {
    return await this.db.collection(this.tableName).doc(record.primaryKey).update(Object.assign({}, record));
  }

  async setItem(record: ShortCutRecordModel, primaryKey: string) {
    return await this.listCollection.doc(primaryKey).set(Object.assign({}, record));
  }

  checkForSave(record: ShortCutRecordMainModel): Promise<string> {
    return new Promise((resolve, reject) => {
      resolve(null);
    });
  }

  checkForRemove(record: ShortCutRecordModel): Promise<string> {
    return new Promise((resolve, reject) => {
      resolve(null);
    });
  }

  checkFields(model: ShortCutRecordModel): ShortCutRecordModel {
    const cleanModel = this.clearSubModel();

    return model;
  }

  clearSubModel(): ShortCutRecordModel {

    const returnData = new ShortCutRecordModel();
    returnData.userPrimaryKey = this.authService.getUid();
    returnData.employeePrimaryKey = this.authService.getEid();
    returnData.parentRecordPrimaryKey = '-1';
    returnData.parentRecordType = '';  // sales-order, purchase-order, account-voucher, stock-voucher
    returnData.title = '';
    returnData.insertDate = Date.now();

    return returnData;
  }

  clearMainModel(): ShortCutRecordMainModel {
    const returnData = new ShortCutRecordMainModel();
    returnData.data = this.clearSubModel();
    returnData.actionType = 'added';
    return returnData;
  }

  getItem(primaryKey: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.collection(this.tableName).doc(primaryKey).get().toPromise()
        .then(doc => {
        if (doc.exists) {
          const data = doc.data() as ShortCutRecordModel;
          data.primaryKey = doc.id;

          const returnData = new ShortCutRecordMainModel();
          returnData.data = this.checkFields(data);
          resolve(Object.assign({returnData}));
        } else {
          resolve(null);
        }
      });
    });
  }

  getMainItems(): Observable<ShortCutRecordMainModel[]> {
    this.listCollection = this.db.collection(this.tableName,
      ref => ref.orderBy('actionDate').where('userPrimaryKey', '==', this.authService.getUid()));
    this.mainList$ = this.listCollection.stateChanges().pipe(map(changes => {
      return changes.map(change => {
        const data = change.payload.doc.data() as ShortCutRecordModel;
        data.primaryKey = change.payload.doc.id;

        const returnData = new ShortCutRecordMainModel();
        returnData.data = this.checkFields(data);
        returnData.actionType = change.type;

        return Object.assign({returnData});
      });
    }), mergeMap(feeds => combineLatest(feeds)));
    return this.mainList$;
  }

  getMainItemsBetweenDatesAsPromise = async (parentRecordType: String):
    Promise<Array<ShortCutRecordMainModel>> => new Promise(async (resolve, reject): Promise<void> => {
    try {
      const list = Array<ShortCutRecordMainModel>();
      this.db.collection(this.tableName, ref =>
        ref.where('userPrimaryKey', '==', this.authService.getUid())
        .where('employeePrimaryKey', '==', this.authService.getEid())
        .where('parentRecordType', '==', parentRecordType))
        .get().toPromise().then(snapshot => {
        snapshot.forEach(doc => {
          const data = doc.data() as ShortCutRecordModel;
          data.primaryKey = doc.id;

          const returnData = new ShortCutRecordMainModel();
          returnData.data = this.checkFields(data);

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
