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
import {ProductUnitMappingModel} from '../models/product-unit-mapping-model';
import {ProductUnitMappingMainModel} from '../models/product-unit-mapping-main-model';
import {CollectionMainModel} from '../models/collection-main-model';
import {CollectionModel} from '../models/collection-model';
import {currencyFormat, getStatus} from '../core/correct-library';
import {combineLatest} from 'rxjs';
import {ProductModel} from '../models/product-model';
import {ProductService} from './product.service';

@Injectable({
  providedIn: 'root'
})
export class ProductUnitMappingService {
  listCollection: AngularFirestoreCollection<ProductUnitMappingModel>;
  mainList$: Observable<ProductUnitMappingMainModel[]>;
  tableName = 'tblProductUnitMapping';

  constructor(protected authService: AuthenticationService, protected sService: SettingService, protected cusService: CustomerService,
              protected logService: LogService, protected eService: ProfileService, protected db: AngularFirestore,
              protected atService: AccountTransactionService, protected actService: ActionService, protected proService: ProductService) {

  }

  async addItem(record: ProductUnitMappingMainModel) {
    return await this.listCollection.add(Object.assign({}, record.data))
      .then(async () => {
        await this.logService.addTransactionLog(record, 'insert', 'product-unit-mapping');
      });
  }

  async removeItem(record: ProductUnitMappingMainModel) {
    return await this.db.collection(this.tableName).doc(record.data.primaryKey).delete()
      .then(async () => {
        await this.logService.addTransactionLog(record, 'delete', 'product-unit-mapping');
      });
  }

  async updateItem(record: ProductUnitMappingMainModel) {
    return await this.db.collection(this.tableName).doc(record.data.primaryKey)
      .update(Object.assign({}, record.data))
      .then(async value => {
        await this.logService.addTransactionLog(record, 'update', 'product-unit-mapping');
      });
  }

  async setItem(record: ProductUnitMappingMainModel, primaryKey: string) {
    return await this.listCollection.doc(primaryKey).set(Object.assign({}, record.data))
      .then(async value => {
        await this.logService.addTransactionLog(record, 'insert', 'product-unit-mapping');
      });
  }

  checkForSave(record: ProductUnitMappingMainModel): Promise<string> {
    return new Promise((resolve, reject) => {
      if (record.data.unitValue <= 0) {
        reject('Lütfen birim değeri giriniz.');
      } else {
        resolve(null);
      }
    });
  }

  checkForRemove(record: ProductUnitMappingMainModel): Promise<string> {
    return new Promise(async (resolve, reject) => {
      reject('Ürün birim silinemez.');
      // resolve(null);
    });
  }

  clearSubModel(): ProductUnitMappingModel {

    const returnData = new ProductUnitMappingModel();
    returnData.primaryKey = null;
    returnData.userPrimaryKey = this.authService.getUid();
    returnData.employeePrimaryKey = this.authService.getEid();
    returnData.productPrimaryKey = '-1';
    returnData.unitPrimaryKey = '-1';
    returnData.unitValue = 1;
    returnData.insertDate = Date.now();

    return returnData;
  }

  clearMainModel(): ProductUnitMappingMainModel {
    const returnData = new ProductUnitMappingMainModel();
    returnData.data = this.clearSubModel();
    returnData.product = this.proService.clearMainModel();
    returnData.actionType = 'added';
    return returnData;
  }

  checkFields(model: ProductUnitMappingModel): ProductUnitMappingModel {
    const cleanModel = this.clearSubModel();

    return model;
  }

  getItem(primaryKey: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.collection(this.tableName).doc(primaryKey).get().toPromise().then(doc => {
        if (doc.exists) {
          const data = doc.data() as ProductUnitMappingModel;
          data.primaryKey = doc.id;

          const returnData = new ProductUnitMappingMainModel();
          returnData.data = this.checkFields(data);
          return Object.assign({returnData});
        } else {
          resolve(null);
        }
      });
    });
  }

  getMainItems(): Observable<ProductUnitMappingMainModel[]> {
    this.listCollection = this.db.collection(this.tableName,
      ref => ref.where('userPrimaryKey', '==', this.authService.getUid()));
    this.mainList$ = this.listCollection.stateChanges().pipe(map(changes => {
      return changes.map(change => {
        const data = change.payload.doc.data() as ProductUnitMappingModel;
        data.primaryKey = change.payload.doc.id;

        const returnData = new ProductUnitMappingMainModel();
        returnData.data = this.checkFields(data);
        returnData.actionType = change.type;

        return this.db.collection('tblProductUnit').doc(data.unitPrimaryKey).valueChanges()
          .pipe(map((unit: ProductUnitModel) => {
            returnData.unit = unit;
            return Object.assign({returnData});
          }));
      });
    }), flatMap(feeds => combineLatest(feeds)));
    return this.mainList$;
  }

  getProductMainItems(productPrimaryKey: string): Observable<ProductUnitMappingMainModel[]> {
    this.listCollection = this.db.collection(this.tableName,
      ref => ref.where('userPrimaryKey', '==', this.authService.getUid())
        .where('productPrimaryKey', '==', productPrimaryKey)
    );
    this.mainList$ = this.listCollection.stateChanges().pipe(map(changes => {
      return changes.map(change => {
        const data = change.payload.doc.data() as ProductUnitMappingModel;
        data.primaryKey = change.payload.doc.id;

        const returnData = new ProductUnitMappingMainModel();
        returnData.data = this.checkFields(data);
        returnData.actionType = change.type;

        return this.db.collection('tblProductUnit').doc(data.unitPrimaryKey).valueChanges()
          .pipe(map((unit: ProductUnitModel) => {
            returnData.unit = unit;
            return Object.assign({returnData});
          }));
      });
    }), flatMap(feeds => combineLatest(feeds)));
    return this.mainList$;
  }

  getUnitProducts(unitPrimaryKey: string): Observable<ProductUnitMappingMainModel[]> {
    this.listCollection = this.db.collection(this.tableName,
      ref => ref.where('userPrimaryKey', '==', this.authService.getUid())
        .where('unitPrimaryKey', '==', unitPrimaryKey)
    );
    this.mainList$ = this.listCollection.stateChanges().pipe(map(changes => {
      return changes.map(change => {
        const data = change.payload.doc.data() as ProductUnitMappingModel;
        data.primaryKey = change.payload.doc.id;

        const returnData = new ProductUnitMappingMainModel();
        returnData.data = this.checkFields(data);
        returnData.actionType = change.type;

        return this.db.collection('tblProduct').doc(data.productPrimaryKey).valueChanges()
          .pipe(map((product: ProductModel) => {
            returnData.product = this.proService.convertMainModel(product);
            return Object.assign({returnData});
          }));
      });
    }), flatMap(feeds => combineLatest(feeds)));
    return this.mainList$;
  }

  getProductMappingItemsAsync = async (productPrimaryKey: string):
    Promise<Array<ProductUnitMappingMainModel>> => new Promise(async (resolve, reject): Promise<void> => {
    try {
      const list = Array<ProductUnitMappingMainModel>();
      this.db.collection(this.tableName, ref => {
        let query: CollectionReference | Query = ref;
        query = query.where('userPrimaryKey', '==', this.authService.getUid())
          .where('productPrimaryKey', '==', productPrimaryKey);
        return query;
      })
        .get().subscribe(snapshot => {
        snapshot.forEach(doc => {
          const data = doc.data() as ProductUnitMappingModel;
          data.primaryKey = doc.id;

          const returnData = new ProductUnitMappingMainModel();
          returnData.data = this.checkFields(data);

          return this.db.collection('tblProductUnit').doc(data.unitPrimaryKey).valueChanges()
            .pipe(map((unit: ProductUnitModel) => {
              returnData.unit = unit;
              list.push(returnData);
            }));
        });
        resolve(list);
      });

    } catch (error) {
      console.error(error);
      reject({code: 401, message: 'You do not have permission or there is a problem about permissions!'});
    }
  })

  isProductHasUnitMapping = async (productPrimaryKey: string, unitPrimaryKey):
    Promise<boolean> => new Promise(async (resolve, reject): Promise<void> => {
    try {
      this.db.collection(this.tableName, ref => {
        let query: CollectionReference | Query = ref;
        query = query.limit(1)
          .where('userPrimaryKey', '==', this.authService.getUid())
          .where('productPrimaryKey', '==', productPrimaryKey)
          .where('unitPrimaryKey', '==', unitPrimaryKey);
        return query;
      }).get().subscribe(snapshot => {
        if (snapshot.size > 0) {
          resolve(true);
        } else {
          resolve(false);
        }
      });
    } catch (error) {
      console.error(error);
      reject({code: 401, message: 'You do not have permission or there is a problem about permissions!'});
    }
  })
}
