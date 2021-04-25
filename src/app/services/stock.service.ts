import { ProductService } from './product.service';
import {Injectable} from '@angular/core';
import {AngularFirestore, AngularFirestoreCollection, CollectionReference, Query} from '@angular/fire/firestore';
import {Observable} from 'rxjs/Observable';
import {AuthenticationService} from './authentication.service';
import { StockModel } from '../models/stock-model';
import { StockMainModel } from '../models/stock-main-model';
import { map } from 'rxjs/operators';
import { ProductMainModel } from '../models/product-main-model';
import { ProductModel } from '../models/product-model';

@Injectable({
  providedIn: 'root'
})
export class StockService {
  listCollection: AngularFirestoreCollection<StockModel>;
  mainList$: Observable<StockModel[]>;
  tableName: any = 'tblStock';

  constructor(protected authService: AuthenticationService, protected db: AngularFirestore, protected pService: ProductService) {
                this.listCollection = this.db.collection(this.tableName);
  }

  getAllItems(): Observable<StockModel[]> {
    this.listCollection = this.db.collection<StockModel>(this.tableName);
    this.mainList$ = this.listCollection.valueChanges({idField: 'primaryKey'});
    return this.mainList$;
  }

  async addItem(record: StockMainModel) {
    return await this.listCollection.add(Object.assign({}, record.data));
  }

  async removeItem(record: StockMainModel, primaryKey: string) {
    if (record !== null) {
      return await this.db.collection(this.tableName).doc(record.data.primaryKey).delete();
    } else {
      return await this.db.collection(this.tableName).doc(primaryKey).delete();
    }
  }

  clearSubModel(): StockModel {

    const returnData = new StockModel();
    returnData.primaryKey = '';
    returnData.userPrimaryKey = this.authService.getUid();
    returnData.productPrimaryKey = '-1';
    returnData.quantity = 0;
    returnData.month = 0;
    returnData.year = 0;
    returnData.costPrice = 0;

    return returnData;
  }

  clearMainModel(): StockMainModel {
    const returnData = new StockMainModel();
    returnData.data = this.clearSubModel();
    returnData.actionType = 'added';
    returnData.product = this.pService.clearSubModel();
    return returnData;
  }

  checkFields(model: StockModel): StockModel {
    const cleanModel = this.clearSubModel();

    return model;
  }

  convertMainModel(model: StockModel): StockMainModel {
    const returnData = this.clearMainModel();
    returnData.data = this.checkFields(model);
    return returnData;
  }

  getItem(primaryKey: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.collection(this.tableName).doc(primaryKey).get().toPromise().then(doc => {
        if (doc.exists) {
          const data = this.checkFields(doc.data()) as StockModel;
          data.primaryKey = doc.id;
          resolve(Object.assign({data}));
        } else {
          resolve(null);
        }
      });
    });
  }

  getProductStock(productPrimaryKey: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.collection('tblStock', ref => {
        let query: CollectionReference | Query = ref;
        query = query.limit(1).orderBy('year', 'desc').orderBy('month', 'desc')
          .where('userPrimaryKey', '==', this.authService.getUid())
          .where('productPrimaryKey', '==', productPrimaryKey);
        return query;
      }).get().toPromise().then(async snapshot => {
        if (snapshot.size > 0) {
          snapshot.forEach(async doc => {
            const data = doc.data() as StockModel;
            data.primaryKey = doc.id;
            const returnData = this.convertMainModel(data);
            resolve(Object.assign({returnData}));
          });
        } else {
          const returnData = this.clearMainModel();
          resolve(Object.assign({returnData}));
        }
      });
    });
  }
}
