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
import {ProductService} from './product.service';

@Injectable({
  providedIn: 'root'
})
export class ProductPriceService {
  listCollection: AngularFirestoreCollection<ProductPriceModel>;
  mainList$: Observable<ProductPriceMainModel[]>;
  tableName = 'tblProductPrice';

  constructor(protected authService: AuthenticationService, protected sService: SettingService, protected cusService: CustomerService,
              protected logService: LogService, protected pService: ProductService, protected db: AngularFirestore,
              protected atService: AccountTransactionService, protected actService: ActionService) {

  }

  async addItem(record: ProductPriceMainModel) {
    return await this.listCollection.add(Object.assign({}, record.data))
      .then(async () => {
        await this.logService.addTransactionLog(record, 'insert', 'product-price');
      });
  }

  async removeItem(record: ProductPriceMainModel) {
    return await this.db.collection(this.tableName).doc(record.data.primaryKey).delete()
      .then(async () => {
        await this.logService.addTransactionLog(record, 'delete', 'product-price');
      });
  }

  async updateItem(record: ProductPriceMainModel) {
    return await this.db.collection(this.tableName).doc(record.data.primaryKey)
      .update(Object.assign({}, record.data))
      .then(async value => {
        await this.logService.addTransactionLog(record, 'update', 'product-price');
      });
  }

  async setItem(record: ProductPriceMainModel, primaryKey: string) {
    return await this.listCollection.doc(primaryKey).set(Object.assign({}, record.data))
      .then(async value => {
        await this.logService.addTransactionLog(record, 'insert', 'product-price');
      });
  }

  checkForSave(record: ProductPriceMainModel): Promise<string> {
    return new Promise((resolve, reject) => {
      if (record.data.productPrimaryKey === '' || record.data.productPrimaryKey === '-1') {
        reject('Lütfen ürün seçiniz.');
      } else if (record.product.stockType === 'normal' && record.data.productPrice <= 0) {
        reject('Lütfen fiyat giriniz.');
      } else if (record.data.productPrice < 0) {
        reject('Lütfen fiyat giriniz.');
      } else {
        resolve(null);
      }
    });
  }

  checkForRemove(record: ProductPriceMainModel): Promise<string> {
    return new Promise(async (resolve, reject) => {
      resolve(null);
    });
  }

  clearSubModel(): ProductPriceModel {

    const returnData = new ProductPriceModel();
    returnData.primaryKey = null;
    returnData.userPrimaryKey = this.authService.getUid();
    returnData.productPrice = 0;
    returnData.insertDate = Date.now();

    return returnData;
  }

  clearMainModel(): ProductPriceMainModel {
    const returnData = new ProductPriceMainModel();
    returnData.product = this.pService.clearSubModel();
    returnData.data = this.clearSubModel();
    returnData.actionType = 'added';
    return returnData;
  }

  checkFields(model: ProductPriceModel): ProductPriceModel {
    const cleanModel = this.clearSubModel();

    return model;
  }

  getItem(primaryKey: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.collection(this.tableName).doc(primaryKey).get().toPromise().then(doc => {
        if (doc.exists) {
          const data = doc.data() as ProductPriceModel;
          data.primaryKey = doc.id;

          const returnData = new ProductPriceMainModel();
          returnData.data = this.checkFields(data);
          return this.db.collection('tblProduct').doc(data.productPrimaryKey).valueChanges()
            .pipe(map((product: ProductModel) => {
              returnData.product = product;
              return Object.assign({returnData});
            }));
        } else {
          resolve(null);
        }
      });
    });
  }

  getMainItems(): Observable<ProductPriceMainModel[]> {
    this.listCollection = this.db.collection(this.tableName,
      ref => ref.where('userPrimaryKey', '==', this.authService.getUid()));
    this.mainList$ = this.listCollection.stateChanges().pipe(map(changes => {
      return changes.map(change => {
        const data = change.payload.doc.data() as ProductPriceModel;
        data.primaryKey = change.payload.doc.id;

        const returnData = new ProductPriceMainModel();
        returnData.data = this.checkFields(data);
        returnData.actionType = change.type;

        return this.db.collection('tblProduct').doc(data.productPrimaryKey).valueChanges()
          .pipe(map((product: ProductModel) => {
            returnData.product = product;
            return Object.assign({returnData});
          }));
      });
    }), flatMap(feeds => combineLatest(feeds)));
    return this.mainList$;
  }

  getProductsOnList(priceListPrimaryKey: string): Observable<ProductPriceMainModel[]> {
    this.listCollection = this.db.collection(this.tableName,
      ref => {
        let query: CollectionReference | Query = ref;
        query = query.where('userPrimaryKey', '==', this.authService.getUid())
          .where('priceListPrimaryKey', '==', priceListPrimaryKey);
        return query;
      });
    this.mainList$ = this.listCollection.stateChanges().pipe(map(changes => {
      return changes.map(change => {
        const data = change.payload.doc.data() as ProductPriceModel;
        data.primaryKey = change.payload.doc.id;

        const returnData = new ProductPriceMainModel();
        returnData.data = this.checkFields(data);
        returnData.actionType = change.type;
        return Object.assign({returnData});
      });
    }), flatMap(feeds => combineLatest(feeds)));
    return this.mainList$;
  }
}
