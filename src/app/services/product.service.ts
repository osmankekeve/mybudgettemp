import {Injectable} from '@angular/core';
import {AngularFirestore, AngularFirestoreCollection, CollectionReference, Query} from '@angular/fire/firestore';
import {Observable} from 'rxjs/Observable';
import {CustomerModel} from '../models/customer-model';
import {map, flatMap} from 'rxjs/operators';
import {combineLatest} from 'rxjs';
import {CollectionModel} from '../models/collection-model';
import {AuthenticationService} from './authentication.service';
import {LogService} from './log.service';
import {SettingService} from './setting.service';
import {CollectionMainModel} from '../models/collection-main-model';
import {ProfileService} from './profile.service';
import {currencyFormat, getStatus, isNullOrEmpty} from '../core/correct-library';
import {CustomerService} from './customer.service';
import {AccountTransactionService} from './account-transaction.service';
import {ActionService} from './action.service';
import {AccountTransactionModel} from '../models/account-transaction-model';
import {ProductModel} from '../models/product-model';
import {ProductMainModel} from '../models/product-main-model';
import {BuySaleCurrencyMainModel} from '../models/buy-sale-currency-main-model';
import {NoteMainModel} from '../models/note-main-model';
import {NoteModel} from '../models/note-model';

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
        await this.logService.addTransactionLog(record, 'insert', 'product');
        this.actService.addAction(this.tableName, record.data.primaryKey, 1, 'Kayıt Oluşturma');
      });
  }

  async removeItem(record: ProductMainModel) {
    return await this.db.collection(this.tableName).doc(record.data.primaryKey).delete()
      .then(async () => {
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
      } else if (record.data.taxRate <= 0) {
        reject('Lütfen vergi oranı giriniz.');
      } else if (record.data.sctAmount <= 0) {
        reject('Lütfen ötv miktarı giriniz.');
      } else {
        resolve(null);
      }
    });
  }

  checkForRemove(record: ProductMainModel): Promise<string> {
    return new Promise((resolve, reject) => {
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
    returnData.sctAmountFormatted = currencyFormat(returnData.data.sctAmount);
    return returnData;
  }

  checkFields(model: ProductModel): ProductModel {
    const cleanModel = this.clearSubModel();

    return model;
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
          return Object.assign({returnData});
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
        query = query.where('userPrimaryKey', '==', this.authService.getUid());
        return query;
      });
    this.mainList$ = this.listCollection.stateChanges().pipe(
      map(changes =>
        changes.map(c => {
          const data = c.payload.doc.data() as ProductModel;
          data.primaryKey = c.payload.doc.id;

          const returnData = new ProductMainModel();
          returnData.data = this.checkFields(data);
          returnData.actionType = c.type;
          returnData.isActiveTr = returnData.data.isActive === true ? 'Aktif' : 'Pasif';
          return Object.assign({returnData});
        })
      )
    );
    return this.mainList$;
  }
}
