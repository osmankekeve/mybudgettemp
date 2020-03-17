import {Injectable} from '@angular/core';
import {AngularFirestore, AngularFirestoreCollection, CollectionReference, Query} from '@angular/fire/firestore';
import {Observable} from 'rxjs/Observable';
import {CustomerModel} from '../models/customer-model';
import {map, flatMap, startWith} from 'rxjs/operators';
import {combineLatest} from 'rxjs';
import {PaymentModel} from '../models/payment-model';
import {AuthenticationService} from './authentication.service';
import {LogService} from './log.service';
import {SettingService} from './setting.service';
import {PaymentMainModel} from '../models/payment-main-model';
import {ProfileService} from './profile.service';
import {currencyFormat, getString} from '../core/correct-library';
import {CustomerService} from './customer.service';
import {CollectionModel} from '../models/collection-model';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  listCollection: AngularFirestoreCollection<PaymentModel>;
  mainList$: Observable<PaymentMainModel[]>;
  customerList$: Observable<CustomerModel[]>;
  employeeMap = new Map();
  customerMap = new Map();
  tableName = 'tblPayment';

  constructor(public authService: AuthenticationService, public sService: SettingService, public cusService: CustomerService,
              public logService: LogService, public eService: ProfileService, public db: AngularFirestore) {
    if (this.authService.isUserLoggedIn()) {
      this.eService.getItems().subscribe(list => {
        this.employeeMap.clear();
        this.employeeMap.set('-1', 'Tüm Kullanıcılar');
        list.forEach(item => {
          this.employeeMap.set(item.primaryKey, item.longName);
        });
      });
      this.cusService.getAllItems().subscribe(list => {
        this.customerMap.clear();
        list.forEach(item => {
          this.customerMap.set(item.primaryKey, item);
        });
      });
    }
  }

  async addItem(record: PaymentMainModel) {
    await this.logService.sendToLog(record, 'insert', 'payment');
    await this.sService.increasePaymentNumber();
    return await this.listCollection.add(Object.assign({}, record.data));
  }

  async removeItem(record: PaymentMainModel) {
    /* this.db.firestore.runTransaction(t => {
        return t.get(sfDocRef).then(doc => {
          const newValue = doc.data().value;
        }).then().catch(err => console.error(err));
      }); */

    await this.logService.sendToLog(record, 'delete', 'payment');
    return await this.db.collection(this.tableName).doc(record.data.primaryKey).delete();
  }

  async updateItem(record: PaymentMainModel) {
    await this.logService.sendToLog(record, 'update', 'payment');
    return await this.db.collection(this.tableName).doc(record.data.primaryKey).update(Object.assign({}, record.data));
  }

  async setItem(record: PaymentMainModel, primaryKey: string) {
    await this.logService.sendToLog(record, 'insert', 'payment');
    await this.sService.increasePaymentNumber();
    return await this.listCollection.doc(primaryKey).set(Object.assign({}, record.data));
  }

  clearSubModel(): PaymentModel {

    const returnData = new PaymentModel();
    returnData.primaryKey = null;
    returnData.userPrimaryKey = this.authService.getUid();
    returnData.employeePrimaryKey = this.authService.getEid();
    returnData.customerCode = '-1';
    returnData.type = '-1';
    returnData.accountPrimaryKey = '-1';
    returnData.receiptNo = '';
    returnData.cashDeskPrimaryKey = '';
    returnData.description = '';
    returnData.amount = 0;
    returnData.insertDate = Date.now();

    return returnData;
  }

  clearMainModel(): PaymentMainModel {
    const returnData = new PaymentMainModel();
    returnData.data = this.clearSubModel();
    returnData.customerName = '';
    returnData.employeeName = this.employeeMap.get(returnData.data.employeePrimaryKey);
    returnData.actionType = 'added';
    returnData.amountFormatted = currencyFormat(returnData.data.amount);
    return returnData;
  }

  checkFields(model: PaymentModel): PaymentModel {
    const cleanModel = this.clearSubModel();
    if (model.employeePrimaryKey === undefined) { model.employeePrimaryKey = '-1'; }
    if (model.customerCode === undefined) { model.customerCode = cleanModel.customerCode; }
    if (model.accountPrimaryKey === undefined) { model.accountPrimaryKey = cleanModel.accountPrimaryKey; }
    if (model.cashDeskPrimaryKey === undefined) { model.cashDeskPrimaryKey = cleanModel.cashDeskPrimaryKey; }
    if (model.type === undefined) { model.type = cleanModel.type; }
    if (model.receiptNo === undefined) { model.receiptNo = cleanModel.receiptNo; }
    if (model.description === undefined) { model.description = cleanModel.description; }
    if (model.amount === undefined) { model.amount = cleanModel.amount; }

    return model;
  }

  getItem(primaryKey: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.collection(this.tableName).doc(primaryKey).get().toPromise().then(doc => {
        if (doc.exists) {
          const data = doc.data() as PaymentModel;
          data.primaryKey = doc.id;

          const returnData = new PaymentMainModel();
          returnData.data = this.checkFields(data);
          returnData.employeeName = this.employeeMap.get(getString(returnData.data.employeePrimaryKey));
          returnData.amountFormatted = currencyFormat(returnData.data.amount);

          Promise.all([this.cusService.getItem(returnData.data.customerCode)])
            .then((values: any) => {
              if (values[0] !== undefined || values[0] !== null) {
                returnData.customer = values[0] as CustomerModel;
              }
            });

          resolve(Object.assign({returnData}));
        } else {
          resolve(null);
        }
      });
    });
  }

  getCustomerItems(customerCode: string): Observable<PaymentMainModel[]> {
    this.listCollection = this.db.collection(this.tableName,
      ref => ref.where('customerCode', '==', customerCode));
    this.mainList$ = this.listCollection.stateChanges().pipe(
      map(changes =>
        changes.map(c => {
          const data = c.payload.doc.data() as PaymentModel;
          data.primaryKey = c.payload.doc.id;

          const returnData = new PaymentMainModel();
          returnData.data = this.checkFields(data);
          returnData.actionType = c.type;
          returnData.employeeName = this.employeeMap.get(returnData.data.employeePrimaryKey);
          returnData.amountFormatted = currencyFormat(returnData.data.amount);
          return Object.assign({returnData});
        })
      )
    );
    return this.mainList$;
  }

  getMainItems(): Observable<PaymentMainModel[]> {
    this.listCollection = this.db.collection(this.tableName,
      ref => ref.orderBy('insertDate').where('userPrimaryKey', '==', this.authService.getUid()));
    this.mainList$ = this.listCollection.stateChanges().pipe(map(changes => {
      return changes.map(change => {
        const data = change.payload.doc.data() as PaymentModel;
        data.primaryKey = change.payload.doc.id;

        const returnData = new PaymentMainModel();
        returnData.data = this.checkFields(data);
        returnData.actionType = change.type;
        returnData.employeeName = this.employeeMap.get(returnData.data.employeePrimaryKey);
        returnData.amountFormatted = currencyFormat(returnData.data.amount);

        return this.db.collection('tblCustomer').doc(data.customerCode).valueChanges()
          .pipe(map((customer: CustomerModel) => {
            returnData.customer = customer !== undefined ? customer : undefined;
            returnData.customerName = customer !== undefined ? customer.name : 'Belirlenemeyen Müşteri Kaydı';
            return Object.assign({returnData}); }));
      });
    }), flatMap(feeds => combineLatest(feeds)));
    return this.mainList$;
  }

  getMainItemsBetweenDates(startDate: Date, endDate: Date): Observable<PaymentMainModel[]> {
    this.listCollection = this.db.collection(this.tableName,
      ref => ref.orderBy('insertDate').startAt(startDate.getTime()).endAt(endDate.getTime())
        .where('userPrimaryKey', '==', this.authService.getUid()));
    this.mainList$ = this.listCollection.stateChanges().pipe(map(changes => {
      return changes.map(change => {
        const data = change.payload.doc.data() as PaymentModel;
        data.primaryKey = change.payload.doc.id;

        const returnData = new PaymentMainModel();
        returnData.data = this.checkFields(data);
        returnData.actionType = change.type;
        returnData.employeeName = this.employeeMap.get(returnData.data.employeePrimaryKey);
        returnData.amountFormatted = currencyFormat(returnData.data.amount);

        return this.db.collection('tblCustomer').doc(data.customerCode).valueChanges()
          .pipe(map((customer: CustomerModel) => {
            returnData.customer = customer !== undefined ? customer : undefined;
            returnData.customerName = customer !== undefined ? customer.name : 'Belirlenemeyen Müşteri Kaydı';
            return Object.assign({returnData}); }));
      });
    }), flatMap(feeds => combineLatest(feeds)));
    return this.mainList$;
  }

  getMainItemsBetweenDatesWithCustomer(startDate: Date, endDate: Date, customerPrimaryKey: any): Observable<PaymentMainModel[]> {
    this.listCollection = this.db.collection(this.tableName, ref => {
      let query: CollectionReference | Query = ref;
      query = query.orderBy('insertDate').startAt(startDate.getTime()).endAt(endDate.getTime())
        .where('userPrimaryKey', '==', this.authService.getUid());
      if (customerPrimaryKey !== '-1') {
        query = query.where('customerCode', '==', customerPrimaryKey);
      }
      return query;
    });
    this.mainList$ = this.listCollection.stateChanges().pipe(map(changes => {
      return changes.map(change => {
        const data = change.payload.doc.data() as PaymentModel;
        data.primaryKey = change.payload.doc.id;

        const returnData = new PaymentMainModel();
        returnData.data = this.checkFields(data);
        returnData.actionType = change.type;
        returnData.employeeName = this.employeeMap.get(returnData.data.employeePrimaryKey);
        returnData.amountFormatted = currencyFormat(returnData.data.amount);

        return this.db.collection('tblCustomer').doc(data.customerCode).valueChanges()
          .pipe(map((customer: CustomerModel) => {
            returnData.customer = customer !== undefined ? customer : undefined;
            returnData.customerName = customer !== undefined ? customer.name : 'Belirlenemeyen Müşteri Kaydı';
            return Object.assign({returnData}); }));
      });
    }), flatMap(feeds => combineLatest(feeds)));
    return this.mainList$;
  }

  getMainItemsBetweenDatesAsPromise = async (startDate: Date, endDate: Date):
    Promise<Array<PaymentMainModel>> => new Promise(async (resolve, reject): Promise<void> => {
    try {
      const list = Array<PaymentMainModel>();
      this.db.collection(this.tableName, ref =>
        ref.orderBy('insertDate').startAt(startDate.getTime()).endAt(endDate.getTime()))
        .get().subscribe(snapshot => {
        snapshot.forEach(doc => {
          const data = doc.data() as PaymentModel;
          data.primaryKey = doc.id;

          const returnData = new PaymentMainModel();
          returnData.data = this.checkFields(data);
          returnData.actionType = 'added';
          returnData.customer = this.customerMap.get(returnData.data.customerCode);

          list.push(returnData);
        });
        resolve(list);
      });

    } catch (error) {
      console.error(error);
      reject({code: 401, message: 'You do not have permission or there is a problem about permissions!'});
    }
  })
}
