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
import {CustomerModel} from '../models/customer-model';
import {ProductPriceModel} from '../models/product-price-model';
import {ProductPriceMainModel} from '../models/product-price-main-model';
import {ProductModel} from '../models/product-model';
import {CollectionMainModel} from '../models/collection-main-model';
import {CollectionModel} from '../models/collection-model';
import {currencyFormat, getStatus} from '../core/correct-library';
import {combineLatest} from 'rxjs';
import {PriceListModel} from '../models/price-list-model';
import {PriceListMainModel} from '../models/price-list-main-model';
import {ProductPriceService} from './product-price.service';
import {DiscountListMainModel} from '../models/discount-list-main-model';
import {DiscountListModel} from '../models/discount-list-model';
import {ProductDiscountService} from './product-discount.service';

@Injectable({
  providedIn: 'root'
})
export class DiscountListService {
  listCollection: AngularFirestoreCollection<DiscountListModel>;
  mainList$: Observable<DiscountListMainModel[]>;
  tableName = 'tblDiscountList';

  constructor(protected authService: AuthenticationService, protected sService: SettingService, protected cusService: CustomerService,
              protected logService: LogService, protected db: AngularFirestore,
              protected ppService: ProductDiscountService, protected actService: ActionService) {

  }

  async addItem(record: DiscountListMainModel) {
    return await this.listCollection.add(Object.assign({}, record.data));
  }

  async removeItem(record: DiscountListMainModel) {
    return await this.db.collection(this.tableName).doc(record.data.primaryKey).delete();
  }

  async updateItem(record: DiscountListMainModel) {
    return await this.db.collection(this.tableName).doc(record.data.primaryKey).update(Object.assign({}, record.data));
  }

  async setItem(record: DiscountListMainModel, primaryKey: string) {
    return await this.listCollection.doc(primaryKey).set(Object.assign({}, record.data));
  }

  checkForSave(record: DiscountListMainModel): Promise<string> {
    return new Promise((resolve, reject) => {
      if (record.data.listName === '' ) {
        reject('Lütfen liste adı giriniz.');
      } else {
        resolve(null);
      }
    });
  }

  checkForRemove(record: DiscountListMainModel): Promise<string> {
    return new Promise(async (resolve, reject) => {
      resolve(null);
    });
  }

  clearSubModel(): DiscountListModel {

    const returnData = new DiscountListModel();
    returnData.primaryKey = null;
    returnData.userPrimaryKey = this.authService.getUid();
    returnData.listName = '';
    returnData.type = '-1'; // sales, purchase
    returnData.isActive = true;
    returnData.description = '';
    returnData.beginDate = Date.now();
    returnData.finishDate = Date.now();
    returnData.insertDate = Date.now();

    return returnData;
  }

  clearMainModel(): DiscountListMainModel {
    const returnData = new DiscountListMainModel();
    returnData.data = this.clearSubModel();
    returnData.actionType = 'added';
    returnData.isActiveTr = returnData.data.isActive === true ? 'Aktif' : 'Pasif';
    returnData.typeTr = returnData.data.type === 'sales' ? 'Satış Listesi' : 'Alım Listesi';
    return returnData;
  }

  checkFields(model: DiscountListModel): DiscountListModel {
    const cleanModel = this.clearSubModel();

    return model;
  }

  getItem(primaryKey: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.collection(this.tableName).doc(primaryKey).get().toPromise().then(doc => {
        if (doc.exists) {
          const data = doc.data() as DiscountListModel;
          data.primaryKey = doc.id;

          const returnData = new DiscountListMainModel();
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

  getItemWithDetail(primaryKey: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.collection(this.tableName).doc(primaryKey).get().toPromise().then(async doc => {
        if (doc.exists) {
          const data = doc.data() as DiscountListModel;
          data.primaryKey = doc.id;

          const returnData = new DiscountListMainModel();
          returnData.data = this.checkFields(data);
          returnData.isActiveTr = returnData.data.isActive === true ? 'Aktif' : 'Pasif';
          returnData.typeTr = returnData.data.type === 'sales' ? 'Satış Listesi' : 'Alım Listesi';

          [returnData.productList] = await Promise.all([this.ppService.getProductsForListDetail(returnData.data.primaryKey)]);
          return Object.assign({returnData});
        } else {
          resolve(null);
        }
      });
    });
  }

  getMainItems(): Observable<DiscountListMainModel[]> {
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
          const data = c.payload.doc.data() as DiscountListModel;
          data.primaryKey = c.payload.doc.id;

          const returnData = new DiscountListMainModel();
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
}
