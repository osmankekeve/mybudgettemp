import {Injectable} from '@angular/core';
import {AngularFirestore, AngularFirestoreCollection, CollectionReference, Query} from '@angular/fire/firestore';
import {Observable} from 'rxjs/Observable';
import {map, mergeMap} from 'rxjs/operators';
import {AuthenticationService} from './authentication.service';
import {LogService} from './log.service';
import {ActionService} from './action.service';
import {ProductModel} from '../models/product-model';
import {currencyFormat, getStringCorrected} from '../core/correct-library';
import {combineLatest} from 'rxjs';
import {ProductService} from './product.service';
import { StockVoucherDetailModel } from '../models/product-module/stock-voucher-detail-model';
import { setVoucherDetailCalculation, StockVoucherDetailMainModel } from '../models/product-module/stock-voucher-detail-main-model';
import { ProductUnitMappingService } from './product-unit-mapping.service';
import { ProductUnitService } from './product-unit.service';

@Injectable({
  providedIn: 'root'
})
export class StockVoucherDetailService {
  listCollection: AngularFirestoreCollection<StockVoucherDetailModel>;
  mainList$: Observable<StockVoucherDetailMainModel[]>;
  tableName = 'tblStockVoucherDetail';

  constructor(protected authService: AuthenticationService, protected puService: ProductUnitService,
              protected logService: LogService, protected pService: ProductService, protected db: AngularFirestore,
              protected actService: ActionService, protected pumService: ProductUnitMappingService) {

  }

  async addItem(record: StockVoucherDetailMainModel) {
    return await this.listCollection.add(Object.assign({}, record.data));
  }

  async removeItem(record: StockVoucherDetailMainModel) {
    return await this.db.collection(this.tableName).doc(record.data.primaryKey).delete();
  }

  async updateItem(record: StockVoucherDetailMainModel) {
    return await this.db.collection(this.tableName).doc(record.data.primaryKey).update(Object.assign({}, record.data));
  }

  async setItem(record: StockVoucherDetailMainModel, primaryKey: string) {
    return await this.listCollection.doc(primaryKey).set(Object.assign({}, record.data));
  }

  checkForSave(record: StockVoucherDetailMainModel): Promise<string> {
    return new Promise((resolve, reject) => {
      if (record.data.productPrimaryKey === null || record.data.productPrimaryKey === '' || record.data.productPrimaryKey === '-1') {
        reject('Lütfen ürün seçiniz.');
      } else if (record.data.unitPrimaryKey === '' || record.data.unitPrimaryKey === '-1') {
        reject('Lütfen ürün birimi seçiniz.');
      } else if (record.data.amount <= 0) {
        reject('Lütfen fiyat giriniz.');
      } else if (record.data.quantity <= 0) {
        reject('Lütfen miktar giriniz.');
      } else {
        resolve(null);
      }
    });
  }

  checkForRemove(record: StockVoucherDetailMainModel): Promise<string> {
    return new Promise(async (resolve, reject) => {
      resolve(null);
    });
  }

  clearSubModel(): StockVoucherDetailModel {

    const returnData = new StockVoucherDetailModel();
    returnData.primaryKey = null;
    returnData.voucherPrimaryKey = '-1';
    returnData.productPrimaryKey = '-1';
    returnData.unitPrimaryKey = '-1';
    returnData.amount = 0;
    returnData.quantity = 0;
    returnData.insertDate = Date.now();

    return returnData;
  }

  clearMainModel(): StockVoucherDetailMainModel {
    const returnData = new StockVoucherDetailMainModel();
    returnData.product = this.pService.clearMainModel();
    returnData.data = this.clearSubModel();
    returnData.actionType = 'added';
    returnData.amountFormatted = currencyFormat(returnData.data.amount);
    returnData.totalAmount = returnData.data.amount * returnData.data.amount;
    returnData.totalAmountFormatted = currencyFormat(returnData.totalAmount);
    return returnData;
  }

  checkFields(model: StockVoucherDetailModel): StockVoucherDetailModel {
    const cleanModel = this.clearSubModel();

    return model;
  }

  convertMainModel(model: StockVoucherDetailModel): StockVoucherDetailMainModel {
    const returnData = this.clearMainModel();
    returnData.data = this.checkFields(model);
    setVoucherDetailCalculation(returnData);
    return returnData;
  }

  getItem(primaryKey: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.collection(this.tableName).doc(primaryKey).get().toPromise().then(async doc => {
        if (doc.exists) {
          const data = doc.data() as StockVoucherDetailModel;
          data.primaryKey = doc.id;

          const returnData = new StockVoucherDetailMainModel();
          returnData.data = this.checkFields(data);

          const p = await this.pService.getItem(data.productPrimaryKey);
          returnData.product = p.returnData;

          const pu = await this.puService.getItem(data.unitPrimaryKey);
          returnData.unit = pu.returnData.data;

          returnData.unitMapping = await this.pumService.getProductUnitMapping(returnData.data.productPrimaryKey, returnData.unit.primaryKey);
          setVoucherDetailCalculation(returnData);
          resolve(Object.assign({returnData}));
        } else {
          resolve(null);
        }
      });
    });
  }

  getProductsForListDetail = async (voucherPrimaryKey: string):
    Promise<Array<StockVoucherDetailMainModel>> => new Promise(async (resolve, reject): Promise<void> => {
    try {
      const list = Array<StockVoucherDetailMainModel>();
      this.db.collection(this.tableName, ref => {
        let query: CollectionReference | Query = ref;
        query = query.where('voucherPrimaryKey', '==', voucherPrimaryKey);
        return query;
      }).get().toPromise().then(snapshot => {
        snapshot.forEach(async doc => {
          const data = doc.data() as StockVoucherDetailModel;

          const returnData = new StockVoucherDetailMainModel();
          returnData.data = this.checkFields(data);

          const p = await this.pService.getItem(data.productPrimaryKey);
          returnData.product = p.returnData;

          const pu = await this.puService.getItem(data.unitPrimaryKey);
          returnData.unit = pu.returnData.data;

          returnData.unitMapping = await this.pumService.getProductUnitMapping(returnData.data.productPrimaryKey, returnData.unit.primaryKey);
          setVoucherDetailCalculation(returnData);

          list.push(returnData);
        });
        resolve(list);
      });

    } catch (error) {
      console.error(error);
      reject({message: 'Error: ' + error});
    }
  })

  getItemsWithOrderPrimaryKey = async (voucherPrimaryKey: string):
    Promise<Array<StockVoucherDetailModel>> => new Promise(async (resolve, reject): Promise<void> => {
    try {
      const list = Array<StockVoucherDetailModel>();
      this.db.collection(this.tableName, ref => {
        let query: CollectionReference | Query = ref;
        query = query
          .where('voucherPrimaryKey', '==', voucherPrimaryKey);
        return query;
      })
        .get().toPromise().then(snapshot => {
        snapshot.forEach(async doc => {
          const data = doc.data() as StockVoucherDetailModel;
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
