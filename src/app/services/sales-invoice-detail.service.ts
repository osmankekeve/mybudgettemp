import {Injectable} from '@angular/core';
import {AngularFirestore, AngularFirestoreCollection, CollectionReference, Query} from '@angular/fire/firestore';
import {Observable} from 'rxjs/Observable';
import {map, flatMap} from 'rxjs/operators';
import {combineLatest} from 'rxjs';
import {AuthenticationService} from './authentication.service';
import {LogService} from './log.service';
import {ProfileService} from './profile.service';
import {ActionService} from './action.service';
import {SalesOrderDetailModel} from '../models/sales-order-detail-model';
import {SalesOrderDetailMainModel, setOrderDetailCalculation} from '../models/sales-order-detail-main-model';
import {ProductService} from './product.service';
import {ProductMainModel} from '../models/product-main-model';
import {currencyFormat, getStatus} from '../core/correct-library';
import {ProductUnitService} from './product-unit.service';

import {ProductUnitModel} from '../models/product-unit-model';
import {SalesInvoiceDetailMainModel, setInvoiceDetailCalculation} from '../models/sales-invoice-detail-main-model';
import {SalesInvoiceDetailModel} from '../models/sales-invoice-detail-model';
import {SalesInvoiceModel} from '../models/sales-invoice-model';
import {SalesInvoiceMainModel} from '../models/sales-invoice-main-model';
import {SalesOrderDetailService} from './sales-order-detail.service';

@Injectable({
  providedIn: 'root'
})
export class SalesInvoiceDetailService {
  listCollection: AngularFirestoreCollection<SalesInvoiceDetailModel>;
  mainList$: Observable<SalesInvoiceDetailMainModel[]>;
  tableName = 'tblSalesInvoiceDetail';

  constructor(protected authService: AuthenticationService, protected pService: ProductService,
              protected logService: LogService, protected eService: ProfileService, protected db: AngularFirestore,
              protected actService: ActionService, protected puService: ProductUnitService) {
    this.listCollection = this.db.collection(this.tableName);
  }

  async removeItem(record: SalesInvoiceDetailMainModel) {
    return await this.db.collection(this.tableName).doc(record.data.primaryKey).delete();
  }

  async setItem(record: SalesInvoiceDetailMainModel, primaryKey: string) {
    await this.removeItem(record);
    return await this.listCollection.doc(primaryKey).set(Object.assign({}, record.data)).then(async ()=> {
      this.db.collection('tblSalesOrderDetail').doc(record.data.orderDetailPrimaryKey).get().toPromise()
        .then(async doc => {
          if (record.invoiceStatus === 'approved') {
            const orderQuantity = doc.data().quantity;
            const orderInvoicedQuantity = doc.data().invoicedQuantity;
            const newInvoiceQuantity = record.data.quantity;
            let resultQuantity = 0;
            let resultStatus ='short';
            if (orderInvoicedQuantity + newInvoiceQuantity === orderQuantity) {
              resultQuantity = orderQuantity;
              resultStatus = 'complete';
            }
            else {
              resultQuantity = orderInvoicedQuantity + newInvoiceQuantity;
            }
            await doc.ref.update( { invoicedQuantity: resultQuantity, invoicedStatus: resultStatus });
          }
        });
    });
  }

  checkForSave(record: SalesInvoiceDetailMainModel): Promise<string> {
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

  checkForRemove(record: SalesInvoiceDetailMainModel): Promise<string> {
    return new Promise((resolve, reject) => {
      resolve(null);
    });
  }

  checkFields(model: SalesInvoiceDetailModel): SalesInvoiceDetailModel {
    const cleanModel = this.clearSubModel();
    return model;
  }

  clearSubModel(): SalesInvoiceDetailModel {

    const returnData = new SalesInvoiceDetailModel();
    returnData.primaryKey = null;
    returnData.invoicePrimaryKey = '-1';
    returnData.orderPrimaryKey = '-1';
    returnData.orderDetailPrimaryKey = '-1';
    returnData.productPrimaryKey = '-1';
    returnData.listPrice = 0;
    returnData.price = 0;
    returnData.defaultPrice = 0;
    returnData.discount1 = 0;
    returnData.defaultDiscount1 = 0;
    returnData.discount2 = 0;
    returnData.defaultDiscount2 = 0;
    returnData.quantity = 0;
    returnData.taxRate = 0;
    returnData.insertDate = 0;
    returnData.totalPrice = 0;
    returnData.totalPriceWithTax = 0;
    returnData.campaignPrimaryKey = '-1';
    returnData.unitPrimaryKey = '-1';
    returnData.unitValue = 0;

    return returnData;
  }

  clearMainModel(): SalesInvoiceDetailMainModel {
    const returnData = new SalesInvoiceDetailMainModel();
    returnData.data = this.clearSubModel();
    returnData.product = this.pService.clearMainModel();
    returnData.unit = this.puService.clearSubModel();
    returnData.actionType = 'added';
    returnData.invoiceStatus = ''; // waitingForApprove, approved, rejected
    returnData.priceFormatted = currencyFormat(returnData.data.price);
    returnData.totalPriceFormatted = currencyFormat(returnData.data.totalPrice);
    returnData.totalPriceWithTaxFormatted = currencyFormat(returnData.data.totalPriceWithTax);
    return returnData;
  }

  convertMainModel(model: SalesInvoiceDetailModel): SalesInvoiceDetailMainModel {
    const returnData = this.clearMainModel();
    returnData.data = this.checkFields(model);
    returnData.priceFormatted = currencyFormat(returnData.data.price);
    returnData.totalPriceFormatted = currencyFormat(returnData.data.totalPrice);
    returnData.totalPriceWithTaxFormatted = currencyFormat(returnData.data.totalPriceWithTax);
    return returnData;
  }

  convertToSalesInvoiceDetail(orderItem: SalesOrderDetailMainModel): SalesInvoiceDetailMainModel {

    const data = this.clearMainModel();
    data.data.primaryKey = this.db.createId();
    data.data.orderPrimaryKey = orderItem.data.orderPrimaryKey;
    data.data.orderDetailPrimaryKey = orderItem.data.primaryKey;
    data.data.productPrimaryKey = orderItem.data.productPrimaryKey;
    data.data.listPrice = orderItem.data.listPrice;
    data.data.price = orderItem.data.price;
    data.data.defaultPrice = orderItem.data.defaultPrice;
    data.data.discount1 = orderItem.data.discount1;
    data.data.defaultDiscount1 = orderItem.data.defaultDiscount1;
    data.data.discount2 = orderItem.data.discount2;
    data.data.defaultDiscount2 = orderItem.data.defaultDiscount2;
    data.data.quantity = orderItem.data.quantity - orderItem.data.invoicedQuantity;
    data.data.taxRate = orderItem.data.taxRate;
    data.data.campaignPrimaryKey = orderItem.data.campaignPrimaryKey;
    data.data.unitPrimaryKey = orderItem.data.unitPrimaryKey;
    data.data.unitValue = orderItem.data.unitValue;
    data.product = orderItem.product;
    data.unit = orderItem.unit;
    setInvoiceDetailCalculation(data);
    return data;
  }

  getItem(primaryKey: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.collection(this.tableName).doc(primaryKey).get().toPromise().then(doc => {
        if (doc.exists) {
          const data = doc.data() as SalesInvoiceDetailModel;
          data.primaryKey = doc.id;

          const returnData = this.convertMainModel(data);

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

  getMainItemsWithInvoicePrimaryKey = async (invoicePrimaryKey: string):
    Promise<Array<SalesInvoiceDetailMainModel>> => new Promise(async (resolve, reject): Promise<void> => {
    try {
      const list = Array<SalesInvoiceDetailMainModel>();
      this.db.collection(this.tableName, ref => {
        let query: CollectionReference | Query = ref;
        query = query
          .where('invoicePrimaryKey', '==', invoicePrimaryKey);
        return query;
      })
        .get().subscribe(snapshot => {
        snapshot.forEach(async doc => {
          const data = doc.data() as SalesInvoiceDetailModel;
          data.primaryKey = doc.id;

          const returnData = this.convertMainModel(data);

          const p = await this.pService.getItem(data.productPrimaryKey);
          returnData.product = p.returnData;

          const pu = await this.puService.getItem(data.unitPrimaryKey);
          returnData.unit = pu.returnData.data;

          setInvoiceDetailCalculation(returnData);
          list.push(returnData);
        });
        resolve(list);
      });

    } catch (error) {
      console.error(error);
      reject({code: 401, message: 'You do not have permission or there is a problem about permissions!'});
    }
  })

}
