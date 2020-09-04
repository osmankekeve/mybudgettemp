import {Injectable} from '@angular/core';
import {AngularFirestore, AngularFirestoreCollection, CollectionReference, Query} from '@angular/fire/firestore';
import {Observable} from 'rxjs/Observable';
import {map, flatMap} from 'rxjs/operators';
import {AuthenticationService} from './authentication.service';
import {LogService} from './log.service';
import {SettingService} from './setting.service';
import {ProfileService} from './profile.service';
import {currencyFormat, getProductTypes} from '../core/correct-library';
import {CustomerService} from './customer.service';
import {AccountTransactionService} from './account-transaction.service';
import {ActionService} from './action.service';
import {ProductModel} from '../models/product-model';
import {ProductMainModel} from '../models/product-main-model';
import {ProductUnitMappingService} from './product-unit-mapping.service';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  listCollection: AngularFirestoreCollection<ProductModel>;
  mainList$: Observable<ProductMainModel[]>;
  tableName = 'tblProduct';

  constructor(protected authService: AuthenticationService, protected sService: SettingService, protected cusService: CustomerService,
              protected logService: LogService, protected eService: ProfileService, protected db: AngularFirestore,
              protected atService: AccountTransactionService, protected actService: ActionService) {

  }

  async addItem(record: ProductMainModel) {
    return await this.listCollection.add(Object.assign({}, record.data))
      .then(async () => {
        await this.sService.increaseProductNumber();
        await this.logService.addTransactionLog(record, 'insert', 'product');
        this.actService.addAction(this.tableName, record.data.primaryKey, 1, 'Kayıt Oluşturma');
      });
  }

  async removeItem(record: ProductMainModel) {
    return await this.db.collection(this.tableName).doc(record.data.primaryKey).delete()
      .then(async () => {
        await this.removeProductUnitMappings(record.data.primaryKey)
        this.actService.removeActions(this.tableName, record.data.primaryKey);
        await this.logService.addTransactionLog(record, 'delete', 'product');
      });
  }

  async updateItem(record: ProductMainModel) {
    return await this.db.collection(this.tableName).doc(record.data.primaryKey)
      .update(Object.assign({}, record.data))
      .then(async value => {
        await this.logService.addTransactionLog(record, 'update', 'product');
        this.actService.addAction(this.tableName, record.data.primaryKey, 2, 'Kayıt Güncelleme');
      });
  }

  async setItem(record: ProductMainModel, primaryKey: string) {
    return await this.listCollection.doc(primaryKey).set(Object.assign({}, record.data))
      .then(async value => {
        await this.sService.increaseProductNumber();
        await this.logService.addTransactionLog(record, 'insert', 'product');
        this.actService.addAction(this.tableName, record.data.primaryKey, 1, 'Kayıt Oluşturma');
      });
  }

  removeProductUnitMappings = async (productPrimaryKey: string):
    Promise<void> => new Promise(async (resolve, reject): Promise<void> => {
    try {
      this.db.collection('tblProductUnitMapping', ref => {
        let query: CollectionReference | Query = ref;
        query = query.where('userPrimaryKey', '==', this.authService.getUid())
          .where('productPrimaryKey', '==', productPrimaryKey);
        return query;
      })
        .get().subscribe(snapshot => {
        snapshot.forEach(doc => {
          doc.ref.delete();
        });
      });
      resolve();

    } catch (error) {
      console.error(error);
      reject({code: 401, message: 'You do not have permission or there is a problem about permissions!'});
    }
  })

  checkForSave(record: ProductMainModel): Promise<string> {
    return new Promise((resolve, reject) => {
      if (record.data.productCode === '') {
        reject('Lütfen ürün kodu giriniz.');
      } else if (record.data.productBaseCode === '') {
        reject('Lütfen ürün ana kod giriniz.');
      } else if (record.data.productName === '') {
        reject('Lütfen ürün adı giriniz.');
      } else if (record.data.stockType === '' || record.data.stockType === '-1') {
        reject('Lütfen ürün tipi seçiniz.');
      } else if (record.data.defaultUnitCode === '' || record.data.defaultUnitCode === '-1') {
        reject('Lütfen ürün varsayılan birim seçiniz.');
      } else if (record.data.taxRate < 0) {
        reject('Lütfen vergi oranı giriniz.');
      } else {
        resolve(null);
      }
    });
  }

  checkForRemove(record: ProductMainModel): Promise<string> {
    return new Promise(async (resolve, reject) => {
      await this.isUsedOnPriceList(record.data.primaryKey).then(result => {
        if (result) {
          reject('Ürün fiyat listesine bağlı olduğundan silinemez.');
        }
      });
      await this.isUsedOnDiscountList(record.data.primaryKey).then(result => {
        if (result) {
          reject('Ürün iskonto listesine bağlı olduğundan silinemez.');
        }
      });
      await this.isUsedOnSalesOrderDetail(record.data.primaryKey).then(result => {
        if (result) {
          reject('Ürün satış teklifinde kullanıldığından silinemez.');
        }
      });
      resolve(null);
    });
  }

  clearSubModel(): ProductModel {

    const returnData = new ProductModel();
    returnData.primaryKey = null;
    returnData.userPrimaryKey = this.authService.getUid();
    returnData.employeePrimaryKey = this.authService.getEid();
    returnData.productCode = '';
    returnData.productBaseCode = '';
    returnData.productName = '';
    returnData.stockType = 'normal';
    returnData.defaultUnitCode = '-1';
    returnData.taxRate = 0;
    returnData.sctAmount = 0;
    returnData.weight = 0;
    returnData.height = 0;
    returnData.description = '';
    returnData.barcode1 = '';
    returnData.barcode2 = '';
    returnData.imgUrl = '';
    returnData.isWebProduct = false;
    returnData.isActive = true;
    returnData.insertDate = Date.now();

    return returnData;
  }

  clearMainModel(): ProductMainModel {
    const returnData = new ProductMainModel();
    returnData.data = this.clearSubModel();
    returnData.actionType = 'added';
    returnData.isActiveTr = returnData.data.isActive === true ? 'Aktif' : 'Pasif';
    returnData.isWebProductTr = returnData.data.isWebProduct === true ? 'Evet' : 'Hayır';
    returnData.sctAmountFormatted = currencyFormat(returnData.data.sctAmount);
    returnData.stockTypeTr = getProductTypes().get(returnData.data.stockType);
    return returnData;
  }

  checkFields(model: ProductModel): ProductModel {
    const cleanModel = this.clearSubModel();

    return model;
  }

  convertMainModel(model: ProductModel): ProductMainModel {
    const returnData = this.clearMainModel();
    returnData.data = this.checkFields(model);
    returnData.isActiveTr = returnData.data.isActive === true ? 'Aktif' : 'Pasif';
    returnData.isWebProductTr = returnData.data.isWebProduct === true ? 'Evet' : 'Hayır';
    returnData.sctAmountFormatted = currencyFormat(returnData.data.sctAmount);
    returnData.stockTypeTr = getProductTypes().get(returnData.data.stockType);
    return returnData;
  }

  getItem(primaryKey: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.collection(this.tableName).doc(primaryKey).get().toPromise().then(doc => {
        if (doc.exists) {
          const data = doc.data() as ProductModel;
          data.primaryKey = doc.id;

          const returnData = new ProductMainModel();
          returnData.data = this.checkFields(data);
          returnData.isActiveTr = returnData.data.isActive === true ? 'Aktif' : 'Pasif';
          returnData.isWebProductTr = returnData.data.isWebProduct === true ? 'Evet' : 'Hayır';
          returnData.sctAmountFormatted = currencyFormat(returnData.data.sctAmount);
          returnData.stockTypeTr = getProductTypes().get(returnData.data.stockType);
          resolve(Object.assign({returnData}));
        } else {
          resolve(null);
        }
      });
    });
  }

  getMainItems(): Observable<ProductMainModel[]> {
    // left join siz
    this.listCollection = this.db.collection(this.tableName,
      ref => {
        let query: CollectionReference | Query = ref;
        query = query.orderBy('productName', 'asc')
          .where('userPrimaryKey', '==', this.authService.getUid());
        return query;
      });
    this.mainList$ = this.listCollection.stateChanges().pipe(
      map(changes =>
        changes.map(c => {
          const data = c.payload.doc.data() as ProductModel;
          data.primaryKey = c.payload.doc.id;

          const returnData = this.convertMainModel(data);
          returnData.actionType = c.type;
          return Object.assign({returnData});
        })
      )
    );
    return this.mainList$;
  }

  getProductsForSelection = async (stockTypes: Array<string>):
    Promise<Array<ProductMainModel>> => new Promise(async (resolve, reject): Promise<void> => {
    try {
      const list = Array<ProductMainModel>();
      await this.db.collection(this.tableName, ref => {
        let query: CollectionReference | Query = ref;
        query = query.orderBy('productName', 'asc')
          .where('userPrimaryKey', '==', this.authService.getUid());
        if (stockTypes !== null) {
          query = query.where('stockType', 'in', stockTypes);
        }
        return query;
      }).get()
        .subscribe(snapshot => {
          snapshot.forEach(doc => {
            const data = doc.data() as ProductModel;
            data.primaryKey = doc.id;
            list.push(this.convertMainModel(data));
          });
          resolve(list);
        });
    } catch (error) {
      console.error(error);
      reject({code: 401, message: 'You do not have permission or there is a problem about permissions!'});
    }
  })

  isUsedOnPriceList = async (primaryKey: string):
    Promise<boolean> => new Promise(async (resolve, reject): Promise<void> => {
    try {
      this.db.collection('tblProductPrice', ref => {
        let query: CollectionReference | Query = ref;
        query = query.limit(1)
          .where('userPrimaryKey', '==', this.authService.getUid())
          .where('defaultUnitCode', '==', primaryKey);
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

  isUsedOnDiscountList = async (primaryKey: string):
    Promise<boolean> => new Promise(async (resolve, reject): Promise<void> => {
    try {
      this.db.collection('tblProductDiscount', ref => {
        let query: CollectionReference | Query = ref;
        query = query.limit(1)
          .where('userPrimaryKey', '==', this.authService.getUid())
          .where('defaultUnitCode', '==', primaryKey);
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

  isUsedOnSalesOrderDetail = async (primaryKey: string):
    Promise<boolean> => new Promise(async (resolve, reject): Promise<void> => {
    try {
      this.db.collection('tblSalesOrderDetail', ref => {
        let query: CollectionReference | Query = ref;
        query = query.limit(1)
          .where('userPrimaryKey', '==', this.authService.getUid())
          .where('productPrimaryKey', '==', primaryKey);
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
