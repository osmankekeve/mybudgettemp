import { Injectable } from '@angular/core';
import {
  AngularFirestore,
  AngularFirestoreCollection,
  CollectionReference, Query
} from '@angular/fire/firestore';
import { CustomerModel } from '../models/customer-model';
import { Observable } from 'rxjs/internal/Observable';
import { map } from 'rxjs/operators';
import { AuthenticationService } from './authentication.service';
import {LogService} from './log.service';
import {ProfileService} from './profile.service';
import {CustomerMainModel} from '../models/customer-main-model';
import {getCustomerTypes, getPaymentTypes, getTerms} from '../core/correct-library';
import {SettingService} from './setting.service';
import 'rxjs-compat/add/observable/of';
import 'rxjs-compat/add/operator/combineLatest';
import 'rxjs-compat/add/observable/combineLatest';
import 'rxjs-compat/add/observable/from';
import 'rxjs-compat/add/operator/merge';

@Injectable({
  providedIn: 'root'
})
export class CustomerService {

  listCollection: AngularFirestoreCollection<CustomerModel>;
  mainList$: Observable<CustomerModel[]>;
  mainList2$: Observable<CustomerMainModel[]>;
  tableName = 'tblCustomer';
  employeeMap = new Map();

  constructor(public authService: AuthenticationService, public eService: ProfileService, public db: AngularFirestore,
              public sService: SettingService, public logService: LogService) {
    if (this.authService.isUserLoggedIn()) {
      this.eService.getItems().subscribe(list => {
        this.employeeMap.clear();
        this.employeeMap.set('-1', null);
        list.forEach(item => {
          this.employeeMap.set(item.primaryKey, item);
        });
      });
    }
  }

  getAllItems(): Observable<CustomerModel[]> {
    this.listCollection = this.db.collection<CustomerModel>(this.tableName,
      ref => ref.where('userPrimaryKey', '==', this.authService.getUid()).orderBy('name', 'asc'));
    return this.listCollection.valueChanges({idField: 'primaryKey'});
  }

  getAllActiveItems(): Observable<CustomerModel[]> {
    this.listCollection = this.db.collection<CustomerModel>(this.tableName,
      ref => ref
        .where('userPrimaryKey', '==', this.authService.getUid())
        .where('isActive', '==', true)
        .orderBy('name', 'asc'));
    return this.listCollection.valueChanges({idField: 'primaryKey'});
  }

  async addItem(record: CustomerMainModel) {
    await this.logService.sendToLog(record, 'insert', 'customer');
    await this.sService.increaseCustomerNumber();
    return await this.listCollection.add(Object.assign({}, record.data));
  }

  async setItem(record: CustomerMainModel, primaryKey: string) {
    await this.logService.sendToLog(record, 'insert', 'customer');
    await this.sService.increaseCustomerNumber();
    return await this.listCollection.doc(primaryKey).set(Object.assign({}, record.data));
  }

  async removeItem(record: CustomerMainModel) {
    await this.logService.sendToLog(record, 'delete', 'customer');
    return await this.db.collection(this.tableName).doc(record.data.primaryKey).delete();
  }

  async updateItem(record: CustomerMainModel) {
    await this.logService.sendToLog(record, 'update', 'customer');
    return await this.db.collection(this.tableName).doc(record.data.primaryKey).update(Object.assign({}, record.data));
  }

  checkForSave(record: CustomerMainModel): Promise<string> {
    return new Promise((resolve, reject) => {
      if (record.data.name === '' || record.data.name.trim() === '') {
        reject('Lüfen kasa adı giriniz.');
      } else if (record.data.phone1 === '' || record.data.phone1.trim() === '') {
        reject('Lüfen telefon giriniz.');
      } else if (record.data.owner === '' || record.data.owner.trim() === '') {
        reject('Lüfen yetkili kişi giriniz.');
      } else {
        resolve(null);
      }
    });
  }

  checkForRemove(record: CustomerMainModel): Promise<string> {
    return new Promise(async (resolve, reject) => {
      await this.isCustomerHasAccount(record.data.primaryKey).then(result => {
        if (result) {
          reject('Müşteriye ait hesap olduğundan silinemez.');
        }
      });
      await this.isCustomerHasSalesInvoice(record.data.primaryKey).then(result => {
        if (result) {
          reject('Müşteriye ait satış faturası olduğundan silinemez.');
        }
      });
      await this.isCustomerHasCollection(record.data.primaryKey).then(result => {
        if (result) {
          reject('Müşteriye ait tahsilat olduğundan silinemez.');
        }
      });
      await this.isCustomerHasPurchaseInvoice(record.data.primaryKey).then(result => {
        if (result) {
          reject('Müşteriye ait alım faturası olduğundan silinemez.');
        }
      });
      await this.isCustomerHasPayment(record.data.primaryKey).then(result => {
        if (result) {
          reject('Müşteriye ait ödeme olduğundan silinemez.');
        }
      });
      resolve(null);
    });
  }

  checkFields(model: CustomerModel): CustomerModel {
    const cleanModel = this.clearModel();
    if (model.employeePrimaryKey === undefined) {
      model.employeePrimaryKey = '-1';
    }
    if (model.executivePrimary === undefined) {
      model.executivePrimary = cleanModel.executivePrimary;
    }
    if (model.code === undefined) {
      model.code = cleanModel.code;
    }
    if (model.name === undefined) {
      model.name = cleanModel.name;
    }
    if (model.owner === undefined) {
      model.owner = cleanModel.owner;
    }
    if (model.phone1 === undefined) {
      model.phone1 = cleanModel.phone1;
    }
    if (model.phone2 === undefined) {
      model.phone2 = cleanModel.phone2;
    }
    if (model.email === undefined) {
      model.email = cleanModel.email;
    }
    if (model.address === undefined) {
      model.address = cleanModel.address;
    }
    if (model.isActive === undefined) {
      model.isActive = cleanModel.isActive;
    }
    if (model.taxOffice === undefined) {
      model.taxOffice = cleanModel.taxOffice;
    }
    if (model.taxNumber === undefined) {
      model.taxNumber = cleanModel.taxNumber;
    }
    if (model.postCode === undefined) {
      model.postCode = cleanModel.postCode;
    }
    if (model.paymentTypeKey === undefined) {
      model.paymentTypeKey = cleanModel.paymentTypeKey;
    }
    if (model.termKey === undefined) {
      model.termKey = cleanModel.termKey;
    }
    if (model.isActive === undefined) {
      model.isActive = cleanModel.isActive;
    }
    if (model.customerType === undefined) {
      model.customerType = cleanModel.customerType;
    }
    return model;
  }

  clearModel(): CustomerModel {

    const returnData = new CustomerModel();
    returnData.primaryKey = null;
    returnData.userPrimaryKey = this.authService.getUid();
    returnData.employeePrimaryKey = this.authService.getEid();
    returnData.executivePrimary = '-1';
    returnData.code = '';
    returnData.name = '';
    returnData.owner = '';
    returnData.phone1 = '';
    returnData.phone2 = '';
    returnData.email = '';
    returnData.address = '';
    returnData.isActive = true;
    returnData.taxOffice = '';
    returnData.taxNumber = '';
    returnData.postCode = '';
    returnData.paymentTypeKey = '-1';
    returnData.termKey = '-1';
    returnData.isActive = true;
    returnData.defaultAccountPrimaryKey = '-1';
    returnData.customerType = 'customer';

    return returnData;
  }

  clearMainModel(): CustomerMainModel {

    const returnData = new CustomerMainModel();
    returnData.data = this.clearModel();
    returnData.employee = this.employeeMap.get(returnData.data.employeePrimaryKey);
    returnData.executive = this.employeeMap.get(returnData.data.executivePrimary);
    returnData.paymentTypeTr = getPaymentTypes().get(returnData.data.paymentTypeKey);
    returnData.termTr = getTerms().get(returnData.data.termKey);
    returnData.isActiveTr = returnData.data.isActive ? 'Aktif' : 'Pasif';
    returnData.customerTypeTr = getCustomerTypes().get(returnData.data.customerType);

    return returnData;
  }

  getItem(primaryKey: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.collection(this.tableName).doc(primaryKey).get().toPromise().then(doc => {
        if (doc.exists) {
          let data = doc.data() as CustomerModel;
          data.primaryKey = doc.id;
          data = this.checkFields(data);
          resolve(Object.assign({data}));
        } else {
          resolve(null);
        }
      });
    });
  }

  getCustomer(primaryKey: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.collection(this.tableName).doc(primaryKey).get().toPromise().then(doc => {
        if (doc.exists) {
          const data = doc.data() as CustomerModel;
          data.primaryKey = doc.id;

          const returnData = new CustomerMainModel();
          returnData.data = this.checkFields(data);
          returnData.employee = this.employeeMap.get(data.employeePrimaryKey);
          returnData.executive = this.employeeMap.get(data.executivePrimary);
          returnData.paymentTypeTr = getPaymentTypes().get(returnData.data.paymentTypeKey);
          returnData.termTr = getTerms().get(returnData.data.termKey);
          returnData.customerTypeTr = getCustomerTypes().get(returnData.data.customerType);
          resolve(returnData);
        } else {
          resolve(null);
        }
      });
    });
  }

  getMainItems(isActive: boolean): Observable<CustomerMainModel[]> {
    // left join siz
    this.listCollection = this.db.collection(this.tableName,
      ref => {
        let query: CollectionReference | Query = ref;
        query = query.orderBy('name', 'asc')
          .where('userPrimaryKey', '==', this.authService.getUid());
        if (isActive !== null) {
          query = query.where('isActive', '==', isActive);
        }
        return query;
      });
    this.mainList2$ = this.listCollection.stateChanges().pipe(
      map(changes =>
        changes.map(c => {
          const data = c.payload.doc.data() as CustomerModel;
          data.primaryKey = c.payload.doc.id;

          const returnData = new CustomerMainModel();
          returnData.data = this.checkFields(data);
          returnData.actionType = c.type;
          returnData.employee = this.employeeMap.get(data.employeePrimaryKey);
          returnData.executive = this.employeeMap.get(data.executivePrimary);
          returnData.paymentTypeTr = getPaymentTypes().get(returnData.data.paymentTypeKey);
          returnData.termTr = getTerms().get(returnData.data.termKey);
          returnData.customerTypeTr = getCustomerTypes().get(returnData.data.customerType);
          return Object.assign({returnData});
        })
      )
    );
    return this.mainList2$;
  }

  getCustomersForReport = async (customerPrimaryKey: string, isActive: boolean):
    Promise<Array<CustomerModel>> => new Promise(async (resolve, reject): Promise<void> => {
    try {
      const list = Array<CustomerModel>();
      this.db.collection(this.tableName, ref => {
        let query: CollectionReference | Query = ref;
        query = query.orderBy('name', 'asc')
          .where('userPrimaryKey', '==', this.authService.getUid());
        if (customerPrimaryKey !== undefined && customerPrimaryKey !== null && customerPrimaryKey !== '-1') {
          query = query.where('primaryKey', '==', customerPrimaryKey);
        }
        if (isActive !== undefined && isActive !== null) {
          query = query.where('isActive', '==', isActive);
        }
        return query;
      })
        .get().subscribe(snapshot => {
        snapshot.forEach(doc => {
          let data = doc.data() as CustomerModel;
          data.primaryKey = doc.id;
          data = this.checkFields(data);
          list.push(data);
        });
        resolve(list);
      });

    } catch (error) {
      console.error(error);
      reject({code: 401, message: 'You do not have permission or there is a problem about permissions!'});
    }
  })

  getCustomersMainModel = async (customerPrimaryKey: string, isActive: boolean):
    Promise<Array<CustomerMainModel>> => new Promise(async (resolve, reject): Promise<void> => {
    try {
      const list = Array<CustomerMainModel>();
      this.db.collection(this.tableName, ref => {
        let query: CollectionReference | Query = ref;
        query = query.orderBy('name', 'asc')
          .where('userPrimaryKey', '==', this.authService.getUid());
        if (customerPrimaryKey !== undefined && customerPrimaryKey !== null && customerPrimaryKey !== '-1') {
          query = query.where('primaryKey', '==', customerPrimaryKey);
        }
        if (isActive !== undefined && isActive !== null) {
          query = query.where('isActive', '==', isActive);
        }
        return query;
      })
        .get().subscribe(snapshot => {
        snapshot.forEach(doc => {
          const data = doc.data() as CustomerModel;
          data.primaryKey = doc.id;

          const returnData = new CustomerMainModel();
          returnData.data = this.checkFields(data);
          returnData.employee = this.employeeMap.get(data.employeePrimaryKey);
          returnData.executive = this.employeeMap.get(data.executivePrimary);
          returnData.paymentTypeTr = getPaymentTypes().get(returnData.data.paymentTypeKey);
          returnData.termTr = getTerms().get(returnData.data.termKey);

          list.push(returnData);
        });
        resolve(list);
      });

    } catch (error) {
      console.error(error);
      reject({code: 401, message: 'You do not have permission or there is a problem about permissions!'});
    }
  })

  isCustomerHasAccount = async (customerPrimaryKey: string):
    Promise<boolean> => new Promise(async (resolve, reject): Promise<void> => {
    try {
      this.db.collection('tblAccounts', ref => {
        let query: CollectionReference | Query = ref;
        query = query.orderBy('insertDate').limit(1)
          .where('userPrimaryKey', '==', this.authService.getUid())
          .where('customerPrimaryKey', '==', customerPrimaryKey);
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
      reject({code: 401, message: 'You do not have permission or there is a problem about permissions!'});
    }
  })

  isCustomerHasSalesInvoice = async (customerPrimaryKey: string):
    Promise<boolean> => new Promise(async (resolve, reject): Promise<void> => {
    try {
      this.db.collection('tblSalesInvoice', ref => {
        let query: CollectionReference | Query = ref;
        query = query.orderBy('insertDate').limit(1)
          .where('userPrimaryKey', '==', this.authService.getUid())
          .where('customerPrimaryKey', '==', customerPrimaryKey);
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
      reject({code: 401, message: 'You do not have permission or there is a problem about permissions!'});
    }
  })

  isCustomerHasCollection = async (customerPrimaryKey: string):
    Promise<boolean> => new Promise(async (resolve, reject): Promise<void> => {
    try {
      this.db.collection('tblCollection', ref => {
        let query: CollectionReference | Query = ref;
        query = query.orderBy('insertDate').limit(1)
          .where('userPrimaryKey', '==', this.authService.getUid())
          .where('customerPrimaryKey', '==', customerPrimaryKey);
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
      reject({code: 401, message: 'You do not have permission or there is a problem about permissions!'});
    }
  })

  isCustomerHasPurchaseInvoice = async (customerPrimaryKey: string):
    Promise<boolean> => new Promise(async (resolve, reject): Promise<void> => {
    try {
      this.db.collection('tblPurchaseInvoice', ref => {
        let query: CollectionReference | Query = ref;
        query = query.orderBy('insertDate').limit(1)
          .where('userPrimaryKey', '==', this.authService.getUid())
          .where('customerPrimaryKey', '==', customerPrimaryKey);
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
      reject({code: 401, message: 'You do not have permission or there is a problem about permissions!'});
    }
  })

  isCustomerHasPayment = async (customerPrimaryKey: string):
    Promise<boolean> => new Promise(async (resolve, reject): Promise<void> => {
    try {
      this.db.collection('tblPayment', ref => {
        let query: CollectionReference | Query = ref;
        query = query.orderBy('insertDate').limit(1)
          .where('userPrimaryKey', '==', this.authService.getUid())
          .where('customerPrimaryKey', '==', customerPrimaryKey);
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
      reject({code: 401, message: 'You do not have permission or there is a problem about permissions!'});
    }
  })

  getCustomers = async (customerType: string):
    Promise<Array<CustomerModel>> => new Promise(async (resolve, reject): Promise<void> => {
    try {
      const list = Array<CustomerModel>();
      await this.db.collection(this.tableName, ref => {
        let query: CollectionReference | Query = ref;
        query = query.orderBy('name', 'asc')
          .where('userPrimaryKey', '==', this.authService.getUid())
          .where('customerType', '==', customerType);
        return query;
      }).get()
        .subscribe(snapshot => {
          snapshot.forEach(doc => {
            const data = doc.data() as CustomerModel;
            data.primaryKey = doc.id;

            list.push(data);
          });
          resolve(list);
        });

    } catch (error) {
      console.error(error);
      reject({code: 401, message: 'You do not have permission or there is a problem about permissions!'});
    }
  })
}
