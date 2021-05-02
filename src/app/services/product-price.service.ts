import {Injectable} from '@angular/core';
import {AngularFirestore, AngularFirestoreCollection, CollectionReference, Query} from '@angular/fire/firestore';
import {Observable} from 'rxjs/Observable';
import {map, mergeMap} from 'rxjs/operators';
import {AuthenticationService} from './authentication.service';
import {LogService} from './log.service';
import {SettingService} from './setting.service';
import {CustomerService} from './customer.service';
import {AccountTransactionService} from './account-transaction.service';
import {ActionService} from './action.service';
import {ProductPriceModel} from '../models/product-price-model';
import {ProductPriceMainModel} from '../models/product-price-main-model';
import {ProductModel} from '../models/product-model';
import {currencyFormat, getStringCorrected} from '../core/correct-library';
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
      } else if (record.product.data.stockType === 'normal' && record.data.productPrice <= 0) {
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
    returnData.priceListPrimaryKey = '-1';
    returnData.productPrimaryKey = '-1';
    returnData.productPrice = 0;
    returnData.insertDate = Date.now();

    return returnData;
  }

  clearMainModel(): ProductPriceMainModel {
    const returnData = new ProductPriceMainModel();
    returnData.product = this.pService.clearMainModel();
    returnData.data = this.clearSubModel();
    returnData.actionType = 'added';
    returnData.priceFormatted = currencyFormat(returnData.data.productPrice);
    return returnData;
  }

  checkFields(model: ProductPriceModel): ProductPriceModel {
    const cleanModel = this.clearSubModel();

    return model;
  }

  convertMainModel(model: ProductPriceModel): ProductPriceMainModel {
    const returnData = this.clearMainModel();
    returnData.data = this.checkFields(model);
    returnData.priceFormatted = currencyFormat(returnData.data.productPrice);
    return returnData;
  }

  getItem(primaryKey: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.collection(this.tableName).doc(primaryKey).get().toPromise().then(doc => {
        if (doc.exists) {
          const data = doc.data() as ProductPriceModel;
          data.primaryKey = doc.id;

          const returnData = new ProductPriceMainModel();
          returnData.data = this.checkFields(data);
          returnData.priceFormatted = currencyFormat(returnData.data.productPrice);

          return this.db.collection('tblProduct').doc(data.productPrimaryKey).valueChanges()
            .pipe(map((product: ProductModel) => {
              returnData.product = this.pService.convertMainModel(product);
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
        returnData.priceFormatted = currencyFormat(returnData.data.productPrice);

        return this.db.collection('tblProduct').doc(getStringCorrected(data.productPrimaryKey, '-1')).valueChanges()
          .pipe(map((product: ProductModel) => {
            returnData.product = this.pService.convertMainModel(product);
            return Object.assign({returnData});
          }));
      });
    }), mergeMap(feeds => combineLatest(feeds)));
    return this.mainList$;
  }

  getProductsOnList(priceListPrimaryKey: string): Observable<ProductPriceMainModel[]> {
    this.listCollection = this.db.collection(this.tableName,
      ref => ref.where('userPrimaryKey', '==', this.authService.getUid())
        .where('priceListPrimaryKey', '==', priceListPrimaryKey));
    this.mainList$ = this.listCollection.stateChanges().pipe(map(changes => {
      return changes.map(change => {
        const data = change.payload.doc.data() as ProductPriceModel;
        data.primaryKey = change.payload.doc.id;

        const returnData = new ProductPriceMainModel();
        returnData.data = this.checkFields(data);
        returnData.actionType = change.type;
        returnData.priceFormatted = currencyFormat(returnData.data.productPrice);

        return this.db.collection('tblProduct').doc(data.productPrimaryKey).valueChanges()
          .pipe(map((product: ProductModel) => {
            returnData.product = this.pService.convertMainModel(product);
            return Object.assign({returnData});
          }));
      });
    }), mergeMap(feeds => combineLatest(feeds)));
    return this.mainList$;
  }

  getProductsForListDetail = async (priceListPrimaryKey: string):
    Promise<Array<ProductPriceMainModel>> => new Promise(async (resolve, reject): Promise<void> => {
    try {
      const list = Array<ProductPriceMainModel>();
      this.db.collection(this.tableName, ref => {
        let query: CollectionReference | Query = ref;
        query = query.where('userPrimaryKey', '==', this.authService.getUid())
          .where('priceListPrimaryKey', '==', priceListPrimaryKey);
        return query;
      }).get().toPromise().then(snapshot => {
        snapshot.forEach(async doc => {
          const data = doc.data() as ProductPriceModel;
          data.primaryKey = doc.id;

          const returnData = this.convertMainModel(data);
          const p = await this.pService.getItem(data.productPrimaryKey);
          returnData.product = p.returnData;

          list.push(returnData);
        });
        resolve(list);
      });

    } catch (error) {
      console.error(error);
      reject({message: 'Error: ' + error});
    }
  })

  getProductsForTransaction = async (priceListPrimaryKey: string):
    Promise<Array<ProductPriceModel>> => new Promise(async (resolve, reject): Promise<void> => {
    try {
      const list = Array<ProductPriceModel>();
      this.db.collection(this.tableName, ref => {
        let query: CollectionReference | Query = ref;
        query = query.where('userPrimaryKey', '==', this.authService.getUid())
          .where('priceListPrimaryKey', '==', priceListPrimaryKey);
        return query;
      }).get().toPromise().then(snapshot => {
        snapshot.forEach(async doc => {
          const data = doc.data() as ProductPriceModel;
          data.primaryKey = doc.id;

          list.push(data);
        });
        resolve(list);
      });

    } catch (error) {
      console.error(error);
      reject({message: 'Error: ' + error});
    }
  })

  getProductPrice = async (priceListPrimaryKey: string, productPrimaryKey: string):
    // tslint:disable-next-line:cyclomatic-complexity
    Promise<ProductPriceMainModel> => new Promise(async (resolve, reject): Promise<void> => {
    try {
      this.db.collection(this.tableName, ref => {
        let query: CollectionReference | Query = ref;
        query = query
          .where('userPrimaryKey', '==', this.authService.getUid())
          .where('priceListPrimaryKey', '==', priceListPrimaryKey)
          .where('productPrimaryKey', '==', productPrimaryKey);
        return query;
      }).get().toPromise().then(snapshot => {
        if (snapshot.size > 0) {
          snapshot.forEach(doc => {
            const data = doc.data() as ProductPriceModel;
            data.primaryKey = doc.id;
            resolve(this.convertMainModel(data));
          });
        } else {
          resolve(null);
        }
      });

    } catch (error) {
      console.error(error);
      reject({message: 'Error: ' + error});
    }
  })
}
