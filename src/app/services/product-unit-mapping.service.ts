import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection, CollectionReference, Query } from '@angular/fire/firestore';
import { Observable } from 'rxjs/Observable';
import { map, mergeMap } from 'rxjs/operators';
import { AuthenticationService } from './authentication.service';
import { LogService } from './log.service';
import { SettingService } from './setting.service';
import { ProfileService } from './profile.service';
import { CustomerService } from './customer.service';
import { AccountTransactionService } from './account-transaction.service';
import { ActionService } from './action.service';
import { ProductUnitModel } from '../models/product-unit-model';
import { ProductUnitMappingModel } from '../models/product-unit-mapping-model';
import { ProductUnitMappingMainModel } from '../models/product-unit-mapping-main-model';
import { combineLatest } from 'rxjs';
import { ProductModel } from '../models/product-model';
import { ProductService } from './product.service';
import { ProductUnitService } from './product-unit.service';

@Injectable({
  providedIn: 'root'
})
export class ProductUnitMappingService {
  listCollection: AngularFirestoreCollection<ProductUnitMappingModel>;
  mainList$: Observable<ProductUnitMappingMainModel[]>;
  tableName = 'tblProductUnitMapping';

  constructor(protected authService: AuthenticationService, protected sService: SettingService, protected cusService: CustomerService,
              protected logService: LogService, protected eService: ProfileService, protected db: AngularFirestore,
              protected atService: AccountTransactionService, protected actService: ActionService, protected proService: ProductService,
              protected puService: ProductUnitService) {
                this.listCollection = this.db.collection(this.tableName);

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
        reject('L??tfen birim de??eri giriniz.');
      } else {
        resolve(null);
      }
    });
  }

  checkForRemove(record: ProductUnitMappingMainModel): Promise<string> {
    return new Promise(async (resolve, reject) => {
      // reject('??r??n birim silinemez.');
      resolve(null);
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
    returnData.isActive = true;
    returnData.insertDate = Date.now();

    return returnData;
  }

  clearMainModel(): ProductUnitMappingMainModel {
    const returnData = new ProductUnitMappingMainModel();
    returnData.data = this.clearSubModel();
    returnData.product = this.proService.clearMainModel();
    returnData.unit = this.puService.clearSubModel();
    returnData.actionType = 'added';
    return returnData;
  }

  checkFields(model: ProductUnitMappingModel): ProductUnitMappingModel {
    const cleanModel = this.clearSubModel();
    if (model.isActive === undefined) {
      model.isActive = cleanModel.isActive;
    }

    return model;
  }

  convertMainModel(model: ProductUnitMappingModel): ProductUnitMappingMainModel {
    const returnData = this.clearMainModel();
    returnData.data = this.checkFields(model);
    returnData.isActiveTr = returnData.data.isActive === true ? 'Aktif' : 'Pasif';
    return returnData;
  }

  getItem(primaryKey: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.collection(this.tableName).doc(primaryKey).get().toPromise().then(doc => {
        if (doc.exists) {
          const data = doc.data() as ProductUnitMappingModel;
          data.primaryKey = doc.id;

          const returnData = new ProductUnitMappingMainModel();
          returnData.data = this.checkFields(data);
          return Object.assign({ returnData });
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
            return Object.assign({ returnData });
          }));
      });
    }), mergeMap(feeds => combineLatest(feeds)));
    return this.mainList$;
  }

  getProductMainItems = async (productPrimaryKey: string):
    Promise<Array<ProductUnitMappingMainModel>> => new Promise(async (resolve, reject): Promise<void> => {
      try {
        const list = Array<ProductUnitMappingMainModel>();
        this.db.collection(this.tableName, ref => {
          let query: CollectionReference | Query = ref;
          query = query.where('userPrimaryKey', '==', this.authService.getUid())
            .where('productPrimaryKey', '==', productPrimaryKey);
          return query;
        })
          .get().toPromise().then(snapshot => {
            snapshot.forEach(async doc => {
              const data = doc.data() as ProductUnitMappingModel;
              data.primaryKey = doc.id;
              const returnData = this.convertMainModel(data);

              const pu = await this.puService.getItem(data.unitPrimaryKey);
              returnData.unit = pu.returnData.data;





              list.push(returnData);
            });
            resolve(list);
          });

      } catch (error) {
        console.error(error);
        reject({ message: 'Error: ' + error });
      }
    })

  getUnitProducts(unitPrimaryKey: string): Observable<ProductUnitMappingMainModel[]> {
    this.listCollection = this.db.collection(this.tableName,
      ref => ref.where('userPrimaryKey', '==', this.authService.getUid())
        .where('unitPrimaryKey', '==', unitPrimaryKey)
    );
    this.mainList$ = this.listCollection.stateChanges().pipe(map(changes => {
      return changes.map(change => {
        const data = change.payload.doc.data() as ProductUnitMappingModel;
        data.primaryKey = change.payload.doc.id;

        const returnData = this.convertMainModel(data);
        returnData.actionType = change.type;

        return this.db.collection('tblProduct').doc(data.productPrimaryKey).valueChanges()
          .pipe(map((product: ProductModel) => {
            returnData.product = this.proService.convertMainModel(product);
            return Object.assign({ returnData });
          }));
      });
    }), mergeMap(feeds => combineLatest(feeds)));
    return this.mainList$;
  }

  getUnitProductsAsync = async (unitPrimaryKey: string):
    Promise<Array<ProductUnitMappingMainModel>> => new Promise(async (resolve, reject): Promise<void> => {
      try {
        const list = Array<ProductUnitMappingMainModel>();
        this.db.collection(this.tableName, ref => {
          let query: CollectionReference | Query = ref;
          query = query.where('userPrimaryKey', '==', this.authService.getUid())
            .where('unitPrimaryKey', '==', unitPrimaryKey);
          return query;
        })
          .get().toPromise().then(snapshot => {
            snapshot.forEach(doc => {
              const data = doc.data() as ProductUnitMappingModel;
              data.primaryKey = doc.id;

              const returnData = new ProductUnitMappingMainModel();
              returnData.data = this.checkFields(data);
              list.push(returnData);
            });
            resolve(list);
          });

      } catch (error) {
        console.error(error);
        reject({ message: 'Error: ' + error });
      }
    })

  getProductUnitMapping = async (productPrimaryKey: string, unitPrimaryKey):
    Promise<ProductUnitMappingModel> => new Promise(async (resolve, reject): Promise<void> => {
      try {
        this.db.collection(this.tableName, ref => {
          let query: CollectionReference | Query = ref;
          query = query.limit(1)
            .where('userPrimaryKey', '==', this.authService.getUid())
            .where('productPrimaryKey', '==', productPrimaryKey)
            .where('unitPrimaryKey', '==', unitPrimaryKey);
          return query;
        }).get().toPromise().then(snapshot => {
          if (snapshot.size > 0) {
            snapshot.forEach(doc => {
              const data = doc.data() as ProductUnitMappingModel;
              data.primaryKey = doc.id;
              resolve(data);
            });
          } else {
            resolve(null);
          }
        });
      } catch (error) {
        console.error(error);
        reject({ message: 'Error: ' + error });
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
        }).get().toPromise().then(snapshot => {
          if (snapshot.size > 0) {
            resolve(true);
          } else {
            resolve(false);
          }
        });
      } catch (error) {
        console.error(error);
        reject({ message: 'Error: ' + error });
      }
    })
}
