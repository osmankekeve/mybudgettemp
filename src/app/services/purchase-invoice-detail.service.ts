import {Injectable} from '@angular/core';
import {AngularFirestore, AngularFirestoreCollection, CollectionReference, Query} from '@angular/fire/firestore';
import {Observable} from 'rxjs/Observable';
import {map, flatMap} from 'rxjs/operators';
import {combineLatest} from 'rxjs';
import {AuthenticationService} from './authentication.service';
import {LogService} from './log.service';
import {ProfileService} from './profile.service';
import {ActionService} from './action.service';
import {ProductService} from './product.service';
import {ProductMainModel} from '../models/product-main-model';
import {currencyFormat, getStatus} from '../core/correct-library';
import {ProductUnitService} from './product-unit.service';

import {ProductUnitModel} from '../models/product-unit-model';
import {PurchaseInvoiceDetailMainModel, setInvoiceDetailCalculation} from '../models/purchase-invoice-detail-main-model';
import {PurchaseInvoiceDetailModel} from '../models/purchase-invoice-detail-model';
import {PurchaseOrderDetailMainModel} from '../models/purchase-order-detail-main-model';

@Injectable({
  providedIn: 'root'
})
export class PurchaseInvoiceDetailService {
  listCollection: AngularFirestoreCollection<PurchaseInvoiceDetailModel>;
  mainList$: Observable<PurchaseInvoiceDetailMainModel[]>;
  tableName = 'tblPurchaseInvoiceDetail';

  constructor(protected authService: AuthenticationService, protected pService: ProductService,
              protected logService: LogService, protected eService: ProfileService, protected db: AngularFirestore,
              protected actService: ActionService, protected puService: ProductUnitService) {
    this.listCollection = this.db.collection(this.tableName);
  }

  async removeItem(record: PurchaseInvoiceDetailMainModel) {
    return await this.db.collection(this.tableName).doc(record.data.primaryKey).delete();
  }

  async setItem(record: PurchaseInvoiceDetailMainModel, primaryKey: string) {
    await this.removeItem(record);
    return await this.listCollection.doc(primaryKey).set(Object.assign({}, record.data)).then(async () => {
      this.db.collection('tblPurchaseOrderDetail').doc(record.data.orderDetailPrimaryKey).get().toPromise()
        .then(async doc => {
          if (record.invoiceStatus === 'approved') {
            // fatura onaylandi ise kalem bazinda faturalanma miktari kontrol edilir.
            // hepsi faturalanirsa complete, yoksa short durumunda guncellenir.
            const orderQuantity = doc.data().quantity;
            const orderInvoicedQuantity = doc.data().invoicedQuantity;
            const newInvoiceQuantity = record.data.quantity;
            let resultQuantity = 0;
            let resultStatus = 'short';
            if (orderInvoicedQuantity + newInvoiceQuantity === orderQuantity) {
              resultQuantity = orderQuantity;
              resultStatus = 'complete';
            } else {
              resultQuantity = orderInvoicedQuantity + newInvoiceQuantity;
            }
            await doc.ref.update( { invoicedQuantity: resultQuantity, invoicedStatus: resultStatus });
          }
        });
    });
  }

  checkForSave(record: PurchaseInvoiceDetailMainModel): Promise<string> {
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

  checkForRemove(record: PurchaseInvoiceDetailMainModel): Promise<string> {
    return new Promise((resolve, reject) => {
      resolve(null);
    });
  }

  checkFields(model: PurchaseInvoiceDetailModel): PurchaseInvoiceDetailModel {
    const cleanModel = this.clearSubModel();
    return model;
  }

  clearSubModel(): PurchaseInvoiceDetailModel {

    const returnData = new PurchaseInvoiceDetailModel();
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
    returnData.unitPrimaryKey = '-1';
    returnData.unitValue = 0;

    return returnData;
  }

  clearMainModel(): PurchaseInvoiceDetailMainModel {
    const returnData = new PurchaseInvoiceDetailMainModel();
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

  convertMainModel(model: PurchaseInvoiceDetailModel): PurchaseInvoiceDetailMainModel {
    const returnData = this.clearMainModel();
    returnData.data = this.checkFields(model);
    returnData.priceFormatted = currencyFormat(returnData.data.price);
    returnData.totalPriceFormatted = currencyFormat(returnData.data.totalPrice);
    returnData.totalPriceWithTaxFormatted = currencyFormat(returnData.data.totalPriceWithTax);
    return returnData;
  }

  convertToPurchaseInvoiceDetail(orderItem: PurchaseOrderDetailMainModel): PurchaseInvoiceDetailMainModel {

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
          const data = doc.data() as PurchaseInvoiceDetailModel;
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
    Promise<Array<PurchaseInvoiceDetailMainModel>> => new Promise(async (resolve, reject): Promise<void> => {
    try {
      const list = Array<PurchaseInvoiceDetailMainModel>();
      this.db.collection(this.tableName, ref => {
        let query: CollectionReference | Query = ref;
        query = query
          .where('invoicePrimaryKey', '==', invoicePrimaryKey);
        return query;
      })
        .get().subscribe(snapshot => {
        snapshot.forEach(async doc => {
          const data = doc.data() as PurchaseInvoiceDetailModel;
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
      reject({message: 'Error: ' + error});
    }
  })

}
