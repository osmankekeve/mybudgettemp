import {Injectable} from '@angular/core';
import {AngularFirestore, AngularFirestoreCollection, CollectionReference, Query} from '@angular/fire/firestore';
import {Observable} from 'rxjs/Observable';
import {map, flatMap} from 'rxjs/operators';
import {AuthenticationService} from './authentication.service';
import {LogService} from './log.service';
import {SettingService} from './setting.service';
import {ProfileService} from './profile.service';
import {CustomerService} from './customer.service';
import {AccountTransactionService} from './account-transaction.service';
import {ActionService} from './action.service';
import {ProductUnitMainModel} from '../models/product-unit-main-model';
import {ProductUnitModel} from '../models/product-unit-model';

@Injectable({
  providedIn: 'root'
})
export class ProductUnitService {
  listCollection: AngularFirestoreCollection<ProductUnitModel>;
  mainList$: Observable<ProductUnitMainModel[]>;
  tableName = 'tblProductUnit';

  constructor(protected authService: AuthenticationService, protected sService: SettingService, protected cusService: CustomerService,
              protected logService: LogService, protected eService: ProfileService, protected db: AngularFirestore,
              protected atService: AccountTransactionService, protected actService: ActionService) {

  }

  async addItem(record: ProductUnitMainModel) {
    return await this.listCollection.add(Object.assign({}, record.data))
      .then(async () => {
        await this.logService.addTransactionLog(record, 'insert', 'product-unit');
      });
  }

  async removeItem(record: ProductUnitMainModel) {
    return await this.db.collection(this.tableName).doc(record.data.primaryKey).delete()
      .then(async () => {
        await this.logService.addTransactionLog(record, 'delete', 'product-unit');
      });
  }

  async updateItem(record: ProductUnitMainModel) {
    return await this.db.collection(this.tableName).doc(record.data.primaryKey)
      .update(Object.assign({}, record.data))
      .then(async value => {
        await this.logService.addTransactionLog(record, 'update', 'product-unit');
      });
  }

  async setItem(record: ProductUnitMainModel, primaryKey: string) {
    return await this.listCollection.doc(primaryKey).set(Object.assign({}, record.data))
      .then(async value => {
        await this.logService.addTransactionLog(record, 'insert', 'product');
      });
  }

  checkForSave(record: ProductUnitMainModel): Promise<string> {
    return new Promise((resolve, reject) => {
      if (record.data.unitName === '') {
        reject('Lütfen birim adı giriniz.');
      } else {
        resolve(null);
      }
    });
  }

  checkForRemove(record: ProductUnitMainModel): Promise<string> {
    return new Promise((resolve, reject) => {
      resolve(null);
    });
  }

  clearSubModel(): ProductUnitModel {

    const returnData = new ProductUnitModel();
    returnData.primaryKey = null;
    returnData.userPrimaryKey = this.authService.getUid();
    returnData.employeePrimaryKey = this.authService.getEid();
    returnData.unitName = '';
    returnData.isActive = true;
    returnData.insertDate = Date.now();

    return returnData;
  }

  clearMainModel(): ProductUnitMainModel {
    const returnData = new ProductUnitMainModel();
    returnData.data = this.clearSubModel();
    returnData.actionType = 'added';
    returnData.isActiveTr = returnData.data.isActive === true ? 'Aktif' : 'Pasif';
    return returnData;
  }

  checkFields(model: ProductUnitModel): ProductUnitModel {
    const cleanModel = this.clearSubModel();

    return model;
  }

  getItem(primaryKey: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.collection(this.tableName).doc(primaryKey).get().toPromise().then(doc => {
        if (doc.exists) {
          const data = doc.data() as ProductUnitModel;
          data.primaryKey = doc.id;

          const returnData = new ProductUnitMainModel();
          returnData.data = this.checkFields(data);
          returnData.isActiveTr = returnData.data.isActive === true ? 'Aktif' : 'Pasif';
          return Object.assign({returnData});
        } else {
          resolve(null);
        }
      });
    });
  }

  getMainItems(): Observable<ProductUnitMainModel[]> {
    // left join siz
    this.listCollection = this.db.collection(this.tableName,
      ref => {
        let query: CollectionReference | Query = ref;
        query = query.where('userPrimaryKey', '==', this.authService.getUid());
        return query;
      });
    this.mainList$ = this.listCollection.stateChanges().pipe(
      map(changes =>
        changes.map(c => {
          const data = c.payload.doc.data() as ProductUnitModel;
          data.primaryKey = c.payload.doc.id;

          const returnData = new ProductUnitMainModel();
          returnData.data = this.checkFields(data);
          returnData.actionType = c.type;
          returnData.isActiveTr = returnData.data.isActive === true ? 'Aktif' : 'Pasif';
          return Object.assign({returnData});
        })
      )
    );
    return this.mainList$;
  }
}