import {Injectable} from '@angular/core';
import {AngularFirestore, AngularFirestoreCollection, CollectionReference, Query} from '@angular/fire/firestore';
import {Observable} from 'rxjs/Observable';
import {AuthenticationService} from './authentication.service';
import {LogService} from './log.service';
import {ActionService} from './action.service';
import {ProductService} from './product.service';
import {ProductMainModel} from '../models/product-main-model';
import {currencyFormat} from '../core/correct-library';
import {ProductUnitService} from './product-unit.service';
import {ProductUnitModel} from '../models/product-unit-model';
import {PurchaseOrderDetailModel} from '../models/purchase-order-detail-model';
import {PurchaseOrderDetailMainModel, setOrderDetailCalculation} from '../models/purchase-order-detail-main-model';
import {SalesOrderDetailModel} from '../models/sales-order-detail-model';

@Injectable({
  providedIn: 'root'
})
export class PurchaseOrderDetailService {
  listCollection: AngularFirestoreCollection<PurchaseOrderDetailModel>;
  mainList$: Observable<PurchaseOrderDetailMainModel[]>;
  tableName = 'tblPurchaseOrderDetail';

  constructor(protected authService: AuthenticationService, protected pService: ProductService,
              protected logService: LogService, protected db: AngularFirestore,
              protected actService: ActionService, protected puService: ProductUnitService) {
    this.listCollection = this.db.collection(this.tableName);
  }

  async addItem(record: PurchaseOrderDetailMainModel) {
    return await this.listCollection.add(Object.assign({}, record.data));
  }

  async removeItem(record: PurchaseOrderDetailMainModel) {
    return await this.db.collection(this.tableName).doc(record.data.primaryKey).delete();
  }

  async updateItem(record: PurchaseOrderDetailMainModel) {
    return await this.db.collection(this.tableName).doc(record.data.primaryKey).update(Object.assign({}, record.data));
  }

  async setItem(record: PurchaseOrderDetailMainModel, primaryKey: string) {
    return await this.listCollection.doc(primaryKey).set(Object.assign({}, record.data));
  }

  checkForSave(record: PurchaseOrderDetailMainModel): Promise<string> {
    return new Promise((resolve, reject) => {
      if (record.data.productPrimaryKey === '-1') {
        reject('Lütfen ürün seçiniz.');
      } else if (record.data.unitPrimaryKey === '-1') {
        reject('Lütfen birim seçiniz.');
      } else if (record.data.price < 0) {
        reject('Fiyat sıfırdan büyük olmalıdır.');
      } else if (record.data.quantity <= 0) {
        reject('Miktar büyük olmalıdır.');
      } else {
        resolve(null);
      }
    });
  }

  checkForRemove(record: PurchaseOrderDetailMainModel): Promise<string> {
    return new Promise((resolve, reject) => {
      resolve(null);
    });
  }

  checkFields(model: PurchaseOrderDetailModel): PurchaseOrderDetailModel {
    const cleanModel = this.clearSubModel();
    return model;
  }

  clearSubModel(): PurchaseOrderDetailModel {

    const returnData = new PurchaseOrderDetailModel();
    returnData.primaryKey = null;
    returnData.orderPrimaryKey = '-1';
    returnData.productPrimaryKey = '-1';
    returnData.listPrice = 0;
    returnData.price = 0;
    returnData.defaultPrice = 0;
    returnData.discount1 = 0;
    returnData.defaultDiscount1 = 0;
    returnData.discount2 = 0;
    returnData.defaultDiscount2 = 0;
    returnData.quantity = 0;
    returnData.invoicedQuantity = 0;
    returnData.invoicedStatus = 'short'; // short, complete
    returnData.taxRate = 0;
    returnData.insertDate = 0;
    returnData.totalPrice = 0;
    returnData.totalPriceWithTax = 0;
    returnData.campaignPrimaryKey = '-1';
    returnData.unitPrimaryKey = '-1';
    returnData.unitValue = 0;

    return returnData;
  }

  clearMainModel(): PurchaseOrderDetailMainModel {
    const returnData = new PurchaseOrderDetailMainModel();
    returnData.data = this.clearSubModel();
    returnData.product = this.pService.clearMainModel();
    returnData.unit = this.puService.clearSubModel();
    returnData.actionType = 'added';
    returnData.priceFormatted = currencyFormat(returnData.data.price);
    returnData.totalPriceFormatted = currencyFormat(returnData.data.totalPrice);
    returnData.totalPriceWithTaxFormatted = currencyFormat(returnData.data.totalPriceWithTax);
    return returnData;
  }

  getItem(primaryKey: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.collection(this.tableName).doc(primaryKey).get().toPromise().then(doc => {
        if (doc.exists) {
          const data = doc.data() as PurchaseOrderDetailModel;
          data.primaryKey = doc.id;

          const returnData = new PurchaseOrderDetailMainModel();
          returnData.data = this.checkFields(data);

          Promise.all([
            this.pService.getItem(returnData.data.productPrimaryKey),
            this.puService.getItem(returnData.data.unitPrimaryKey)
          ])
            .then((values: any) => {
              if (values[0] !== null) {
                returnData.product = values[0].returnData as ProductMainModel;
              }
              if (values[1] !== null) {
                returnData.unit = values[1].returnData.data as ProductUnitModel;
              }
            });

          resolve(Object.assign({returnData}));
        } else {
          resolve(null);
        }
      });
    });
  }

  getMainItemsWithOrderPrimaryKey = async (orderPrimaryKey: string):
    Promise<Array<PurchaseOrderDetailMainModel>> => new Promise(async (resolve, reject): Promise<void> => {
    try {
      const list = Array<PurchaseOrderDetailMainModel>();
      this.db.collection(this.tableName, ref => {
        let query: CollectionReference | Query = ref;
        query = query
          .where('orderPrimaryKey', '==', orderPrimaryKey);
        return query;
      })
        .get().toPromise().then(snapshot => {
        snapshot.forEach(async doc => {
          const data = doc.data() as SalesOrderDetailModel;
          data.primaryKey = doc.id;

          const returnData = new PurchaseOrderDetailMainModel();
          returnData.data = this.checkFields(data);

          const p = await this.pService.getItem(data.productPrimaryKey);
          returnData.product = p.returnData;

          const pu = await this.puService.getItem(data.unitPrimaryKey);
          returnData.unit = pu.returnData.data;

          setOrderDetailCalculation(returnData);
          list.push(returnData);
        });
        resolve(list);
      });

    } catch (error) {
      console.error(error);
      reject({message: 'Error: ' + error});
    }
  })

  getItemsWithOrderPrimaryKey = async (orderPrimaryKey: string):
    Promise<Array<PurchaseOrderDetailModel>> => new Promise(async (resolve, reject): Promise<void> => {
    try {
      const list = Array<PurchaseOrderDetailModel>();
      this.db.collection(this.tableName, ref => {
        let query: CollectionReference | Query = ref;
        query = query
          .where('orderPrimaryKey', '==', orderPrimaryKey);
        return query;
      })
        .get().toPromise().then(snapshot => {
        snapshot.forEach(async doc => {
          const data = doc.data() as SalesOrderDetailModel;
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
