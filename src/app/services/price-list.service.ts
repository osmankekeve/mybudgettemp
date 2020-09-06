import {Injectable} from '@angular/core';
import {AngularFirestore, AngularFirestoreCollection, CollectionReference, Query} from '@angular/fire/firestore';
import {Observable} from 'rxjs/Observable';
import {map, flatMap} from 'rxjs/operators';
import {AuthenticationService} from './authentication.service';
import {LogService} from './log.service';
import {SettingService} from './setting.service';
import {CustomerService} from './customer.service';
import {ActionService} from './action.service';
import {PriceListModel} from '../models/price-list-model';
import {PriceListMainModel} from '../models/price-list-main-model';
import {ProductPriceService} from './product-price.service';
import {CustomerMainModel} from '../models/customer-main-model';
import {CustomerModel} from '../models/customer-model';

@Injectable({
  providedIn: 'root'
})
export class PriceListService {
  listCollection: AngularFirestoreCollection<PriceListModel>;
  mainList$: Observable<PriceListMainModel[]>;
  tableName = 'tblPriceList';

  constructor(protected authService: AuthenticationService, protected sService: SettingService, protected cusService: CustomerService,
              protected logService: LogService, protected db: AngularFirestore,
              protected ppService: ProductPriceService, protected actService: ActionService) {

  }

  async addItem(record: PriceListMainModel) {
    return await this.listCollection.add(Object.assign({}, record.data));
  }

  async removeItem(record: PriceListMainModel) {
    return await this.db.collection(this.tableName).doc(record.data.primaryKey).delete();
  }

  async updateItem(record: PriceListMainModel) {
    return await this.db.collection(this.tableName).doc(record.data.primaryKey).update(Object.assign({}, record.data));
  }

  async setItem(record: PriceListMainModel, primaryKey: string) {
    return await this.listCollection.doc(primaryKey).set(Object.assign({}, record.data));
  }

  checkForSave(record: PriceListMainModel): Promise<string> {
    return new Promise((resolve, reject) => {
      if (record.data.listName === '' ) {
        reject('Lütfen liste adı giriniz.');
      } else {
        resolve(null);
      }
    });
  }

  checkForRemove(record: PriceListMainModel): Promise<string> {
    return new Promise(async (resolve, reject) => {
      resolve(null);
    });
  }

  clearSubModel(): PriceListModel {

    const returnData = new PriceListModel();
    returnData.primaryKey = null;
    returnData.userPrimaryKey = this.authService.getUid();
    returnData.listName = '';
    returnData.type = '-1';
    returnData.isActive = true;
    returnData.description = '';
    returnData.beginDate = Date.now();
    returnData.finishDate = Date.now();
    returnData.insertDate = Date.now();

    return returnData;
  }

  clearMainModel(): PriceListMainModel {
    const returnData = new PriceListMainModel();
    returnData.data = this.clearSubModel();
    returnData.actionType = 'added';
    returnData.isActiveTr = returnData.data.isActive === true ? 'Aktif' : 'Pasif';
    returnData.typeTr = returnData.data.type === 'sales' ? 'Satış Listesi' : 'Alım Listesi';
    return returnData;
  }

  checkFields(model: PriceListModel): PriceListModel {
    const cleanModel = this.clearSubModel();

    return model;
  }

  getItem(primaryKey: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.collection(this.tableName).doc(primaryKey).get().toPromise().then(doc => {
        if (doc.exists) {
          const data = doc.data() as PriceListModel;
          data.primaryKey = doc.id;

          const returnData = new PriceListMainModel();
          returnData.data = this.checkFields(data);
          returnData.isActiveTr = returnData.data.isActive === true ? 'Aktif' : 'Pasif';
          returnData.typeTr = returnData.data.type === 'sales' ? 'Satış Listesi' : 'Alım Listesi';
          return Object.assign({returnData});
        } else {
          resolve(null);
        }
      });
    });
  }

  getMainItems(): Observable<PriceListMainModel[]> {
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
          const data = c.payload.doc.data() as PriceListModel;
          data.primaryKey = c.payload.doc.id;

          const returnData = new PriceListMainModel();
          returnData.data = this.checkFields(data);
          returnData.actionType = c.type;
          returnData.isActiveTr = returnData.data.isActive === true ? 'Aktif' : 'Pasif';
          returnData.typeTr = returnData.data.type === 'sales' ? 'Satış Listesi' : 'Alım Listesi';
          return Object.assign({returnData});
        })
      )
    );
    return this.mainList$;
  }

  getPriceLists = async (isActive: Array<boolean>, type: string):
    Promise<Array<PriceListModel>> => new Promise(async (resolve, reject): Promise<void> => {
    try {
      const list = Array<PriceListModel>();
      await this.db.collection(this.tableName, ref => {
        let query: CollectionReference | Query = ref;
        query = query.where('userPrimaryKey', '==', this.authService.getUid())
          .where('isActive', 'in', isActive)
          .where('type', '==', type);
        return query;
      }).get()
        .subscribe(snapshot => {
          snapshot.forEach(doc => {
            const data = doc.data() as PriceListModel;
            data.primaryKey = doc.id;

            list.push(data);
          });
          resolve(list);
        });

    } catch (error) {
      console.error(error);
      reject({code: 401, message: 'You do not have permission or there is a problem about permissions!'});
    }
  })
}
