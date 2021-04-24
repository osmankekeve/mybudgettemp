import { StockTransactionMainModel } from './../models/stock-transaction-main-model';
import { StockService } from './stock.service';
import { StockTransactionModel } from './../models/stock-transaction-model';
import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection, CollectionReference, Query } from '@angular/fire/firestore';
import { Observable } from 'rxjs/Observable';
import { AccountTransactionModel } from '../models/account-transaction-model';
import { AuthenticationService } from './authentication.service';
import {
  getFloat,
  getTodayForInput,
  getTransactionTypes
} from '../core/correct-library';

@Injectable({
  providedIn: 'root'
})
export class StockTransactionService {
  listCollection: AngularFirestoreCollection<StockTransactionModel>;
  mainList$: Observable<StockTransactionModel[]>;
  mainMainList$: Observable<StockTransactionMainModel[]>;
  tableName: any = 'tblStockTransaction';
  transactionTypes = getTransactionTypes();

  constructor(protected authService: AuthenticationService, protected db: AngularFirestore, protected sService: StockService) {
    this.listCollection = this.db.collection(this.tableName);
  }

  getAllItems(): Observable<StockTransactionModel[]> {
    this.listCollection = this.db.collection<AccountTransactionModel>(this.tableName);
    this.mainList$ = this.listCollection.valueChanges({ idField: 'primaryKey' });
    return this.mainList$;
  }

  async removeItem(record: StockTransactionMainModel, primaryKey: string) {
    if (record !== null) {
      return await this.db.collection(this.tableName).doc(record.data.primaryKey).delete();
    } else {
      return await this.db.collection(this.tableName).doc(primaryKey).delete();
    }
  }

  async setItem(record: StockTransactionMainModel, primaryKey: string) {
    return await this.listCollection.doc(primaryKey).set(Object.assign({}, record.data)).then(async () => {
      await this.db.collection('tblStock', ref => {
        let query: CollectionReference | Query = ref;
        query = query.orderBy('year', 'desc').orderBy('month', 'desc')
          .where('userPrimaryKey', '==', this.authService.getUid())
          .where('productPrimaryKey', '==', record.data.productPrimaryKey);
        return query;
      }).get().toPromise().then(async snapshot => {
        if (snapshot.size > 0) {
          snapshot.forEach(async doc => {
            if (record.data.quantity <= 0) {
              return await doc.ref.update({
                quantity: doc.data().quantity + record.data.quantity
               });
            } else {
              // stoka urun giriyorsa cost hesaplanir
              const current = doc.data().quantity * doc.data().costPrice;
              const newData = record.data.quantity * record.data.amount;
              const newCost = (current + newData) / (doc.data().quantity + record.data.quantity);
              return await doc.ref.update({
                quantity: doc.data().quantity + record.data.quantity,
                costPrice: getFloat(newCost.toFixed(2))
               });
            }
          });
        } else {
          const newData = this.sService.clearMainModel();
          newData.data.productPrimaryKey = record.data.productPrimaryKey;
          newData.data.quantity = record.data.quantity;
          newData.data.costPrice = getFloat((record.data.quantity > 0 ? record.data.amount : 0).toFixed(2));
          newData.data.year = getTodayForInput().year;
          newData.data.month = getTodayForInput().month;
          return await this.sService.addItem(newData);
        }
      });
    });
  }

  async removeTransactions(transactionType: string) {
    await this.db.collection<AccountTransactionModel>(this.tableName,
      ref => ref.where('transactionType', '==', transactionType))
      .get()
      .subscribe(list => {
        list.forEach((doc) => {
          const item = doc as AccountTransactionModel;
          item.primaryKey = doc.id;
          this.db.collection(this.tableName).doc(doc.id).delete();
        });
      });
  }

  clearSubModel(): StockTransactionModel {

    const returnData = new StockTransactionModel();
    returnData.primaryKey = null;
    returnData.userPrimaryKey = this.authService.getUid();
    returnData.receiptNo = '';
    returnData.productPrimaryKey = '-1';
    returnData.transactionPrimaryKey = '-1';
    returnData.transactionType = '-1';
    returnData.transactionSubType = '-1';
    returnData.amount = 0;
    returnData.quantity = 0;
    returnData.insertDate = Date.now();

    return returnData;
  }

  clearMainModel(): StockTransactionMainModel {
    const returnData = new StockTransactionMainModel();
    returnData.data = this.clearSubModel();
    returnData.actionType = 'added';
    returnData.transactionTypeTr = getTransactionTypes().get(returnData.data.transactionType);
    returnData.subTransactionTypeTr = getTransactionTypes().get(returnData.data.transactionSubType);
    return returnData;
  }

  checkFields(model: StockTransactionModel): StockTransactionModel {
    const cleanModel = this.clearSubModel();

    return model;
  }

  convertMainModel(model: StockTransactionModel): StockTransactionMainModel {
    const returnData = this.clearMainModel();
    returnData.data = this.checkFields(model);
    returnData.transactionTypeTr = getTransactionTypes().get(model.transactionType);
    returnData.subTransactionTypeTr = getTransactionTypes().get(model.transactionSubType);
    return returnData;
  }

  getItem(primaryKey: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.collection(this.tableName).doc(primaryKey).get().toPromise().then(doc => {
        if (doc.exists) {
          const data = this.checkFields(doc.data()) as StockTransactionModel;
          data.primaryKey = doc.id;
          resolve(Object.assign({ data }));
        } else {
          resolve(null);
        }
      });
    });
  }

  getTransactions = async (productPrimaryKey: string, startDate: Date, endDate: Date):
    Promise<Array<StockTransactionMainModel>> => new Promise(async (resolve, reject): Promise<void> => {
      try {
        const list = Array<StockTransactionMainModel>();
        this.db.collection(this.tableName, ref =>
          ref.orderBy('insertDate', 'desc')
            .where('userPrimaryKey', '==', this.authService.getUid())
            .where('productPrimaryKey', '==', productPrimaryKey)
            .startAt(endDate.getTime())
            .endAt(startDate.getTime()))
          .get().toPromise().then(snapshot => {
            snapshot.forEach(doc => {
              const data = doc.data() as StockTransactionModel;
              data.primaryKey = doc.id;

              const returnData = this.convertMainModel(data);
              list.push(returnData);
            });
            resolve(list);
          });

      } catch (error) {
        console.error(error);
        reject({ code: 401, message: 'You do not have permission or there is a problem about permissions!' });
      }
    })
}
