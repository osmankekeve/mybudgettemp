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
import {SalesOrderDetailMainModel} from '../models/sales-order-detail-main-model';
import {ProductService} from './product.service';
import {ProductMainModel} from '../models/product-main-model';
import {ProductModel} from '../models/product-model';
import {CustomerMainModel} from '../models/customer-main-model';
import {CustomerModel} from '../models/customer-model';
import {getPaymentTypes, getTerms} from '../core/correct-library';

@Injectable({
  providedIn: 'root'
})
export class SalesOrderDetailService {
  listCollection: AngularFirestoreCollection<SalesOrderDetailModel>;
  mainList$: Observable<SalesOrderDetailMainModel[]>;
  tableName = 'tblSalesOrderDetail';

  constructor(protected authService: AuthenticationService, protected pService: ProductService,
              protected logService: LogService, protected eService: ProfileService, protected db: AngularFirestore,
              protected actService: ActionService) {
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
      if (record.data.productPrimaryKey === '' || record.data.productPrimaryKey === '-1') {
        reject('Lütfen ürün seçiniz.');
      } else if (record.data.unitPrimaryKey === '' || record.data.unitPrimaryKey === '-1') {
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

    return model;
  }

  clearSubModel(): SalesOrderDetailModel {

    const returnData = new SalesOrderDetailModel();
    returnData.primaryKey = null;
    returnData.orderPrimaryKey = '-1';
    returnData.productPrimaryKey = '-1';
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

  clearMainModel(): SalesOrderDetailMainModel {
    const returnData = new SalesOrderDetailMainModel();
    returnData.data = this.clearSubModel();
    returnData.product = this.pService.clearMainModel();
    returnData.actionType = 'added';
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

          Promise.all([this.pService.getItem(returnData.data.productPrimaryKey)])
            .then((values: any) => {
              if (values[0] !== undefined || values[0] !== null) {
                returnData.product = values[0] as ProductMainModel;
              }
            });

          resolve(Object.assign({returnData}));
        } else {
          resolve(null);
        }
      });
    });
  }

  getMainItems(): Observable<SalesOrderDetailMainModel[]> {
    this.listCollection = this.db.collection(this.tableName,
      ref => ref.orderBy('insertDate').where('userPrimaryKey', '==', this.authService.getUid()));
    this.mainList$ = this.listCollection.stateChanges().pipe(map(changes => {
      return changes.map(change => {
        const data = change.payload.doc.data() as SalesOrderDetailModel;
        data.primaryKey = change.payload.doc.id;

        const returnData = new SalesOrderDetailMainModel();
        returnData.data = this.checkFields(data);
        returnData.actionType = change.type;

        return this.db.collection('tblProduct').doc(data.productPrimaryKey).valueChanges()
          .pipe(map((product: ProductModel) => {
            returnData.product = product !== undefined ? this.pService.convertMainModel(product) : undefined;
            return Object.assign({returnData});
          }));
      });
    }), flatMap(feeds => combineLatest(feeds)));
    return this.mainList$;
  }

  getMainItemsWithOrderPrimaryKey = async (orderPrimaryKey: string):
    Promise<Array<SalesOrderDetailMainModel>> => new Promise(async (resolve, reject): Promise<void> => {
    try {
      const list = Array<SalesOrderDetailMainModel>();
      this.db.collection(this.tableName, ref => {
        let query: CollectionReference | Query = ref;
        query = query
          .where('userPrimaryKey', '==', this.authService.getUid())
          .where('orderPrimaryKey', '==', orderPrimaryKey);
        return query;
      })
        .get().subscribe(snapshot => {
        snapshot.forEach(doc => {
          const data = doc.data() as SalesOrderDetailModel;
          data.primaryKey = doc.id;

          const returnData = new SalesOrderDetailMainModel();
          returnData.data = this.checkFields(data);

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
