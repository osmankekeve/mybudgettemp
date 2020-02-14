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

@Injectable({
  providedIn: 'root'
})
export class AccountTransactionService {
  listCollection: AngularFirestoreCollection<AccountTransactionModel>;
  mainList$: Observable<AccountTransactionModel[]>;

  mainMainList$: Observable<AccountTransactionMainModel[]>;
  tableName: any = 'tblAccountTransaction';
  transactionTypes = getTransactionTypes();

  constructor(public authServis: AuthenticationService,
              public cService: CustomerService,
              public db: AngularFirestore) {

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

  getCustomerTransactionsWithDateControl = async (customerPrimaryKey: string, startDate: Date, endDate: Date):
    // tslint:disable-next-line:cyclomatic-complexity
    Promise<Array<AccountTransactionModel>> => new Promise(async (resolve, reject): Promise<void> => {
    try {
      const returnList = Array<AccountTransactionModel>();
      const refData = this.db.collection(this.tableName, ref => {

        let query: CollectionReference | Query = ref;
        query = query.orderBy('insertDate')
          .where('parentPrimaryKey', '==', customerPrimaryKey)
          .where('parentType', '==', 'customer');

        if (startDate !== undefined) {
          query = query.startAt(startDate.getTime());
        }
        if (endDate !== undefined) {
          query = query.endAt(endDate.getTime());
        }

        return query;
      });
      refData.get().subscribe(snapshot => {
        snapshot.forEach(doc => {
          const data = doc.data();
          data.primaryKey = doc.id;
          data.transactionTypeTr = this.transactionTypes.get(data.transactionType);
          data.iconUrl = getModuleIcons().get(data.transactionType);
          returnList.push(data);
        });
        resolve(returnList);
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
        .where('userPrimaryKey', '==', this.authServis.getUid()));
    this.mainMainList$ = this.listCollection.stateChanges().pipe(map(changes => {
      return changes.map(change => {
        const data = change.payload.doc.data() as AccountTransactionModel;
        data.primaryKey = change.payload.doc.id;

        const returnData = new AccountTransactionMainModel();
        returnData.data = data;
        returnData.actionType = change.type;
        returnData.iconUrl = getModuleIcons().get(data.transactionType);
        returnData.transactionTypeTr = getTransactionTypes().get(data.transactionType);

        return this.db.collection('tblCustomer').doc('-1').valueChanges()
          .pipe(map((customer: CustomerModel) => {
            return Object.assign(returnData);
          }));
      });
    }), flatMap(feeds => combineLatest(feeds)));
    return this.mainMainList$;
  }

  getAllAccountTransactions = async (customerPrimaryKey: string, startDate: Date, endDate: Date):
    // tslint:disable-next-line:cyclomatic-complexity
    Promise<Array<AccountTransactionModel>> => new Promise(async (resolve, reject): Promise<void> => {
    try {
      const list = Array<any>();
      Promise.all([this.cService.getCustomersForReport(undefined, true)])
        .then((values: any) => {
          if (values[0] !== undefined || values[0] !== null) {
            const returnData = values[0] as Array<CustomerModel>;
            returnData.forEach(item => {
              const dataReport = {stringField1: item.name, numberField1 : 0, numberField2 : 0, numberField3 : 0};

              Promise.all([this.getCustomerTransactionsWithDateControl(item.primaryKey, startDate, endDate)])
                .then((values2: any) => {
                  if (values2[0] !== undefined || values2[0] !== null) {
                    const returnData2 = values2[0] as Array<AccountTransactionModel>;
                    returnData2.forEach(item2 => {
                      dataReport.numberField1 += item2.amount;
                    });
                    list.push(dataReport);
                  }
                }).finally(() => {
                resolve(list);
              });
            });
          }
        });

    } catch (error) {
      console.error(error);
      reject({code: 401, message: 'You do not have permission or there is a problem about permissions!'});
    }
  })


}
