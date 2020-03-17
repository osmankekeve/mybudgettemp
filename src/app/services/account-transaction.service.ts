import {Injectable} from '@angular/core';
import {AngularFirestore, AngularFirestoreCollection, CollectionReference, Query} from '@angular/fire/firestore';
import {Observable} from 'rxjs/Observable';
import {AccountTransactionModel} from '../models/account-transaction-model';
import {AuthenticationService} from './authentication.service';
import {getTransactionTypes, getTodayStart, getTodayEnd, getModuleIcons, getFloat} from '../core/correct-library';
import {CustomerService} from './customer.service';
import {CustomerModel} from '../models/customer-model';
import {map, flatMap} from 'rxjs/operators';
import {combineLatest} from 'rxjs';
import {AccountTransactionMainModel} from '../models/account-transaction-main-model';
import {Chart} from 'chart.js';
import {PurchaseInvoiceService} from './purchase-invoice.service';
import {PaymentService} from './payment.service';
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

  constructor(public authService: AuthenticationService, public cdService: CashDeskService,
              public cService: CustomerService, public db: AngularFirestore) {
    if (this.authService.isUserLoggedIn()) {
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
    }
  }

  getAllItems(): Observable<AccountTransactionModel[]> {
    this.listCollection = this.db.collection<AccountTransactionModel>(this.tableName);
    this.mainList$ = this.listCollection.valueChanges({idField: 'primaryKey'});
    return this.mainList$;
  }

  getRecordTransactionItems(primaryKey: string): Observable<AccountTransactionModel[]> {
    this.listCollection = this.db.collection<AccountTransactionModel>(this.tableName,
      ref => ref.where('transactionPrimaryKey', '==', primaryKey));
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

  getCustomerAccountTransactionItems(customerPrimaryKey: string, customerAccountPrimaryKey: string,  transactionType: string):
    Observable<AccountTransactionModel[]> {
    this.listCollection = this.db.collection<AccountTransactionModel>(this.tableName,
      ref => ref
        .where('parentPrimaryKey', '==', customerPrimaryKey)
        .where('accountPrimaryKey', '==', customerAccountPrimaryKey)
        .where('parentType', '==', 'customer')
        .where('transactionType', '==', transactionType).orderBy('insertDate'));
    this.mainList$ = this.listCollection.valueChanges({idField: 'primaryKey'});
    return this.mainList$;
  }

  getItem(primaryKey: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.collection(this.tableName).doc(primaryKey).get().toPromise().then(doc => {
        if (doc.exists) {
          const data = doc.data() as AccountTransactionModel;
          data.primaryKey = doc.id;
          resolve(Object.assign({data}));
        } else {
          resolve(null);
        }
      });
    });
  }

  async addItem(record: AccountTransactionModel) {
    return await this.listCollection.add(record);
  }

  async removeItem(record: AccountTransactionModel) {
    return await this.db.collection(this.tableName).doc(record.primaryKey).delete();
  }

  async updateItem(record: AccountTransactionModel) {
    return await this.db.collection(this.tableName).doc(record.primaryKey).update(record);
  }

  getCashDeskTransactions = async (cashDeskPrimaryKey: string, startDate: Date, endDate: Date):
    // tslint:disable-next-line:cyclomatic-complexity
    Promise<Array<AccountTransactionModel>> => new Promise(async (resolve, reject): Promise<void> => {
    try {
      const list = Array<AccountTransactionModel>();
      const citiesRef = this.db.collection(this.tableName, ref =>
        ref.orderBy('insertDate')
          .where('cashDeskPrimaryKey', '==', cashDeskPrimaryKey)
          .startAt(startDate.getTime())
          .endAt(endDate.getTime()));
      citiesRef.get().subscribe(snapshot => {
        snapshot.forEach(doc => {
          const data = doc.data();
          data.primaryKey = doc.id;
          data.transactionTypeTr = this.transactionTypes.get(data.transactionType);
          list.push(data);
        });
        resolve(list);
      });

    } catch (error) {
      console.error(error);
      reject({code: 401, message: 'You do not have permission or there is a problem about permissions!'});
    }
  })

  getSingleCashDeskTransactions = async (cashDeskPrimaryKey: string, startDate: Date, endDate: Date):
    // tslint:disable-next-line:cyclomatic-complexity
    Promise<Array<AccountTransactionModel>> => new Promise(async (resolve, reject): Promise<void> => {
    try {
      const list = Array<AccountTransactionModel>();
      const citiesRef = this.db.collection(this.tableName, ref =>
        ref.orderBy('insertDate')
          .where('parentPrimaryKey', '==', cashDeskPrimaryKey)
          .where('parentType', '==', 'cashDesk')
          .where('cashDeskPrimaryKey', '==', '-1')
          .startAt(startDate.getTime())
          .endAt(endDate.getTime()));
      citiesRef.get().subscribe(snapshot => {
        snapshot.forEach(doc => {
          const data = doc.data();
          data.primaryKey = doc.id;
          data.transactionTypeTr = this.transactionTypes.get(data.transactionType);
          list.push(data);
        });
        resolve(list);
      });

    } catch (error) {
      console.error(error);
      reject({code: 401, message: 'You do not have permission or there is a problem about permissions!'});
    }
  })

  getCustomerTransactions = async (customerPrimaryKey: string, startDate: Date, endDate: Date):
    // tslint:disable-next-line:cyclomatic-complexity
    Promise<Array<AccountTransactionModel>> => new Promise(async (resolve, reject): Promise<void> => {
    try {
      const list = Array<AccountTransactionModel>();
      const citiesRef = this.db.collection(this.tableName, ref =>
        ref.orderBy('insertDate')
          .where('parentPrimaryKey', '==', customerPrimaryKey)
          .where('parentType', '==', 'customer')
          .startAt(startDate.getTime())
          .endAt(endDate.getTime()));
      citiesRef.get().subscribe(snapshot => {
        snapshot.forEach(doc => {
          const data = doc.data();
          data.primaryKey = doc.id;
          data.transactionTypeTr = this.transactionTypes.get(data.transactionType);
          list.push(data);
        });
        resolve(list);
      });

    } catch (error) {
      console.error(error);
      reject({code: 401, message: 'You do not have permission or there is a problem about permissions!'});
    }
  })

  getOnDayTransactionsBetweenDates2 = async (startDate: Date, endDate: Date):
    // tslint:disable-next-line:cyclomatic-complexity
    Promise<Array<AccountTransactionMainModel>> => new Promise(async (resolve, reject): Promise<void> => {
    try {
      const list = Array<AccountTransactionMainModel>();
      this.db.collection(this.tableName, ref =>
        ref.orderBy('insertDate').startAt(startDate.getTime()).endAt(endDate.getTime()))
        .get().subscribe(snapshot => {
        snapshot.forEach(doc => {
          const data = doc.data() as AccountTransactionModel;
          data.primaryKey = doc.id;

          const returnData = new AccountTransactionMainModel();
          returnData.data = data;
          returnData.actionType = 'added';
          returnData.iconUrl = getModuleIcons().get(data.transactionType);
          returnData.transactionTypeTr = getTransactionTypes().get(data.transactionType);

          list.push(returnData);
        });
        resolve(list);
      });

    } catch (error) {
      console.error(error);
      reject({code: 401, message: 'You do not have permission or there is a problem about permissions!'});
    }
  })

  isRecordHasTransaction(primaryKey: string): boolean {
    this.db.collection(this.tableName, ref => ref.where('transactionPrimaryKey', '==', primaryKey))
      .get().subscribe(list => {
      if (list.size > 0) {
        return true;
      }
    });
    return false;
  }

  getMainItems(startDate: Date, endDate: Date): Observable<AccountTransactionMainModel[]> {
    this.listCollection = this.db.collection(this.tableName,
      ref => ref.orderBy('insertDate').startAt(startDate.getTime()).endAt(endDate.getTime())
        .where('userPrimaryKey', '==', this.authService.getUid()));
    this.mainMainList$ = this.listCollection.stateChanges().pipe(map(changes => {
      return changes.map(change => {
        const data = change.payload.doc.data() as AccountTransactionModel;
        data.primaryKey = change.payload.doc.id;

        const returnData = new AccountTransactionMainModel();
        returnData.data = data;
        returnData.actionType = change.type;
        returnData.iconUrl = getModuleIcons().get(data.transactionType);
        returnData.transactionTypeTr = getTransactionTypes().get(data.transactionType);

        if (returnData.data.transactionType === 'cashDeskVoucher') {
          returnData.parentData = this.cashDeskMap.get(returnData.data.parentPrimaryKey);
        } else {
          returnData.parentData = this.customerMap.get(returnData.data.parentPrimaryKey);
        }

        return this.db.collection('tblCustomer').doc('-1').valueChanges()
          .pipe(map((customer: CustomerModel) => {
            return Object.assign(returnData);
          }));
      });
    }), flatMap(feeds => combineLatest(feeds)));
    return this.mainMainList$;
  }


}
