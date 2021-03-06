import { Injectable } from '@angular/core';
import {AngularFirestore, AngularFirestoreCollection, CollectionReference, Query} from '@angular/fire/firestore';
import { Observable } from 'rxjs/Observable';
import { CustomerModel } from '../models/customer-model';
import { map, mergeMap } from 'rxjs/operators';
import { combineLatest } from 'rxjs';
import { AuthenticationService } from './authentication.service';
import { LogService } from './log.service';
import {SettingService} from './setting.service';
import {ProfileService} from './profile.service';
import { getCurrencyTypes} from '../core/correct-library';
import {CustomerService} from './customer.service';
import {CustomerAccountModel} from '../models/customer-account-model';
import {CustomerAccountMainModel} from '../models/customer-main-account-model';

@Injectable({
  providedIn: 'root'
})
export class CustomerAccountService {
  listCollection: AngularFirestoreCollection<CustomerAccountModel>;
  mainList$: Observable<CustomerAccountMainModel[]>;
  customerMap = new Map();
  tableName = 'tblAccounts';

  constructor(protected authService: AuthenticationService, protected sService: SettingService, protected readonly cusService: CustomerService,
              protected logService: LogService, protected eService: ProfileService, protected db: AngularFirestore) {

    if (this.authService.isUserLoggedIn()) {
      this.cusService.getAllItems().toPromise().then(list => {
        this.customerMap.clear();
        list.forEach(item => {
          this.customerMap.set(item.primaryKey, item);
        });
      });
    }
  }

  getAllItems(customerPrimaryKey: string): Observable<CustomerAccountModel[]> {
    this.listCollection = this.db.collection<CustomerAccountModel>(this.tableName,
      ref => {
        let query: CollectionReference | Query = ref;
        query = query.where('userPrimaryKey', '==', this.authService.getUid());
        if (customerPrimaryKey !== null && customerPrimaryKey !== '-1') {
          query = query.where('customerPrimaryKey', '==', customerPrimaryKey);
        }
        query = query.orderBy('name', 'asc');
        return query;
      });
    return this.listCollection.valueChanges({ idField : 'primaryKey'});
  }

  async addItem(record: CustomerAccountMainModel) {
    await this.logService.addTransactionLog(record, 'insert', 'customer-account');
    return await this.listCollection.add(Object.assign({}, record.data));
  }

  async removeItem(record: CustomerAccountMainModel) {
    await this.logService.addTransactionLog(record, 'delete', 'customer-account');
    return await this.db.collection(this.tableName).doc(record.data.primaryKey).delete();
  }

  async updateItem(record: CustomerAccountMainModel) {
    await this.logService.addTransactionLog(record, 'update', 'customer-account');
    return await this.db.collection(this.tableName).doc(record.data.primaryKey).update(Object.assign({}, record.data));
  }

  async setItem(record: CustomerAccountMainModel) {
    await this.logService.addTransactionLog(record, 'insert', 'customer-account');
    return await this.listCollection.doc(record.data.primaryKey).set(Object.assign({}, record.data));
  }

  checkForSave(record: CustomerAccountMainModel): Promise<string> {
    return new Promise((resolve, reject) => {
      if (record.data.customerPrimaryKey === '' || record.data.customerPrimaryKey === '-1') {
        reject('L??fen m????teri se??iniz.');
      } else if (record.data.name === '') {
        reject('L??fen hesap ad?? giriniz.');
      } else if (record.data.currencyCode === '' || record.data.currencyCode === '-1') {
        reject('L??tfen d??viz se??iniz.');
      }  else {
        resolve(null);
      }
    });
  }

  checkForRemove(record: CustomerAccountMainModel): Promise<string> {
    return new Promise(async (resolve, reject) => {
      await this.isUsedOnSalesInvoice(record.data.primaryKey).then(result => {
        if (result) {
          reject('Hesap sat???? faturas??nda kullan??ld??????ndan silinemez.');
        }
      });
      await this.isUsedOnPurchaseInvoice(record.data.primaryKey).then(result => {
        if (result) {
          reject('Hesap al??m faturas??nda kullan??ld??????ndan silinemez.');
        }
      });
      await this.isUsedOnCollection(record.data.primaryKey).then(result => {
        if (result) {
          reject('Hesap tahsilatta kullan??ld??????ndan silinemez.');
        }
      });
      await this.isUsedOnPayment(record.data.primaryKey).then(result => {
        if (result) {
          reject('Hesap ??demede kullan??ld??????ndan silinemez.');
        }
      });
      await this.isUsedOnAccountVoucher(record.data.primaryKey).then(result => {
        if (result) {
          reject('Hesap cari fi??te kullan??ld??????ndan silinemez.');
        }
      });
      resolve(null);
    });
  }

  checkFields(model: CustomerAccountModel): CustomerAccountModel {
    const cleanModel = this.clearSubModel();
    if (model.customerPrimaryKey === undefined) { model.customerPrimaryKey = cleanModel.customerPrimaryKey; }
    if (model.name === undefined) { model.name = cleanModel.name; }
    if (model.currencyCode === undefined) { model.currencyCode = cleanModel.currencyCode; }
    if (model.description === undefined) { model.description = cleanModel.description; }
    if (model.isActive === undefined) { model.isActive = cleanModel.isActive; }
    if (model.accountNo === undefined) { model.accountNo = cleanModel.accountNo; }
    if (model.bankName === undefined) { model.bankName = cleanModel.bankName; }
    return model;
  }

  clearSubModel(): CustomerAccountModel {

    const returnData = new CustomerAccountModel();
    returnData.primaryKey = null;
    returnData.customerPrimaryKey = '-1';
    returnData.userPrimaryKey = this.authService.getUid();
    returnData.name = '';
    returnData.currencyCode = 'lira';
    returnData.description = '';
    returnData.accountNo = '';
    returnData.bankName = '';
    returnData.isActive = true;
    returnData.insertDate = Date.now();

    return returnData;
  }

  clearMainModel(): CustomerAccountMainModel {
    const returnData = new CustomerAccountMainModel();
    returnData.data = this.clearSubModel();
    returnData.customer = this.cusService.clearMainModel();
    returnData.actionType = 'added';
    returnData.isActiveTr = returnData.data.isActive ? 'Aktif' : 'Pasif';
    returnData.currencyTr = getCurrencyTypes().get(returnData.data.currencyCode);
    return returnData;
  }

  getItem(primaryKey: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.collection(this.tableName).doc(primaryKey).get().toPromise().then(async doc => {
        if (doc.exists) {
          const data = doc.data() as CustomerAccountModel;
          data.primaryKey = doc.id;

          const returnData = new CustomerAccountMainModel();
          returnData.data = this.checkFields(data);
          returnData.data = data;
          returnData.currencyTr = getCurrencyTypes().get(returnData.data.currencyCode);
          const d1 = await this.cusService.getItem(returnData.data.customerPrimaryKey);
          returnData.customer = this.cusService.convertMainModel(d1.data);

          resolve(Object.assign({returnData}));
        } else {
          resolve(null);
        }
      });
    });
  }

  getMainItems(): Observable<CustomerAccountMainModel[]> {
    this.listCollection = this.db.collection(this.tableName,
      ref => ref.where('userPrimaryKey', '==', this.authService.getUid()).orderBy('name', 'asc'));
    this.mainList$ = this.listCollection.stateChanges().pipe(map(changes  => {
      return changes.map( change => {
        const data = change.payload.doc.data() as CustomerAccountModel;
        data.primaryKey = change.payload.doc.id;

        const returnData = new CustomerAccountMainModel();
        returnData.data = this.checkFields(data);
        returnData.actionType = change.type;
        returnData.data = data;
        returnData.currencyTr = getCurrencyTypes().get(returnData.data.currencyCode);

        return this.db.collection('tblCustomer').doc(data.customerPrimaryKey).valueChanges()
          .pipe(map( (customer: CustomerModel) => {
            returnData.customer = customer !== undefined ? this.cusService.convertMainModel(customer) : undefined;
            return Object.assign({returnData}); }));
      });
    }), mergeMap(feeds => combineLatest(feeds)));
    return this.mainList$;
  }

  isUsedOnCustomer = async (primaryKey: string):
    Promise<boolean> => new Promise(async (resolve, reject): Promise<void> => {
    try {
      this.db.collection('tblCustomer', ref => {
        let query: CollectionReference | Query = ref;
        query = query.limit(1).where('defaultAccountPrimaryKey', '==', primaryKey);
        return query;
      }).get().toPromise().then(snapshot => {
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

  isUsedOnSalesInvoice = async (primaryKey: string):
    Promise<boolean> => new Promise(async (resolve, reject): Promise<void> => {
    try {
      this.db.collection('tblSalesInvoice', ref => {
        let query: CollectionReference | Query = ref;
        query = query.limit(1).where('accountPrimaryKey', '==', primaryKey);
        return query;
      }).get().toPromise().then(snapshot => {
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

  isUsedOnPurchaseInvoice = async (primaryKey: string):
    Promise<boolean> => new Promise(async (resolve, reject): Promise<void> => {
    try {
      this.db.collection('tblPurchaseInvoice', ref => {
        let query: CollectionReference | Query = ref;
        query = query.limit(1).where('accountPrimaryKey', '==', primaryKey);
        return query;
      }).get().toPromise().then(snapshot => {
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

  isUsedOnCollection = async (primaryKey: string):
    Promise<boolean> => new Promise(async (resolve, reject): Promise<void> => {
    try {
      this.db.collection('tblCollection', ref => {
        let query: CollectionReference | Query = ref;
        query = query.limit(1).where('accountPrimaryKey', '==', primaryKey);
        return query;
      }).get().toPromise().then(snapshot => {
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

  isUsedOnPayment = async (primaryKey: string):
    Promise<boolean> => new Promise(async (resolve, reject): Promise<void> => {
    try {
      this.db.collection('tblPayment', ref => {
        let query: CollectionReference | Query = ref;
        query = query.limit(1).where('accountPrimaryKey', '==', primaryKey);
        return query;
      }).get().toPromise().then(snapshot => {
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

  isUsedOnAccountVoucher = async (primaryKey: string):
    Promise<boolean> => new Promise(async (resolve, reject): Promise<void> => {
    try {
      this.db.collection('tblAccountVoucher', ref => {
        let query: CollectionReference | Query = ref;
        query = query.limit(1).where('accountPrimaryKey', '==', primaryKey);
        return query;
      }).get().toPromise().then(snapshot => {
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
