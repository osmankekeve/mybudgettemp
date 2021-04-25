import {Injectable} from '@angular/core';
import {AngularFirestore, AngularFirestoreCollection, CollectionReference, Query} from '@angular/fire/firestore';
import {Observable} from 'rxjs/Observable';
import {map, mergeMap} from 'rxjs/operators';
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
import {FileUploadService} from './file-upload.service';
import { PurchaseInvoiceDetailModel } from '../models/purchase-invoice-detail-model';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  listCollection: AngularFirestoreCollection<ProductModel>;
  mainList$: Observable<ProductMainModel[]>;
  tableName = 'tblProduct';

  constructor(protected authService: AuthenticationService, protected sService: SettingService, protected cusService: CustomerService,
              protected logService: LogService, protected eService: ProfileService, protected db: AngularFirestore,
              protected atService: AccountTransactionService, protected actService: ActionService, protected fuService: FileUploadService) {

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
        await this.removeProductUnitMappings(record.data.primaryKey);
        this.actService.removeActions(this.tableName, record.data.primaryKey);
        await this.logService.addTransactionLog(record, 'delete', 'product');
      });
  }

  async updateItem(record: ProductMainModel) {
    return await this.db.collection(this.tableName).doc(record.data.primaryKey)
      .update(Object.assign({}, record.data))
      .then(async () => {
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
          reject('Ürün, fiyat listesine bağlı olduğundan silinemez.');
        }
      });
      await this.isUsedOnDiscountList(record.data.primaryKey).then(result => {
        if (result) {
          reject('Ürün, iskonto listesine bağlı olduğundan silinemez.');
        }
      });
      await this.isUsedOnSalesOrderDetail(record.data.primaryKey).then(result => {
        if (result) {
          reject('Ürün, satış teklifinde kullanıldığından silinemez.');
        }
      });
      await this.isUsedOnPurchaseOrderDetail(record.data.primaryKey).then(result => {
        if (result) {
          reject('Ürün, alim teklifinde kullanıldığından silinemez.');
        }
      });
      await this.isUsedOnPacketCampaignDetail(record.data.primaryKey).then(result => {
        if (result) {
          reject('Ürün, Paket kampanyada kullanıldığından silinemez.');
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
    returnData.productType = 'buy-sale';
    returnData.defaultUnitCode = '-1';
    returnData.taxRate = 0;
    returnData.sctAmount = 0;
    returnData.weight = 0;
    returnData.height = 0;
    returnData.description = '';
    returnData.barcode1 = '';
    returnData.barcode2 = '';
    returnData.imgUrl = '../../assets/images/default-product-image.png';
    returnData.isWebProduct = false;
    returnData.isActive = true;
    returnData.insertDate = Date.now();

    return returnData;
  }

  clearMainModel(): ProductMainModel {
    const returnData = new ProductMainModel();
    returnData.data = this.clearSubModel();
    returnData.stock = null;
    returnData.actionType = 'added';
    returnData.isActiveTr = returnData.data.isActive === true ? 'Aktif' : 'Pasif';
    returnData.isWebProductTr = returnData.data.isWebProduct === true ? 'Evet' : 'Hayır';
    returnData.sctAmountFormatted = currencyFormat(returnData.data.sctAmount);
    returnData.stockTypeTr = getProductTypes().get(returnData.data.stockType);
    return returnData;
  }

  checkFields(model: ProductModel): ProductModel {
    const cleanModel = this.clearSubModel();
    if (model.imgUrl === undefined || model.imgUrl === '') {
      model.imgUrl = cleanModel.imgUrl;
    }
    if (model.productType === undefined) { model.productType = cleanModel.productType; }
    return model;
  }

  convertMainModel(model: ProductModel): ProductMainModel {
    const returnData = this.clearMainModel();
    returnData.data = this.checkFields(model);
    returnData.isActiveTr = returnData.data.isActive === true ? 'Aktif' : 'Pasif';
    returnData.isWebProductTr = returnData.data.isWebProduct === true ? 'Evet' : 'Hayır';
    returnData.sctAmountFormatted = currencyFormat(returnData.data.sctAmount);
    returnData.stockTypeTr = getProductTypes().get(returnData.data.stockType);
    returnData.productTypeTr = getProductTypes().get(returnData.data.productType);
    return returnData;
  }

  getItem(primaryKey: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.collection(this.tableName).doc(primaryKey).get().toPromise().then(async doc => {
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

  getMainItems(isActive: boolean, stockType: string): Observable<ProductMainModel[]> {
    // left join siz
    this.listCollection = this.db.collection(this.tableName,
      ref => {
        let query: CollectionReference | Query = ref;
        query = query.orderBy('productName', 'asc').where('userPrimaryKey', '==', this.authService.getUid());
        if (isActive !== null) {
          query = query.where('isActive', '==', isActive);
        }
        if (stockType !== '-1') {
          query = query.where('stockType', '==', stockType);
        }
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

  getProductsForSelection = async (stockTypes: Array<string>, productTypes: Array<string>):
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
            if (productTypes !== null) {
              if (productTypes.indexOf(data.productType) > -1) {
                list.push(this.convertMainModel(data));
              } else {
                // nothing
              }
            } else {
              list.push(this.convertMainModel(data));
            }
          });
          resolve(list);
        });
    } catch (error) {
      reject({message: 'Error: ' + error});
    }
  })

  isUsedOnPriceList = async (primaryKey: string):
    Promise<boolean> => new Promise(async (resolve, reject): Promise<void> => {
    try {
      this.db.collection('tblProductPrice', ref => {
        let query: CollectionReference | Query = ref;
        query = query.limit(1).where('defaultUnitCode', '==', primaryKey);
        return query;
      }).get().toPromise().then(snapshot => {
        if (snapshot.size > 0) {
          resolve(true);
        } else {
          resolve(false);
        }
      });
    } catch (error) {
      reject({message: 'Error: ' + error});
    }
  })

  isUsedOnDiscountList = async (primaryKey: string):
    Promise<boolean> => new Promise(async (resolve, reject): Promise<void> => {
    try {
      this.db.collection('tblProductDiscount', ref => {
        let query: CollectionReference | Query = ref;
        query = query.limit(1).where('defaultUnitCode', '==', primaryKey);
        return query;
      }).get().toPromise().then(snapshot => {
        if (snapshot.size > 0) {
          resolve(true);
        } else {
          resolve(false);
        }
      });
    } catch (error) {
      reject({message: 'Error: ' + error});
    }
  })

  isUsedOnSalesOrderDetail = async (primaryKey: string):
    Promise<boolean> => new Promise(async (resolve, reject): Promise<void> => {
    try {
      this.db.collection('tblSalesOrderDetail', ref => {
        let query: CollectionReference | Query = ref;
        query = query.limit(1).where('productPrimaryKey', '==', primaryKey);
        return query;
      }).get().toPromise().then(snapshot => {
        if (snapshot.size > 0) {
          resolve(true);
        } else {
          resolve(false);
        }
      });
    } catch (error) {
      reject({message: 'Error: ' + error});
    }
  })

  isUsedOnPurchaseOrderDetail = async (primaryKey: string):
    Promise<boolean> => new Promise(async (resolve, reject): Promise<void> => {
    try {
      this.db.collection('tblPurchaseOrderDetail', ref => {
        let query: CollectionReference | Query = ref;
        query = query.limit(1).where('productPrimaryKey', '==', primaryKey);
        return query;
      }).get().toPromise().then(snapshot => {
        if (snapshot.size > 0) {
          resolve(true);
        } else {
          resolve(false);
        }
      });
    } catch (error) {
      reject({message: 'Error: ' + error});
    }
  })

  isUsedOnPacketCampaignDetail = async (primaryKey: string):
    Promise<boolean> => new Promise(async (resolve, reject): Promise<void> => {
    try {
      this.db.collection('tblCampaignDetail', ref => {
        let query: CollectionReference | Query = ref;
        query = query.limit(1)
          .where('productPrimaryKey', '==', primaryKey);
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
      reject({message: 'Error: ' + error});
    }
  })

  removeProductUnitMappings = async (productPrimaryKey: string):
    Promise<void> => new Promise(async (resolve, reject): Promise<void> => {
    try {
      this.db.collection('tblProductUnitMapping', ref => {
        let query: CollectionReference | Query = ref;
        query = query.where('productPrimaryKey', '==', productPrimaryKey);
        return query;
      })
        .get().toPromise().then(snapshot => {
        snapshot.forEach(doc => {
          doc.ref.delete();
        });
      });
      resolve();

    } catch (error) {
      reject({message: 'Error: ' + error});
    }
  })

  getProductPurchasePrices = async (productPrimaryKey: string):
    Promise<Array<PurchaseInvoiceDetailModel>> => new Promise(async (resolve, reject): Promise<void> => {
    try {
      const list = Array<any>();
      this.db.collection('tblPurchaseInvoiceDetail', ref => {
        let query: CollectionReference | Query = ref;
        query = query.orderBy('insertDate', 'desc')
        .where('productPrimaryKey', '==', productPrimaryKey);
        return query;
      })
        .get().toPromise().then(snapshot => {
        snapshot.forEach(doc => {
          const data = doc.data() as PurchaseInvoiceDetailModel;

          list.push(data);
        });
        resolve(list);
      });

    } catch (error) {
      reject({message: 'Error: ' + error});
    }
  })

}
