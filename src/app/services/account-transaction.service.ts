import {Injectable} from '@angular/core';
import {AngularFirestore, AngularFirestoreCollection, CollectionReference, Query} from '@angular/fire/firestore';
import {Observable} from 'rxjs/Observable';
import {AccountTransactionModel} from '../models/account-transaction-model';
import {AuthenticationService} from './authentication.service';
import {
  getTransactionTypes,
  getTodayStart,
  getTodayEnd,
  getModuleIcons,
  getFloat,
  getStatus,
  currencyFormat, getInvoiceType
} from '../core/correct-library';
import {CustomerService} from './customer.service';
import {map} from 'rxjs/operators';
import {AccountTransactionMainModel} from '../models/account-transaction-main-model';
import {CashDeskService} from './cash-desk.service';

@Injectable({
  providedIn: 'root'
})
export class AccountTransactionService {
  listCollection: AngularFirestoreCollection<AccountTransactionModel>;
  mainList$: Observable<AccountTransactionModel[]>;

  mainMainList$: Observable<AccountTransactionMainModel[]>;
  tableName: any = 'tblAccountTransaction';
  transactionTypes = getTransactionTypes();
  customerMap = new Map();
  cashDeskMap = new Map();

  constructor(protected authService: AuthenticationService, protected cdService: CashDeskService,
              protected cService: CustomerService, protected db: AngularFirestore) {
                this.listCollection = this.db.collection(this.tableName);
                if (this.authService.isUserLoggedIn()) {
                this.cService.getAllItems().toPromise().then(list => {
                  this.customerMap.clear();
                  list.forEach(item => {
                    this.customerMap.set(item.primaryKey, item);
                  });
                });
                this.cdService.getItems().toPromise().then(list => {
                  this.cashDeskMap.clear();
                  list.forEach(item => {
                    this.cashDeskMap.set(item.primaryKey, item);
                  });
                });
    }
  }

  getAllItems(): Observable<AccountTransactionModel[]> {
    this.listCollection = this.db.collection<AccountTransactionModel>(this.tableName);
    this.mainList$ = this.listCollection.valueChanges({idField: 'primaryKey'});
    return this.mainList$;
  }

  getRecordTransactionItems(transactionPrimaryKey: string): Observable<AccountTransactionModel[]> {
    this.listCollection = this.db.collection<AccountTransactionModel>(this.tableName,
      ref => ref.where('primaryKey', '==', transactionPrimaryKey));
    this.mainList$ = this.listCollection.valueChanges({idField: 'primaryKey'});
    return this.mainList$;
  }

  getCustomerTransactionItems(customerPrimaryKey: string, transactionType: string): Observable<AccountTransactionModel[]> {
    this.listCollection = this.db.collection<AccountTransactionModel>(this.tableName,
      ref => ref
        .where('parentPrimaryKey', '==', customerPrimaryKey)
        .where('parentType', '==', 'customer')
        .where('transactionType', '==', transactionType).orderBy('insertDate'));
    this.mainList$ = this.listCollection.valueChanges({idField: 'primaryKey'});
    return this.mainList$;
  }

  getCustomerAccountTransactionItems(customerPrimaryKey: string, customerAccountPrimaryKey: string):
    Observable<AccountTransactionModel[]> {
    this.listCollection = this.db.collection<AccountTransactionModel>(this.tableName,
      ref => ref
        .where('parentPrimaryKey', '==', customerPrimaryKey)
        .where('accountPrimaryKey', '==', customerAccountPrimaryKey)
        .where('parentType', '==', 'customer').orderBy('insertDate'));
    this.mainList$ = this.listCollection.valueChanges({idField: 'primaryKey'});
    return this.mainList$;
  }

  getItem(primaryKey: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.collection(this.tableName).doc(primaryKey).get().toPromise().then(doc => {
        if (doc.exists) {
          const data = this.checkFields(doc.data()) as AccountTransactionModel;
          data.primaryKey = doc.id;
          resolve(Object.assign({data}));
        } else {
          resolve(null);
        }
      });
    });
  }

  async addItem(record: AccountTransactionModel) {
    return await this.listCollection.add(Object.assign({}, record));
  }

  async removeItem(record: AccountTransactionModel, primaryKey: string) {
    if (record !== null) {
      return await this.db.collection(this.tableName).doc(record.primaryKey).delete();
    } else {
      return await this.db.collection(this.tableName).doc(primaryKey).delete();
    }
  }

  async updateItem(record: AccountTransactionModel) {
    return await this.db.collection(this.tableName).doc(record.primaryKey).update(Object.assign({}, record));
  }

  async setItem(record: AccountTransactionModel, primaryKey: string) {
    return await this.listCollection.doc(primaryKey).set(Object.assign({}, record));
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

  clearSubModel(): AccountTransactionModel {

    const returnData = new AccountTransactionModel();
    returnData.primaryKey = null;
    returnData.userPrimaryKey = this.authService.getUid();
    returnData.receiptNo = '';
    returnData.transactionPrimaryKey = '-1';
    returnData.transactionType = '-1';
    returnData.transactionSubType = '-1';
    returnData.parentPrimaryKey = '-1';
    returnData.parentType = '-1';
    returnData.accountPrimaryKey = '-1';
    returnData.cashDeskPrimaryKey = '-1';
    returnData.amount = 0;
    returnData.amountType = '-1';
    returnData.paidAmount = 0;
    returnData.insertDate = Date.now();
    returnData.termDate = Date.now();

    return returnData;
  }

  clearMainModel(): AccountTransactionMainModel {
    const returnData = new AccountTransactionMainModel();
    returnData.data = this.clearSubModel();
    returnData.customer = this.cService.clearMainModel();
    returnData.amountTypeTr = '';
    returnData.actionType = 'added';
    returnData.remainingAmount = Math.abs(returnData.data.amount) - Math.abs(returnData.data.paidAmount);
    returnData.matchTr = this.getMatchTypeTr(returnData.remainingAmount);
    returnData.transactionTypeTr = getTransactionTypes().get(returnData.data.transactionType);
    returnData.subTransactionTypeTr = getTransactionTypes().get(returnData.data.transactionSubType);
    return returnData;
  }

  checkFields(model: AccountTransactionModel): AccountTransactionModel {
    const cleanModel = this.clearSubModel();
    if (model.accountPrimaryKey === undefined) {
      model.accountPrimaryKey = cleanModel.accountPrimaryKey;
    }
    if (model.cashDeskPrimaryKey === undefined) {
      model.cashDeskPrimaryKey = cleanModel.cashDeskPrimaryKey;
    }
    if (model.receiptNo === undefined) {
      model.receiptNo = cleanModel.receiptNo;
    }
    if (model.parentType === undefined) {
      model.parentType = cleanModel.parentType;
    }
    if (model.parentPrimaryKey === undefined) {
      model.parentPrimaryKey = cleanModel.parentPrimaryKey;
    }
    if (model.amount === undefined) {
      model.amount = cleanModel.amount;
    }
    if (model.insertDate === undefined) {
      model.insertDate = cleanModel.insertDate;
    }
    if (model.amountType === undefined) {
      model.amountType = cleanModel.amountType;
    }
    if (model.paidAmount === undefined) {
      model.paidAmount = cleanModel.paidAmount;
    }
    if (model.transactionSubType === undefined || model.transactionSubType === '-1') {
      model.transactionSubType = model.transactionType;
    }
    if (model.termDate === undefined) {
      model.termDate = model.insertDate;
    }

    return model;
  }

  convertMainModel(model: AccountTransactionModel): AccountTransactionMainModel {
    const returnData = this.clearMainModel();
    returnData.data = this.checkFields(model);
    returnData.iconUrl = getModuleIcons().get(model.transactionType);
    returnData.transactionTypeTr = getTransactionTypes().get(model.transactionType);
    returnData.subTransactionTypeTr = getTransactionTypes().get(model.transactionSubType);
    returnData.remainingAmount = Math.abs(returnData.data.amount) - Math.abs(returnData.data.amount);
    returnData.matchTr = this.getMatchTypeTr(returnData.remainingAmount);
    returnData.amountTypeTr = model.amountType === 'debit' ? 'Bor??' : 'Alacak';
    return returnData;
  }

  getCashDeskTransactions = async (cashDeskPrimaryKey: string, startDate: Date, endDate: Date):
    Promise<Array<AccountTransactionMainModel>> => new Promise(async (resolve, reject): Promise<void> => {
    try {
      const list = Array<AccountTransactionMainModel>();
      const citiesRef = this.db.collection(this.tableName, ref =>
        ref.orderBy('insertDate')
          .where('cashDeskPrimaryKey', '==', cashDeskPrimaryKey)
          .startAt(startDate.getTime())
          .endAt(endDate.getTime()));
      citiesRef.get().toPromise().then(snapshot => {
        snapshot.forEach(doc => {
          const data = doc.data() as AccountTransactionModel;
          data.primaryKey = doc.id;

          const returnData = this.convertMainModel(data);
          list.push(returnData);
        });
        resolve(list);
      });

    } catch (error) {
      console.error(error);
      reject({code: 401, message: 'You do not have permission or there is a problem about permissions!'});
    }
  })

  getSingleCashDeskTransactions = async (cashDeskPrimaryKey: string, startDate: Date, endDate: Date):
    Promise<Array<AccountTransactionMainModel>> => new Promise(async (resolve, reject): Promise<void> => {
    try {
      const list = Array<AccountTransactionMainModel>();
      const citiesRef = this.db.collection(this.tableName, ref =>
        ref.orderBy('insertDate')
          .where('parentPrimaryKey', '==', cashDeskPrimaryKey)
          .where('parentType', '==', 'cashDesk')
          .where('cashDeskPrimaryKey', '==', '-1')
          .startAt(startDate.getTime())
          .endAt(endDate.getTime()));
      citiesRef.get().toPromise().then(snapshot => {
        snapshot.forEach(doc => {
          const data = doc.data() as AccountTransactionModel;
          data.primaryKey = doc.id;

          const returnData = this.convertMainModel(data);
          list.push(returnData);
        });
        resolve(list);
      });

    } catch (error) {
      console.error(error);
      reject({code: 401, message: 'You do not have permission or there is a problem about permissions!'});
    }
  })

  getAccountTransactions = async (accountPrimaryKey: string, startDate: Date, endDate: Date):
    Promise<Array<AccountTransactionMainModel>> => new Promise(async (resolve, reject): Promise<void> => {
    try {
      const list = Array<AccountTransactionMainModel>();
      this.db.collection(this.tableName, ref =>
        ref.orderBy('insertDate')
          .where('accountPrimaryKey', '==', accountPrimaryKey)
          .where('parentType', '==', 'customer')
          .startAt(startDate.getTime())
          .endAt(endDate.getTime()))
        .get().toPromise().then(snapshot => {
        snapshot.forEach(doc => {
          const data = doc.data() as AccountTransactionModel;
          data.primaryKey = doc.id;

          const returnData = this.convertMainModel(data);
          list.push(returnData);
        });
        resolve(list);
      });

    } catch (error) {
      console.error(error);
      reject({code: 401, message: 'You do not have permission or there is a problem about permissions!'});
    }
  })

  getOnDayTransactionsBetweenDates2 = async (startDate: Date, endDate: Date):
    Promise<Array<AccountTransactionMainModel>> => new Promise(async (resolve, reject): Promise<void> => {
    try {
      this.cService.getAllItems().toPromise().then(snapshot => {
        this.customerMap.clear();
        snapshot.forEach(item => {
          this.customerMap.set(item.primaryKey, item);
        });
      });
      this.cdService.getItems().toPromise().then(snapshot => {
        this.cashDeskMap.clear();
        snapshot.forEach(item => {
          this.cashDeskMap.set(item.primaryKey, item);
        });
      });
      const list = Array<AccountTransactionMainModel>();
      this.db.collection(this.tableName, ref =>
        ref.orderBy('insertDate').where('userPrimaryKey', '==', this.authService.getUid())
          .startAt(startDate.getTime()).endAt(endDate.getTime()))
        .get().toPromise().then(snapshot => {
        snapshot.forEach(doc => {
          const data = doc.data() as AccountTransactionModel;
          data.primaryKey = doc.id;

          const returnData = this.convertMainModel(data);
          returnData.actionType = 'added';

          if (returnData.data.transactionType === 'cashDeskVoucher') {
            returnData.parentData = this.cashDeskMap.get(returnData.data.parentPrimaryKey);
          } else {
            returnData.parentData = this.customerMap.get(returnData.data.parentPrimaryKey);
          }

          list.push(returnData);
        });
        resolve(list);
      });

    } catch (error) {
      console.error(error);
      reject({code: 401, message: 'You do not have permission or there is a problem about permissions!'});
    }
  })

  getMainItems(startDate: Date, endDate: Date, parentPrimaryKey: string, parentType: string): Observable<AccountTransactionMainModel[]> {
    // left join siz
    this.cService.getAllItems().subscribe(list => {
      this.customerMap.clear();
      list.forEach(item => {
        this.customerMap.set(item.primaryKey, item);
      });
    });
    this.cdService.getItems().subscribe(list => {
      this.cashDeskMap.clear();
      list.forEach(item => {
        this.cashDeskMap.set(item.primaryKey, item);
      });
    });
    this.listCollection = this.db.collection(this.tableName,
      ref => {
        let query: CollectionReference | Query = ref;
        query = query.orderBy('insertDate').where('userPrimaryKey', '==', this.authService.getUid());
        if (parentPrimaryKey != null && parentType != null) {
          query = query.where('parentPrimaryKey', '==', parentPrimaryKey);
          query = query.where('parentType', '==', parentType);
        }
        if (startDate != null) {
          query = query.startAt(startDate.getTime());
        }
        if (endDate != null) {
          query = query.endAt(endDate.getTime());
        }
        return query;
      });
    this.mainMainList$ = this.listCollection.stateChanges().pipe(
      map(changes =>
        changes.map(c => {
          const data = c.payload.doc.data() as AccountTransactionModel;
          data.primaryKey = c.payload.doc.id;

          const returnData = this.convertMainModel(data);
          returnData.actionType = c.type;

          if (returnData.data.transactionType === 'cashDeskVoucher') {
            returnData.parentData = this.cashDeskMap.get(returnData.data.parentPrimaryKey);
            returnData.customer = this.customerMap.get(returnData.data.parentPrimaryKey);
          } else {
            returnData.parentData = this.customerMap.get(returnData.data.parentPrimaryKey);
          }
          return Object.assign({returnData});
        })
      )
    );
    return this.mainMainList$;
  }

  getAccountTransactionsByAmountType = async (accountPrimaryKey: string, amountType: string, transactionType: Array<string>):
    Promise<Array<AccountTransactionMainModel>> => new Promise(async (resolve, reject): Promise<void> => {
    try {
      const list = Array<AccountTransactionMainModel>();
      this.db.collection(this.tableName, ref =>
        ref.orderBy('insertDate')
          .where('accountPrimaryKey', '==', accountPrimaryKey)
          .where('amountType', '==', amountType)
          .where('transactionType', 'in', transactionType))
        .get().toPromise().then(snapshot => {
        snapshot.forEach(doc => {
          const data = doc.data();
          data.primaryKey = doc.id;

          const returnData = new AccountTransactionMainModel();
          returnData.data = this.checkFields(data);
          returnData.actionType = 'added';
          returnData.iconUrl = getModuleIcons().get(data.transactionType);
          returnData.transactionTypeTr = getTransactionTypes().get(data.transactionType);
          returnData.subTransactionTypeTr = getTransactionTypes().get(data.transactionSubType);
          returnData.remainingAmount = Math.abs(returnData.data.amount) - Math.abs(returnData.data.paidAmount);
          returnData.matchTr = this.getMatchTypeTr(returnData.remainingAmount);

          if (returnData.data.transactionType === 'cashDeskVoucher') {
            returnData.parentData = this.cashDeskMap.get(returnData.data.parentPrimaryKey);
          } else {
            returnData.parentData = this.customerMap.get(returnData.data.parentPrimaryKey);
          }

          list.push(returnData);
        });
        resolve(list);
      });

    } catch (error) {
      console.error(error);
      reject({code: 401, message: 'You do not have permission or there is a problem about permissions!'});
    }
  })

  getMatchTypeTr(remainingAmount: number): string {
    if (remainingAmount > 0) {
      return 'A????k Hesap';
    } else {
      return 'Kapal?? Hesap';
    }
  }

  isRecordHasTransaction(primaryKey: string): boolean {
    this.db.collection(this.tableName, ref => ref.where('transactionPrimaryKey', '==', primaryKey))
      .get().toPromise().then(list => {
      if (list.size > 0) {
        return true;
      }
    });
    return false;
  }

}
