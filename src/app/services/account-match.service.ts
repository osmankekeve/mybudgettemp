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
import {currencyFormat, getCustomerTypes, getPaymentTypes, getStatus, getTerms, isNullOrEmpty} from '../core/correct-library';
import {CustomerService} from './customer.service';
import {AccountTransactionService} from './account-transaction.service';
import {ActionService} from './action.service';
import {AccountTransactionModel} from '../models/account-transaction-model';
import {AccountMatchModel} from '../models/account-match-model';
import {CustomerMainModel} from '../models/customer-main-model';
import {BuySaleCurrencyMainModel} from '../models/buy-sale-currency-main-model';
import {BuySaleCurrencyModel} from '../models/buy-sale-currency-model';

@Injectable({
  providedIn: 'root'
})
export class AccountMatchService {
  listCollection: AngularFirestoreCollection<AccountMatchModel>;
  mainList$: Observable<AccountMatchModel[]>;
  tableName = 'tblAccountMatch';

  constructor(protected authService: AuthenticationService, protected logService: LogService, protected db: AngularFirestore) {

  }

  async addItem(record: AccountMatchModel) {
    return await this.listCollection.add(Object.assign({}, record))
      .then(async () => {
        await this.logService.addTransactionLog(record, 'insert', 'account-match');
      });
  }

  async removeItem(record: AccountMatchModel) {
    return await this.db.collection(this.tableName).doc(record.primaryKey).delete()
      .then(async () => {
        await this.logService.addTransactionLog(record, 'delete', 'account-match');
      });
  }

  async updateItem(record: AccountMatchModel) {
    return await this.db.collection(this.tableName).doc(record.primaryKey)
      .update(Object.assign({}, record))
      .then(async value => {
        await this.logService.addTransactionLog(record, 'update', 'account-match');
      });
  }

  async setItem(record: AccountMatchModel, primaryKey: string) {
    return await this.listCollection.doc(primaryKey).set(Object.assign({}, record))
      .then(async value => {
        await this.logService.addTransactionLog(record, 'insert', 'account-match');
      });
  }

  checkForSave(record: AccountMatchModel): Promise<string> {
    return new Promise((resolve, reject) => {
      resolve(null);
    });
  }

  checkForRemove(record: AccountMatchModel): Promise<string> {
    return new Promise((resolve, reject) => {
      resolve(null);
    });
  }

  clearSubModel(): AccountMatchModel {

    const returnData = new AccountMatchModel();
    returnData.primaryKey = null;
    returnData.userPrimaryKey = this.authService.getUid();
    returnData.employeePrimaryKey = this.authService.getEid();
    returnData.debitPrimaryKey = '-1';
    returnData.debitType = '-1'; // salesInvoice, purchaseInvoice, payment, accountVoucher
    returnData.debitParentPrimaryKey = '-1';
    returnData.creditPrimaryKey = '-1';
    returnData.creditType = '-1'; // salesInvoice, purchaseInvoice, collection, accountVoucher
    returnData.creditParentPrimaryKey = '-1';
    returnData.amount = 0;
    returnData.insertDate = Date.now();

    return returnData;
  }

  checkFields(model: AccountMatchModel): AccountMatchModel {
    const cleanModel = this.clearSubModel();
    if (model.employeePrimaryKey === undefined) {
      model.employeePrimaryKey = '-1';
    }
    if (model.debitPrimaryKey === undefined) {
      model.debitPrimaryKey = cleanModel.debitPrimaryKey;
    }
    if (model.debitType === undefined) {
      model.debitType = cleanModel.debitType;
    }
    if (model.creditPrimaryKey === undefined) {
      model.creditPrimaryKey = cleanModel.creditPrimaryKey;
    }
    if (model.creditType === undefined) {
      model.creditType = cleanModel.creditType;
    }
    if (model.amount === undefined) {
      model.amount = cleanModel.amount;
    }

    return model;
  }

  getItem(primaryKey: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.collection(this.tableName).doc(primaryKey).get().toPromise().then(doc => {
        if (doc.exists) {
          const data = doc.data() as AccountMatchModel;
          data.primaryKey = doc.id;

          const returnData = this.checkFields(data);

          resolve(Object.assign({returnData}));
        } else {
          resolve(null);
        }
      });
    });
  }

  getMainItems(): Observable<AccountMatchModel[]> {
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
          const data = c.payload.doc.data() as AccountMatchModel;
          data.primaryKey = c.payload.doc.id;

          const returnData = this.checkFields(data);
          return Object.assign({returnData});
        })
      )
    );
    return this.mainList$;
  }
}
