import {Injectable} from '@angular/core';
import {AngularFirestore, AngularFirestoreCollection, CollectionReference, Query} from '@angular/fire/firestore';
import {Observable} from 'rxjs/Observable';
import {AuthenticationService} from './authentication.service';
import {LogService} from './log.service';
import {ActionService} from './action.service';
import {SalesOrderDetailMainModel, setOrderDetailCalculation} from '../models/sales-order-detail-main-model';
import {ProductService} from './product.service';
import {ProductMainModel} from '../models/product-main-model';
import {currencyFormat, getPaymentTypes, getTerms} from '../core/correct-library';
import {ProductUnitService} from './product-unit.service';
import {ProductUnitModel} from '../models/product-unit-model';
import {SalesInvoiceDetailMainModel} from '../models/sales-invoice-detail-main-model';
import {SalesInvoiceDetailService} from './sales-invoice-detail.service';
import { CampaignDetailModel } from '../models/campaign-detail-model';
import { CampaignDetailMainModel, setCampaignDetailCalculation } from '../models/campaign-detail-main-model';
import { ProductModel } from '../models/product-model';
import { combineLatest, flatMap, map } from 'rxjs/operators';
import { ProductPriceModel } from '../models/product-price-model';

@Injectable({
  providedIn: 'root'
})
export class CampaignDetailService {
  listCollection: AngularFirestoreCollection<CampaignDetailModel>;
  mainList$: Observable<CampaignDetailMainModel[]>;
  tableName = 'tblCampaignDetail';

  constructor(protected authService: AuthenticationService, protected pService: ProductService,
              protected logService: LogService, protected db: AngularFirestore,
              protected actService: ActionService, protected puService: ProductUnitService) {
    this.listCollection = this.db.collection(this.tableName);
  }

  async addItem(record: CampaignDetailMainModel) {
    return await this.listCollection.add(Object.assign({}, record.data));
  }

  async removeItem(record: CampaignDetailMainModel) {
    return await this.db.collection(this.tableName).doc(record.data.primaryKey).delete();
  }

  async updateItem(record: CampaignDetailMainModel) {
    return await this.db.collection(this.tableName).doc(record.data.primaryKey).update(Object.assign({}, record.data));
  }

  async setItem(record: CampaignDetailMainModel, primaryKey: string) {
    return await this.listCollection.doc(primaryKey).set(Object.assign({}, record.data));
  }

  checkForSave(record: CampaignDetailMainModel): Promise<string> {
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

  checkForRemove(record: CampaignDetailMainModel): Promise<string> {
    return new Promise((resolve, reject) => {
      resolve(null);
    });
  }

  checkFields(model: CampaignDetailModel): CampaignDetailModel {
    const cleanModel = this.clearSubModel();
    return model;
  }

  clearSubModel(): CampaignDetailModel {

    const returnData = new CampaignDetailModel();
    returnData.primaryKey = null;
    returnData.campaignPrimaryKey = '';
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

  clearMainModel(): CampaignDetailMainModel {
    const returnData = new CampaignDetailMainModel();
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
          const data = doc.data() as CampaignDetailModel;
          data.primaryKey = doc.id;

          const returnData = new CampaignDetailMainModel();
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

  getMainItemsWithPrimaryKey = async (campaignPrimaryKey: string):
    Promise<Array<CampaignDetailMainModel>> => new Promise(async (resolve, reject): Promise<void> => {
    try {
      const list = Array<CampaignDetailMainModel>();
      this.db.collection(this.tableName, ref => {
        let query: CollectionReference | Query = ref;
        query = query.where('campaignPrimaryKey', '==', campaignPrimaryKey);
        return query;
      })
        .get().subscribe(snapshot => {
        snapshot.forEach(async doc => {
          const data = doc.data() as CampaignDetailModel;
          data.primaryKey = doc.id;

          const returnData = new CampaignDetailMainModel();
          returnData.data = this.checkFields(data);

          const p = await this.pService.getItem(data.productPrimaryKey);
          returnData.product = p.returnData;

          const pu = await this.puService.getItem(data.unitPrimaryKey);
          returnData.unit = pu.returnData.data;

          setCampaignDetailCalculation(returnData);
          list.push(returnData);
        });
        resolve(list);
      });

    } catch (error) {
      console.error(error);
      reject({message: 'Error: ' + error});
    }
  })

  getProductsOnList(campaignPrimaryKey: string): Observable<CampaignDetailMainModel[]> {
    this.listCollection = this.db.collection(this.tableName,
      ref => ref.where('userPrimaryKey', '==', this.authService.getUid())
        .where('campaignPrimaryKey', '==', campaignPrimaryKey));
    this.mainList$ = this.listCollection.stateChanges().pipe(map(changes => {
      return changes.map(change => {
        const data = change.payload.doc.data() as CampaignDetailModel;
        data.primaryKey = change.payload.doc.id;

        const returnData = new CampaignDetailMainModel();
        returnData.data = this.checkFields(data);
        returnData.actionType = change.type;
        returnData.priceFormatted = currencyFormat(returnData.data.price);

        return this.db.collection('tblProduct').doc(data.productPrimaryKey).valueChanges()
          .pipe(map((product: ProductModel) => {
            returnData.product = this.pService.convertMainModel(product);
            return Object.assign({returnData});
          }));
      });
    }), flatMap(feeds => combineLatest(feeds)));
    return this.mainList$;
  }
}
