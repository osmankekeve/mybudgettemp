import {Injectable} from '@angular/core';
import {AngularFirestore, AngularFirestoreCollection, CollectionReference, Query} from '@angular/fire/firestore';
import {Observable} from 'rxjs/Observable';
import {map, flatMap} from 'rxjs/operators';
import {combineLatest} from 'rxjs';
import {AuthenticationService} from './authentication.service';
import {CustomerModel} from '../models/customer-model';
import {MailModel} from '../models/mail-model';
import {PaymentModel} from '../models/payment-model';
import {PaymentMainModel} from '../models/payment-main-model';
import {AccountVoucherMainModel} from '../models/account-voucher-main-model';
import {MailMainModel} from '../models/mail-main-model';
import {getCashDeskVoucherType, getMailParents, getString} from '../core/correct-library';
import {LogService} from './log.service';
import {ProfileService} from './profile.service';
import {ProfileModel} from '../models/profile-model';

@Injectable({
  providedIn: 'root'
})
export class MailService {
  listCollection: AngularFirestoreCollection<MailModel>;
  mainList$: Observable<MailMainModel[]>;
  tableName = 'tblMail';
  employeeMap = new Map();
  mailParentList = getMailParents();

  constructor(public authService: AuthenticationService, public eService: ProfileService, public logService: LogService,
              public db: AngularFirestore) {
    if (this.authService.isUserLoggedIn()) {
      this.eService.getItems().subscribe(list => {
        this.employeeMap.clear();
        this.employeeMap.set('-1', 'Tüm Kullanıcılar');
        list.forEach(item => {
          this.employeeMap.set(item.primaryKey, item.longName);
        });
      });
    }
  }

  async addItem(record: MailMainModel) {
    await this.logService.sendToLog(record, 'insert', 'mail');
    return await this.listCollection.add(Object.assign({}, record.data));
  }

  async removeItem(record: MailMainModel) {
    return await this.db.collection(this.tableName).doc(record.data.primaryKey).delete();
  }

  async updateItem(record: MailMainModel) {
    await this.logService.sendToLog(record, 'update', 'mail');
    return await this.db.collection(this.tableName).doc(record.data.primaryKey).update(Object.assign({}, record.data));
  }

  clearSubModel(): MailModel {

    const returnData = new MailModel();
    returnData.primaryKey = null;
    returnData.userPrimaryKey = this.authService.getUid();
    returnData.employeePrimaryKey = this.authService.getEid();
    returnData.parentType = 'anyone';  // anyone, customer, employee
    returnData.parentPrimaryKey = '-1';  // customer, employee primaryKey
    returnData.mailTo = '';
    returnData.subject = '';
    returnData.content = '';
    returnData.html = '';
    returnData.isSend = true;
    returnData.insertDate = Date.now();

    return returnData;
  }

  clearMainModel(): MailMainModel {
    const returnData = new MailMainModel();
    returnData.data = this.clearSubModel();
    returnData.customerName = '';
    returnData.employeeName = this.employeeMap.get(returnData.data.employeePrimaryKey);
    returnData.parentTypeTr = this.mailParentList.get(returnData.data.parentType);
    returnData.actionType = 'added';
    returnData.isSendTr = returnData.data.isSend === true ? 'Gönderildi' : 'Gönderilmedi';
    return returnData;
  }

  getItem(primaryKey: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.collection(this.tableName).doc(primaryKey).get().toPromise().then(doc => {
        if (doc.exists) {
          const data = doc.data() as MailModel;
          data.primaryKey = doc.id;

          const returnData = new MailMainModel();
          returnData.data = data;
          returnData.employeeName = this.employeeMap.get(getString(returnData.data.employeePrimaryKey));
          returnData.parentTypeTr = this.mailParentList.get(returnData.data.parentType);
          returnData.isSendTr = returnData.data.isSend === true ? 'Gönderildi' : 'Gönderilmedi';
          resolve(Object.assign({returnData}));

          resolve(Object.assign({data}));
        } else {
          resolve(null);
        }
      });
    });
  }

  getMainItems(): Observable<MailModel[]> {
    this.listCollection = this.db.collection(this.tableName,
      ref => ref.where('userPrimaryKey', '==', this.authService.getUid()));
    this.mainList$ = this.listCollection.stateChanges().pipe(map(changes => {
      return changes.map(change => {
        const data = change.payload.doc.data() as MailModel;
        data.primaryKey = change.payload.doc.id;

        const returnData = new MailMainModel();
        returnData.actionType = change.type;
        returnData.data = data;
        returnData.employeeName = this.employeeMap.get(getString(returnData.data.employeePrimaryKey));
        returnData.parentTypeTr = this.mailParentList.get(returnData.data.parentType);
        returnData.isSendTr = returnData.data.isSend === true ? 'Gönderildi' : 'Gönderilmedi';

        return this.db.collection('tblCustomer').doc('-1').valueChanges()
          .pipe(map((customer: CustomerModel) => {
            returnData.customerName = customer !== undefined ? customer.name : 'Belirlenemeyen Müşteri Kaydı';
            return Object.assign({returnData});
          }));
      });
    }), flatMap(feeds => combineLatest(feeds)));
    return this.mainList$;
  }

  getMainItemsBetweenDates(startDate: Date, endDate: Date): Observable<MailModel[]> {
    this.listCollection = this.db.collection(this.tableName, ref => {
      let query: CollectionReference | Query = ref;
      query = query.orderBy('insertDate').startAt(startDate.getTime()).endAt(endDate.getTime())
        .where('userPrimaryKey', '==', this.authService.getUid());
      return query;
    });
    this.mainList$ = this.listCollection.stateChanges().pipe(map(changes => {
      return changes.map(change => {
        const data = change.payload.doc.data() as MailModel;
        data.primaryKey = change.payload.doc.id;

        const returnData = new MailMainModel();
        returnData.actionType = change.type;
        returnData.data = data;
        returnData.parentTypeTr = this.mailParentList.get(returnData.data.parentType);
        returnData.employeeName = this.employeeMap.get(getString(returnData.data.employeePrimaryKey));
        returnData.isSendTr = returnData.data.isSend === true ? 'Gönderildi' : 'Gönderilmedi';
        if (returnData.data.parentType === 'customer') {
          return this.db.collection('tblCustomer').doc(returnData.data.parentPrimaryKey).valueChanges()
            .pipe(map((customer: CustomerModel) => {
              returnData.customerName = customer !== undefined ? customer.name : 'Belirlenemeyen Müşteri Kaydı';
              return Object.assign({returnData});
            }));
        } else {
          return this.db.collection('tblProfile').doc(returnData.data.parentPrimaryKey).valueChanges()
            .pipe(map((profile: ProfileModel) => {
              returnData.customerName = profile !== undefined ? profile.longName : returnData.data.mailTo;
              return Object.assign({returnData});
            }));
        }
      });
    }), flatMap(feeds => combineLatest(feeds)));
    return this.mainList$;
  }

  getCustomerItems(customerPrimaryKey: any): Observable<MailMainModel[]> {
    this.listCollection = this.db.collection(this.tableName, ref => {
      let query: CollectionReference | Query = ref;
      query = query.orderBy('insertDate')
        .where('userPrimaryKey', '==', this.authService.getUid())
        .where('parentType', '==', 'customer');
      if (customerPrimaryKey !== '-1') { query = query.where('parentPrimaryKey', '==', customerPrimaryKey); }
      return query;
    });
    this.mainList$ = this.listCollection.stateChanges().pipe(map(changes => {
      return changes.map(change => {
        const data = change.payload.doc.data() as MailModel;
        data.primaryKey = change.payload.doc.id;

        const returnData = new MailMainModel();
        returnData.actionType = change.type;
        returnData.data = data;
        returnData.employeeName = this.employeeMap.get(getString(returnData.data.employeePrimaryKey));
        returnData.parentTypeTr = this.mailParentList.get(returnData.data.parentType);
        returnData.isSendTr = returnData.data.isSend === true ? 'Gönderildi' : 'Gönderilmedi';

        return this.db.collection('tblCustomer').doc(returnData.data.parentPrimaryKey).valueChanges()
          .pipe(map((customer: CustomerModel) => {
            returnData.customerName = customer !== undefined ? customer.name : 'Belirlenemeyen Müşteri Kaydı';
            return Object.assign({returnData});
          }));
      });
    }), flatMap(feeds => combineLatest(feeds)));
    return this.mainList$;
  }

}
