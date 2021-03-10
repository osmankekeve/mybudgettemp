import {Injectable} from '@angular/core';
import {AngularFirestore, AngularFirestoreCollection, CollectionReference, Query} from '@angular/fire/firestore';
import {Observable} from 'rxjs/Observable';
import {AuthenticationService} from './authentication.service';
import {CashdeskVoucherModel} from '../models/cashdesk-voucher-model';
import {map, mergeMap} from 'rxjs/operators';
import {combineLatest} from 'rxjs';
import {CashDeskModel} from '../models/cash-desk-model';
import {LogService} from './log.service';
import {SettingService} from './setting.service';
import {CashDeskVoucherMainModel} from '../models/cashdesk-voucher-main-model';
import {CashDeskService} from './cash-desk.service';
import {currencyFormat, getCashDeskVoucherType, getStatus, isNullOrEmpty} from '../core/correct-library';
import {ProfileService} from './profile.service';
import {AccountTransactionService} from './account-transaction.service';
import {ActionService} from './action.service';

@Injectable({
  providedIn: 'root'
})
export class CashDeskVoucherService {
  listCollection: AngularFirestoreCollection<CashdeskVoucherModel>;
  mainList$: Observable<CashDeskVoucherMainModel[]>;
  cashDeskMap = new Map();
  cashDeskVoucherTypeMap = new Map();
  employeeMap = new Map();
  tableName = 'tblCashDeskVoucher';

  constructor(public authService: AuthenticationService, public sService: SettingService, public eService: ProfileService,
              public logService: LogService, public cdService: CashDeskService, public db: AngularFirestore,
              public atService: AccountTransactionService, protected actService: ActionService) {
    this.cdService.getItems().subscribe(list => {
      this.cashDeskMap.clear();
      list.forEach((data: any) => {
        const item = data as CashDeskModel;
        this.cashDeskMap.set(item.primaryKey, item.name);
      });
    });
    this.cashDeskVoucherTypeMap = getCashDeskVoucherType();
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

  async addItem(record: CashDeskVoucherMainModel) {
    return await this.listCollection.add(Object.assign({}, record.data))
      .then(async result => {
        await this.logService.addTransactionLog(record, 'insert', 'cashdeskVoucher');
        await this.sService.increaseCashDeskNumber();
      });
  }

  async removeItem(record: CashDeskVoucherMainModel) {
    return await this.db.collection(this.tableName).doc(record.data.primaryKey).delete()
      .then(async result => {
        this.actService.removeActions(this.tableName, record.data.primaryKey);
        await this.logService.addTransactionLog(record, 'delete', 'cashdeskVoucher');
        if (record.data.status === 'approved') {
          await this.atService.removeItem(null, record.data.primaryKey);
        }
      });
  }

  async updateItem(record: CashDeskVoucherMainModel) {
    return await this.db.collection(this.tableName).doc(record.data.primaryKey).update(Object.assign({}, record.data))
      .then(async value => {
        if (record.data.status === 'approved') {
          let calculatedAmount1 = record.data.transactionType === 'credit' ? record.data.amount : record.data.amount * -1;
          if (record.data.type === 'transfer') { calculatedAmount1 =  calculatedAmount1 * -1; }

          let calculatedAmount2 = record.data.transactionType === 'credit' ? record.data.amount * -1 : record.data.amount;
          if (record.data.type === 'transfer') { calculatedAmount2 =  calculatedAmount2 * -1; }

          const trans = this.atService.clearSubModel();
          trans.primaryKey = '';
          trans.receiptNo = record.data.receiptNo;
          trans.transactionPrimaryKey = record.data.primaryKey;
          trans.transactionType = 'cashDeskVoucher';
          trans.parentPrimaryKey = record.data.firstCashDeskPrimaryKey;
          trans.parentType = 'cashDesk';
          trans.cashDeskPrimaryKey = record.data.type === 'transfer' ? record.data.secondCashDeskPrimaryKey : '-1';
          trans.amount = calculatedAmount1;
          trans.amountType = record.data.transactionType;
          trans.insertDate = record.data.insertDate;
          await this.atService.addItem(trans);

          if (record.data.type === 'transfer') {
            const trans2 = this.atService.clearSubModel();
            trans2.primaryKey = '';
            trans2.receiptNo = record.data.receiptNo;
            trans2.transactionPrimaryKey = record.data.primaryKey;
            trans2.transactionType = 'cashDeskVoucher';
            trans2.parentPrimaryKey = record.data.secondCashDeskPrimaryKey;
            trans2.parentType = 'cashDesk';
            trans2.cashDeskPrimaryKey = record.data.firstCashDeskPrimaryKey;
            trans2.amount = calculatedAmount2;
            trans2.amountType = record.data.transactionType;
            trans2.insertDate = record.data.insertDate;
            await this.atService.addItem(trans2);
          }

          await this.logService.addTransactionLog(record, 'approved', 'cashdeskVoucher');
        } else if (record.data.status === 'rejected') {
          await this.logService.addTransactionLog(record, 'rejected', 'cashdeskVoucher');
        } else {
          await this.logService.addTransactionLog(record, 'update', 'cashdeskVoucher');
        }
      });
  }

  async setItem(record: CashDeskVoucherMainModel, primaryKey: string) {
    return await this.listCollection.doc(primaryKey).set(Object.assign({}, record.data))
      .then(async value => {
        await this.logService.addTransactionLog(record, 'insert', 'cashdeskVoucher');
        await this.sService.increaseCashDeskNumber();

        if (record.data.status === 'approved') {
          let calculatedAmount1 = record.data.transactionType === 'credit' ? record.data.amount : record.data.amount * -1;
          if (record.data.type === 'transfer') { calculatedAmount1 =  calculatedAmount1 * -1; }

          let calculatedAmount2 = record.data.transactionType === 'credit' ? record.data.amount * -1 : record.data.amount;
          if (record.data.type === 'transfer') { calculatedAmount2 =  calculatedAmount2 * -1; }

          const trans = this.atService.clearSubModel();
          trans.primaryKey = '';
          trans.receiptNo = record.data.receiptNo;
          trans.transactionPrimaryKey = record.data.primaryKey;
          trans.transactionType = 'cashDeskVoucher';
          trans.parentPrimaryKey = record.data.firstCashDeskPrimaryKey;
          trans.parentType = 'cashDesk';
          trans.cashDeskPrimaryKey = record.data.type === 'transfer' ? record.data.secondCashDeskPrimaryKey : '-1';
          trans.amount = calculatedAmount1;
          trans.amountType = record.data.transactionType;
          trans.insertDate = record.data.insertDate;
          await this.atService.addItem(trans);

          if (record.data.type === 'transfer') {
            const trans2 = this.atService.clearSubModel();
            trans2.primaryKey = '';
            trans2.receiptNo = record.data.receiptNo;
            trans2.transactionPrimaryKey = record.data.primaryKey;
            trans2.transactionType = 'cashDeskVoucher';
            trans2.parentPrimaryKey = record.data.secondCashDeskPrimaryKey;
            trans2.parentType = 'cashDesk';
            trans2.cashDeskPrimaryKey = record.data.firstCashDeskPrimaryKey;
            trans2.amount = calculatedAmount2;
            trans2.amountType = record.data.transactionType;
            trans2.insertDate = record.data.insertDate;
            await this.atService.addItem(trans2);
          }

          await this.logService.addTransactionLog(record, 'approved', 'cashdeskVoucher');
        } else if (record.data.status === 'rejected') {
          await this.logService.addTransactionLog(record, 'rejected', 'cashdeskVoucher');
        } else {
          // await this.logService.addTransactionLog(record, 'update', 'cashdeskVoucher');
        }
      });
  }

  checkForSave(record: CashDeskVoucherMainModel): Promise<string> {
    return new Promise((resolve, reject) => {
      if (record.data.type === '' || record.data.type === '-1') {
        reject('Lütfen fiş tipi seçiniz.');
      } else if (record.data.transactionType === '' || record.data.transactionType === '-1') {
        reject('Lütfen işlem tipi seçiniz.');
      } else if (record.data.receiptNo === '') {
        reject('Lütfen fiş numarası.');
      } else if (record.data.firstCashDeskPrimaryKey === '') {
        reject('Lütfen ana kasa seçiniz.');
      } else if (record.data.amount <= 0) {
        reject('Tutar sıfırdan büyük olmalıdır.');
      } else if (isNullOrEmpty(record.data.insertDate)) {
        reject('Lütfen kayıt tarihi seçiniz.');
      } else {
        resolve(null);
      }
    });
  }

  checkForRemove(record: CashDeskVoucherMainModel): Promise<string> {
    return new Promise((resolve, reject) => {
      resolve(null);
    });
  }

  checkFields(model: CashdeskVoucherModel): CashdeskVoucherModel {
    const cleanModel = this.clearSubModel();
    if (model.employeePrimaryKey === undefined) {
      model.employeePrimaryKey = '-1';
    }
    if (model.firstCashDeskPrimaryKey === undefined) {
      model.firstCashDeskPrimaryKey = cleanModel.firstCashDeskPrimaryKey;
    }
    if (model.secondCashDeskPrimaryKey === undefined) {
      model.secondCashDeskPrimaryKey = cleanModel.secondCashDeskPrimaryKey;
    }
    if (model.type === undefined) {
      model.type = cleanModel.type;
    }
    if (model.transactionType === undefined) {
      model.transactionType = cleanModel.transactionType;
    }
    if (model.receiptNo === undefined) {
      model.receiptNo = cleanModel.receiptNo;
    }
    if (model.amount === undefined) {
      model.amount = cleanModel.amount;
    }
    if (model.description === undefined) {
      model.description = cleanModel.description;
    }
    if (model.status === undefined) {
      model.status = cleanModel.status;
    }
    if (model.platform === undefined) {
      model.platform = cleanModel.platform;
    }
    if (model.approveByPrimaryKey === undefined) { model.approveByPrimaryKey = model.employeePrimaryKey; }
    if (model.approveDate === undefined) { model.approveDate = model.insertDate; }
    if (model.recordDate === undefined) { model.recordDate = model.insertDate; }

    return model;
  }

  clearSubModel(): CashdeskVoucherModel {

    const returnData = new CashdeskVoucherModel();
    returnData.primaryKey = null;
    returnData.userPrimaryKey = this.authService.getUid();
    returnData.employeePrimaryKey = this.authService.getEid();
    returnData.type = '-1'; // kontrole takılsın istediğim için -1 değeri verdim
    returnData.transactionType = '-1';
    returnData.receiptNo = ''; // kontrole takılmayacak ancak valid kontrolünde olacak
    returnData.firstCashDeskPrimaryKey = '';
    returnData.secondCashDeskPrimaryKey = '';
    returnData.amount = 0;
    returnData.description = '';
    returnData.status = 'waitingForApprove'; // waitingForApprove, approved, rejected
    returnData.approveByPrimaryKey = '-1';
    returnData.approveDate = 0;
    returnData.platform = 'web'; // mobile, web
    returnData.insertDate = Date.now();
    returnData.recordDate = Date.now();

    return returnData;
  }

  clearMainModel(): CashDeskVoucherMainModel {
    const returnData = new CashDeskVoucherMainModel();
    returnData.data = this.clearSubModel();
    returnData.employeeName = this.employeeMap.get(returnData.data.employeePrimaryKey);
    returnData.casDeskName = '';
    returnData.secondCashDeskName = '';
    returnData.actionType = 'added';
    returnData.statusTr = getStatus().get(returnData.data.status);
    returnData.platformTr = returnData.data.platform === 'web' ? 'Web' : 'Mobil';
    returnData.amountFormatted = currencyFormat(returnData.data.amount);
    return returnData;
  }

  getItem(primaryKey: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.collection(this.tableName).doc(primaryKey).get().toPromise().then(doc => {
        if (doc.exists) {
          const data = doc.data() as CashdeskVoucherModel;
          data.primaryKey = doc.id;

          const returnData = new CashDeskVoucherMainModel();
          returnData.data = this.checkFields(data);
          returnData.typeTr = this.cashDeskVoucherTypeMap.get(data.type);
          returnData.casDeskName = this.cashDeskMap.get(data.firstCashDeskPrimaryKey);
          returnData.secondCashDeskName = data.secondCashDeskPrimaryKey === '-1' ?
            '-' : this.cashDeskMap.get(data.secondCashDeskPrimaryKey);
          returnData.amountFormatted = currencyFormat(returnData.data.amount);
          returnData.approverName = this.employeeMap.get(returnData.data.approveByPrimaryKey);
          returnData.statusTr = getStatus().get(returnData.data.status);
          resolve(Object.assign({returnData}));
        } else {
          resolve(null);
        }
      });
    });
  }

  getMainItemsBetweenDates(startDate: Date, endDate: Date, status: string): Observable<CashDeskVoucherMainModel[]> {
    this.listCollection = this.db.collection(this.tableName,
      ref => {
        let query: CollectionReference | Query = ref;
        query = query.orderBy('insertDate').where('userPrimaryKey', '==', this.authService.getUid());
        if (startDate !== null) {
          query = query.startAt(startDate.getTime());
        }
        if (endDate !== null) {
          query = query.endAt(endDate.getTime());
        }
        if (status !== null && status !== '-1') {
          query = query.where('status', '==', status);
        }
        return query;
      });
    this.mainList$ = this.listCollection.stateChanges().pipe(map(changes => {
      return changes.map(change => {
        const data = change.payload.doc.data() as CashdeskVoucherModel;
        data.primaryKey = change.payload.doc.id;

        const returnData = new CashDeskVoucherMainModel();
        returnData.data = this.checkFields(data);
        returnData.typeTr = this.cashDeskVoucherTypeMap.get(data.type);
        returnData.casDeskName = this.cashDeskMap.get(data.firstCashDeskPrimaryKey);
        returnData.secondCashDeskName = data.secondCashDeskPrimaryKey === '-1' ? '-' : this.cashDeskMap.get(data.secondCashDeskPrimaryKey);
        returnData.actionType = change.type;
        returnData.amountFormatted = currencyFormat(returnData.data.amount);
        returnData.approverName = this.employeeMap.get(returnData.data.approveByPrimaryKey);
        returnData.statusTr = getStatus().get(returnData.data.status);

        return this.db.collection('tblCashDesk').doc(data.firstCashDeskPrimaryKey).valueChanges().pipe(map((item: CashDeskModel) => {
          // returnData.casDeskName = item !== undefined ? item.name : 'Belirlenemeyen Kasa Kaydı';
          return Object.assign({returnData});
        }));
      });
    }), mergeMap(feeds => combineLatest(feeds)));
    return this.mainList$;
  }

  getMainItemsBetweenDatesAsPromise = async (startDate: Date, endDate: Date, status: string):
    Promise<Array<CashDeskVoucherMainModel>> => new Promise(async (resolve, reject): Promise<void> => {
    try {
      const list = Array<CashDeskVoucherMainModel>();
      this.db.collection(this.tableName, ref => {
        let query: CollectionReference | Query = ref;
        query = query.orderBy('insertDate').where('userPrimaryKey', '==', this.authService.getUid());
        if (startDate !== null) {
          query = query.startAt(startDate.getTime());
        }
        if (endDate !== null) {
          query = query.endAt(endDate.getTime());
        }
        if (status !== null && status !== '-1') {
          query = query.where('status', '==', status);
        }
        return query;
      })
        .get().subscribe(snapshot => {
        snapshot.forEach(doc => {
          const data = doc.data() as CashdeskVoucherModel;
          data.primaryKey = doc.id;

          const returnData = new CashDeskVoucherMainModel();
          returnData.data = this.checkFields(data);
          returnData.typeTr = this.cashDeskVoucherTypeMap.get(data.type);
          returnData.casDeskName = this.cashDeskMap.get(data.firstCashDeskPrimaryKey);
          returnData.secondCashDeskName = data.secondCashDeskPrimaryKey === '-1' ? '-' :
            this.cashDeskMap.get(data.secondCashDeskPrimaryKey);
          returnData.actionType = 'added';
          returnData.amountFormatted = currencyFormat(returnData.data.amount);
          returnData.approverName = this.employeeMap.get(returnData.data.approveByPrimaryKey);
          returnData.statusTr = getStatus().get(returnData.data.status);

          list.push(returnData);
        });
        resolve(list);
      });

    } catch (error) {
      console.error(error);
      reject({message: 'Error: ' + error});
    }
  })
}
