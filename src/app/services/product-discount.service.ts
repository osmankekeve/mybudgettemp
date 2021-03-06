import {Injectable} from '@angular/core';
import {AngularFirestore, AngularFirestoreCollection, CollectionReference, Query} from '@angular/fire/firestore';
import {Observable} from 'rxjs/Observable';
import {map, mergeMap} from 'rxjs/operators';
import {AuthenticationService} from './authentication.service';
import {LogService} from './log.service';
import {SettingService} from './setting.service';
import {ActionService} from './action.service';
import {ProductModel} from '../models/product-model';
import {combineLatest} from 'rxjs';
import {ProductService} from './product.service';
import {ProductDiscountMainModel} from '../models/product-discount-main-model';
import {ProductDiscountModel} from '../models/product-discount-model';
import {currencyFormat, getStringCorrected} from '../core/correct-library';

@Injectable({
  providedIn: 'root'
})
export class ProductDiscountService {
  listCollection: AngularFirestoreCollection<ProductDiscountModel>;
  mainList$: Observable<ProductDiscountMainModel[]>;
  tableName = 'tblProductDiscount';

  constructor(protected authService: AuthenticationService, protected sService: SettingService, protected actService: ActionService,
              protected logService: LogService, protected pService: ProductService, protected db: AngularFirestore) {

  }

  async addItem(record: ProductDiscountMainModel) {
    return await this.listCollection.add(Object.assign({}, record.data))
      .then(async () => {
        await this.logService.addTransactionLog(record, 'insert', 'product-discount');
      });
  }

  async removeItem(record: ProductDiscountMainModel) {
    return await this.db.collection(this.tableName).doc(record.data.primaryKey).delete()
      .then(async () => {
        await this.logService.addTransactionLog(record, 'delete', 'product-discount');
      });
  }

  async updateItem(record: ProductDiscountMainModel) {
    return await this.db.collection(this.tableName).doc(record.data.primaryKey)
      .update(Object.assign({}, record.data))
      .then(async value => {
        await this.logService.addTransactionLog(record, 'update', 'product-discount');
      });
  }

  async setItem(record: ProductDiscountMainModel, primaryKey: string) {
    return await this.listCollection.doc(primaryKey).set(Object.assign({}, record.data))
      .then(async value => {
        await this.logService.addTransactionLog(record, 'insert', 'product-discount');
      });
  }

  checkForSave(record: ProductDiscountMainModel): Promise<string> {
    return new Promise((resolve, reject) => {
      if (record.data.productPrimaryKey === '' || record.data.productPrimaryKey === '-1') {
        reject('L??tfen ??r??n se??iniz.');
      } else if (record.data.discount1 < 0) {
        reject('??skonto 1 s??f??rdan k??????k olamaz');
      } else if (record.data.discount2 < 0) {
        reject('??skonto 2 s??f??rdan k??????k olamaz');
      } else {
        resolve(null);
      }
    });
  }

  checkForRemove(record: ProductDiscountMainModel): Promise<string> {
    return new Promise(async (resolve, reject) => {
      resolve(null);
    });
  }

  clearSubModel(): ProductDiscountModel {

    const returnData = new ProductDiscountModel();
    returnData.primaryKey = null;
    returnData.userPrimaryKey = this.authService.getUid();
    returnData.discountListPrimaryKey = '-1';
    returnData.productPrimaryKey = '-1';
    returnData.discount1 = 0;
    returnData.discount2 = 0;
    returnData.insertDate = Date.now();

    return returnData;
  }

  clearMainModel(): ProductDiscountMainModel {
    const returnData = new ProductDiscountMainModel();
    returnData.product = this.pService.clearMainModel();
    returnData.data = this.clearSubModel();
    returnData.actionType = 'added';
    return returnData;
  }

  checkFields(model: ProductDiscountModel): ProductDiscountModel {
    const cleanModel = this.clearSubModel();

    return model;
  }

  convertMainModel(model: ProductDiscountModel): ProductDiscountMainModel {
    const returnData = this.clearMainModel();
    returnData.data = this.checkFields(model);
    return returnData;
  }

  getItem(primaryKey: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.collection(this.tableName).doc(primaryKey).get().toPromise().then(doc => {
        if (doc.exists) {
          const data = doc.data() as ProductDiscountModel;
          data.primaryKey = doc.id;

          const returnData = new ProductDiscountMainModel();
          returnData.data = this.checkFields(data);

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

  getMainItems(): Observable<ProductDiscountMainModel[]> {
    this.listCollection = this.db.collection(this.tableName,
      ref => ref.where('userPrimaryKey', '==', this.authService.getUid()));
    this.mainList$ = this.listCollection.stateChanges().pipe(map(changes => {
      return changes.map(change => {
        const data = change.payload.doc.data() as ProductDiscountModel;
        data.primaryKey = change.payload.doc.id;

        const returnData = new ProductDiscountMainModel();
        returnData.data = this.checkFields(data);
        returnData.actionType = change.type;

        return this.db.collection('tblProduct').doc(data.productPrimaryKey).valueChanges()
          .pipe(map((product: ProductModel) => {
            returnData.product = this.pService.convertMainModel(product);
            return Object.assign({returnData});
          }));
      });
    }), mergeMap(feeds => combineLatest(feeds)));
    return this.mainList$;
  }

  getProductsOnList(discountListPrimaryKey: string): Observable<ProductDiscountMainModel[]> {
    this.listCollection = this.db.collection(this.tableName,
      ref => ref.where('userPrimaryKey', '==', this.authService.getUid())
        .where('discountListPrimaryKey', '==', discountListPrimaryKey));
    this.mainList$ = this.listCollection.stateChanges().pipe(map(changes => {
      return changes.map(change => {
        const data = change.payload.doc.data() as ProductDiscountModel;
        data.primaryKey = change.payload.doc.id;

        const returnData = new ProductDiscountMainModel();
        returnData.data = this.checkFields(data);
        returnData.actionType = change.type;

        return this.db.collection('tblProduct').doc(getStringCorrected(data.productPrimaryKey, '-1')).valueChanges()
          .pipe(map((product: ProductModel) => {
            returnData.product = this.pService.convertMainModel(product);
            return Object.assign({returnData});
          }));
      });
    }), mergeMap(feeds => combineLatest(feeds)));
    return this.mainList$;
  }

  getProductsForListDetail = async (discountListPrimaryKey: string):
    Promise<Array<ProductDiscountMainModel>> => new Promise(async (resolve, reject): Promise<void> => {
    try {
      const list = Array<ProductDiscountMainModel>();
      this.db.collection(this.tableName, ref => {
        let query: CollectionReference | Query = ref;
        query = query.where('userPrimaryKey', '==', this.authService.getUid())
          .where('discountListPrimaryKey', '==', discountListPrimaryKey);
        return query;
      }).get().toPromise().then(snapshot => {
        snapshot.forEach(async doc => {
          const data = doc.data() as ProductDiscountModel;
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

  getProductDiscount = async (discountListPrimaryKey: string, productPrimaryKey: string):
    // tslint:disable-next-line:cyclomatic-complexity
    Promise<ProductDiscountModel> => new Promise(async (resolve, reject): Promise<void> => {
    try {
      this.db.collection(this.tableName, ref => {
        let query: CollectionReference | Query = ref;
        query = query
          .where('userPrimaryKey', '==', this.authService.getUid())
          .where('discountListPrimaryKey', '==', discountListPrimaryKey)
          .where('productPrimaryKey', '==', productPrimaryKey);
        return query;
      }).get().toPromise().then(snapshot => {
        if (snapshot.size > 0) {
          snapshot.forEach(doc => {
            const data = doc.data() as ProductDiscountModel;
            data.primaryKey = doc.id;
            resolve(data);
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

  getProductsForTransaction = async (discountListPrimaryKey: string):
    Promise<Array<ProductDiscountModel>> => new Promise(async (resolve, reject): Promise<void> => {
    try {
      const list = Array<ProductDiscountModel>();
      this.db.collection(this.tableName, ref => {
        let query: CollectionReference | Query = ref;
        query = query.where('userPrimaryKey', '==', this.authService.getUid())
          .where('discountListPrimaryKey', '==', discountListPrimaryKey);
        return query;
      }).get().toPromise().then(snapshot => {
        snapshot.forEach(async doc => {
          const data = doc.data() as ProductDiscountModel;
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
}
