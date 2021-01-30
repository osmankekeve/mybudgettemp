import {Injectable} from '@angular/core';
import {AngularFirestore, AngularFirestoreCollection, CollectionReference, Query} from '@angular/fire/firestore';
import {Observable} from 'rxjs/Observable';
import {map, flatMap} from 'rxjs/operators';
import {combineLatest} from 'rxjs';
import {AuthenticationService} from './authentication.service';
import {LogService} from './log.service';
import {ActionService} from './action.service';
import {SalesOrderDetailModel} from '../models/sales-order-detail-model';
import {SalesOrderDetailMainModel, setOrderDetailCalculation} from '../models/sales-order-detail-main-model';
import {ProductService} from './product.service';
import {ProductMainModel} from '../models/product-main-model';
import {currencyFormat, getPaymentTypes, getTerms} from '../core/correct-library';
import {ProductUnitService} from './product-unit.service';
import {ProductUnitModel} from '../models/product-unit-model';
import {SalesInvoiceDetailMainModel} from '../models/sales-invoice-detail-main-model';
import {SalesInvoiceDetailService} from './sales-invoice-detail.service';

@Injectable({
  providedIn: 'root'
})
export class SalesOrderDetailService {
  listCollection: AngularFirestoreCollection<SalesOrderDetailModel>;
  mainList$: Observable<SalesOrderDetailMainModel[]>;
  tableName = 'tblSalesOrderDetail';

  constructor(protected authService: AuthenticationService, protected pService: ProductService,
              protected logService: LogService, protected db: AngularFirestore,
              protected actService: ActionService, protected puService: ProductUnitService, protected sid: SalesInvoiceDetailService) {
    this.listCollection = this.db.collection(this.tableName);
  }

  async addItem(record: SalesOrderDetailMainModel) {
    return await this.listCollection.add(Object.assign({}, record.data));
  }

  async removeItem(record: SalesOrderDetailMainModel) {
    return await this.db.collection(this.tableName).doc(record.data.primaryKey).delete();
  }

  async updateItem(record: SalesOrderDetailMainModel) {
    return await this.db.collection(this.tableName).doc(record.data.primaryKey).update(Object.assign({}, record.data));
  }

  async setItem(record: SalesOrderDetailMainModel, primaryKey: string) {
    return await this.listCollection.doc(primaryKey).set(Object.assign({}, record.data));
  }

  checkForSave(record: SalesOrderDetailMainModel): Promise<string> {
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

  checkForRemove(record: SalesOrderDetailMainModel): Promise<string> {
    return new Promise((resolve, reject) => {
      resolve(null);
    });
  }

  checkFields(model: SalesOrderDetailModel): SalesOrderDetailModel {
    const cleanModel = this.clearSubModel();
    if (model.invoicedQuantity == null) { model.invoicedQuantity = cleanModel.invoicedQuantity; }
    if (model.invoicedStatus == null) { model.invoicedStatus = cleanModel.invoicedStatus; }
    if (model.campaignPrimaryKey == null) { model.campaignPrimaryKey = cleanModel.campaignPrimaryKey; }
    return model;
  }

  clearSubModel(): SalesOrderDetailModel {

    const returnData = new SalesOrderDetailModel();
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

  clearMainModel(): SalesOrderDetailMainModel {
    const returnData = new SalesOrderDetailMainModel();
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
          const data = doc.data() as SalesOrderDetailModel;
          data.primaryKey = doc.id;

          const returnData = new SalesOrderDetailMainModel();
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
    Promise<Array<SalesOrderDetailMainModel>> => new Promise(async (resolve, reject): Promise<void> => {
    try {
      const list = Array<SalesOrderDetailMainModel>();
      this.db.collection(this.tableName, ref => {
        let query: CollectionReference | Query = ref;
        query = query
          .where('orderPrimaryKey', '==', orderPrimaryKey);
        return query;
      })
        .get().subscribe(snapshot => {
        snapshot.forEach(async doc => {
          const data = doc.data() as SalesOrderDetailModel;
          data.primaryKey = doc.id;

          const returnData = new SalesOrderDetailMainModel();
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

  getMainItemsWithOrderPrimaryKeyArray = async (orderPrimaryKey: Array<string>):
    Promise<Array<SalesInvoiceDetailMainModel>> => new Promise(async (resolve, reject): Promise<void> => {
    try {
      const list = Array<SalesInvoiceDetailMainModel>();
      this.db.collection(this.tableName, ref => {
        let query: CollectionReference | Query = ref;
        query = query
          .where('orderPrimaryKey', 'in', orderPrimaryKey);
        return query;
      })
        .get().subscribe(snapshot => {
        snapshot.forEach(async doc => {
          const data = doc.data() as SalesOrderDetailModel;
          data.primaryKey = doc.id;

          const returnData = new SalesOrderDetailMainModel();
          returnData.data = this.checkFields(data);

          const p = await this.pService.getItem(data.productPrimaryKey);
          returnData.product = p.returnData;

          const pu = await this.puService.getItem(data.unitPrimaryKey);
          returnData.unit = pu.returnData.data;

          list.push(this.sid.convertToSalesInvoiceDetail(returnData));
        });
        resolve(list);
      });

    } catch (error) {
      console.error(error);
      reject({message: 'Error: ' + error});
    }
  })
}
