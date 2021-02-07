import { Injectable } from '@angular/core';
import {AngularFirestore, AngularFirestoreCollection, CollectionReference, Query} from '@angular/fire/firestore';
import { Observable } from 'rxjs/Observable';
import { map, flatMap } from 'rxjs/operators';
import { AuthenticationService } from './authentication.service';
import {BuySaleCurrencyModel} from '../models/buy-sale-currency-model';
import {BuySaleCurrencyMainModel} from '../models/buy-sale-currency-main-model';

@Injectable({
  providedIn: 'root'
})
export class BuySaleCurrencyService {
  listCollection: AngularFirestoreCollection<BuySaleCurrencyModel>;
  mainList$: Observable<BuySaleCurrencyMainModel[]>;
  tableName = 'tblBuySaleCurrency';

  constructor(public authService: AuthenticationService,
              public db: AngularFirestore) {

  }

  async addItem(record: BuySaleCurrencyMainModel) {
    return await this.listCollection.add(Object.assign({}, record.data));
  }

  async removeItem(record: BuySaleCurrencyMainModel) {
    return await this.db.collection(this.tableName).doc(record.data.primaryKey).delete();
  }

  async updateItem(record: BuySaleCurrencyMainModel) {
    return await this.db.collection(this.tableName).doc(record.data.primaryKey).update(Object.assign({}, record.data));
  }

  checkForSave(record: BuySaleCurrencyMainModel): Promise<string> {
    return new Promise((resolve, reject) => {
      if (record.data.currencyName === null || record.data.currencyName.trim() === '') {
        reject('Lüfen döviz adı giriniz.');
      } else {
        resolve(null);
      }
    });
  }

  checkForRemove(record: BuySaleCurrencyMainModel): Promise<string> {
    return new Promise(async (resolve, reject) => {
      await this.isCurrencyHasTransaction(record.data.primaryKey).then(result => {
        if (result) {
          reject('Dövize ait hareket olduğundan silinemez.');
        }
      });
      resolve(null);
    });
  }

  clearSubModel(): BuySaleCurrencyModel {
    const returnData = new BuySaleCurrencyModel();
    returnData.primaryKey = null;
    returnData.userPrimaryKey = this.authService.getUid();
    returnData.employeePrimaryKey = this.authService.getEid();
    returnData.currencyName = '';
    returnData.isActive = true;
    returnData.description = '';
    returnData.insertDate = Date.now();
    return returnData;
  }

  clearMainModel(): BuySaleCurrencyMainModel {
    const returnData = new BuySaleCurrencyMainModel();
    returnData.data = this.clearSubModel();
    return returnData;
  }

  checkFields(model: BuySaleCurrencyModel): BuySaleCurrencyModel {
    const cleanModel = this.clearSubModel();
    if (model.currencyName === undefined) { model.currencyName = cleanModel.currencyName; }
    if (model.description === undefined) { model.description = cleanModel.description; }
    if (model.insertDate === undefined) { model.insertDate = cleanModel.insertDate; }
    return model;
  }

  getItem(primaryKey: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.collection(this.tableName).doc(primaryKey).get()
        .toPromise()
        .then(doc => {
        if (doc.exists) {
          const data = doc.data() as BuySaleCurrencyModel;
          data.primaryKey = doc.id;

          const returnData = new BuySaleCurrencyMainModel();
          returnData.data = this.checkFields(data);
          resolve(Object.assign({returnData}));
        } else {
          resolve(null);
        }
      });
    });
  }

  getMainItems(): Observable<BuySaleCurrencyMainModel[]> {
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
          const data = c.payload.doc.data() as BuySaleCurrencyModel;
          data.primaryKey = c.payload.doc.id;

          const returnData = new BuySaleCurrencyMainModel();
          returnData.data = this.checkFields(data);
          returnData.actionType = c.type;
          return Object.assign({returnData});
        })
      )
    );
    return this.mainList$;
  }

  isCurrencyHasTransaction = async (currencyPrimaryKey: string):
    Promise<boolean> => new Promise(async (resolve, reject): Promise<void> => {
    try {
      this.db.collection('tblBuySale', ref => {
        let query: CollectionReference | Query = ref;
        query = query.limit(1)
          .where('userPrimaryKey', '==', this.authService.getUid())
          .where('currencyPrimaryKey', '==', currencyPrimaryKey);
        return query;
      }).get().subscribe(snapshot => {
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

}
