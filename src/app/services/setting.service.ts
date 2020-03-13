import {Injectable} from '@angular/core';
import {AngularFirestore, AngularFirestoreCollection} from '@angular/fire/firestore';
import {Observable} from 'rxjs/Observable';
import {AuthenticationService} from './authentication.service';
import {NoteModel} from '../models/note-model';
import {SettingModel} from '../models/setting-model';
import {getNumber, getString, padLeft} from '../core/correct-library';
import {LogModel} from '../models/log-model';
import {CollectionModel} from '../models/collection-model';

@Injectable({
  providedIn: 'root'
})
export class SettingService {
  listCollection: AngularFirestoreCollection<SettingModel>;
  mainList$: Observable<SettingModel[]>;
  tableName = 'tblSetting';

  constructor(public authService: AuthenticationService,
              public db: AngularFirestore) {

  }

  getAllItems(): Observable<SettingModel[]> {
    this.listCollection = this.db.collection<SettingModel>(this.tableName)
      .doc(this.authService.getUid())
      .collection('settings');
    this.mainList$ = this.listCollection.valueChanges();
    return this.mainList$;
  }

  cleanModel(): SettingModel {
    const returnData = new SettingModel();
    returnData.key = '';
    returnData.value = '';
    returnData.valueBool = false;
    returnData.valueNumber = 0;

    return returnData;
  }

  async setItem(record: SettingModel) {
    return await this.db.collection(this.tableName)
      .doc(this.authService.getUid())
      .collection('settings')
      .doc(record.key)
      .set(Object.assign({}, record));
  }

  async getItem(key: string): Promise<SettingModel> {
    return new Promise((resolve, reject) => {
      this.db.collection(this.tableName).doc(this.authService.getUid())
        .collection('settings').doc(key).get().toPromise().then(doc => {
        if (doc.exists) {
          const data = doc.data() as NoteModel;
          data.primaryKey = doc.id;
          resolve(Object.assign({data}));
        } else {
          resolve(null);
        }
      });
    });
  }

  async getPurchaseInvoiceCode(): Promise<any> {
    return new Promise((resolve, reject) => {
      const purchaseInvoicePrefix = this.getItem('purchaseInvoicePrefix');
      const purchaseInvoiceNumber = this.getItem('purchaseInvoiceNumber');
      const purchaseInvoiceSuffix = this.getItem('purchaseInvoiceSuffix');
      const purchaseInvoiceLength = this.getItem('purchaseInvoiceLength');
      Promise.all([purchaseInvoicePrefix, purchaseInvoiceNumber, purchaseInvoiceSuffix, purchaseInvoiceLength])
        .then((values: any) => {
          const prefix = values[0].data as SettingModel;
          const numb = values[1].data as SettingModel;
          const suffix = values[2].data as SettingModel;
          const length = values[3].data as SettingModel;
          if (numb.value !== '') {
            const returnData = prefix.value + padLeft(numb.value, getNumber(length.value)) + suffix.value;
            resolve(returnData);
          } else {
            resolve(null);
          }
        });
    });
  }

  async getPaymentCode(): Promise<any> {
    return new Promise((resolve, reject) => {
      const paymentPrefix = this.getItem('paymentPrefix');
      const paymentNumber = this.getItem('paymentNumber');
      const paymentSuffix = this.getItem('paymentSuffix');
      const paymentLength = this.getItem('paymentLength');
      Promise.all([paymentPrefix, paymentNumber, paymentSuffix, paymentLength])
        .then((values: any) => {
          const prefix = values[0].data as SettingModel;
          const numb = values[1].data as SettingModel;
          const suffix = values[2].data as SettingModel;
          const length = values[3].data as SettingModel;
          if (numb.value !== '') {
            const returnData = prefix.value + padLeft(numb.value, getNumber(length.value)) + suffix.value;
            resolve(returnData);
          } else {
            resolve(null);
          }
        });
    });
  }

  async getSalesInvoiceCode(): Promise<any> {
    return new Promise((resolve, reject) => {
      const salesInvoicePrefix = this.getItem('salesInvoicePrefix');
      const salesInvoiceNumber = this.getItem('salesInvoiceNumber');
      const salesInvoiceSuffix = this.getItem('salesInvoiceSuffix');
      const salesInvoiceLength = this.getItem('salesInvoiceLength');
      Promise.all([salesInvoicePrefix, salesInvoiceNumber, salesInvoiceSuffix, salesInvoiceLength])
        .then((values: any) => {
          const prefix = values[0].data as SettingModel;
          const numb = values[1].data as SettingModel;
          const suffix = values[2].data as SettingModel;
          const length = values[3].data as SettingModel;
          if (numb.value !== '') {
            const returnData = prefix.value + padLeft(numb.value, getNumber(length.value)) + suffix.value;
            resolve(returnData);
          } else {
            resolve(null);
          }
        });
    });
  }

  async getCollectionCode(): Promise<any> {
    return new Promise((resolve, reject) => {
      const collectionPrefix = this.getItem('collectionPrefix');
      const collectionNumber = this.getItem('collectionNumber');
      const collectionSuffix = this.getItem('collectionSuffix');
      const collectionLength = this.getItem('collectionLength');
      Promise.all([collectionPrefix, collectionNumber, collectionSuffix, collectionLength])
        .then((values: any) => {
          const prefix = values[0].data as SettingModel;
          const numb = values[1].data as SettingModel;
          const suffix = values[2].data as SettingModel;
          const length = values[3].data as SettingModel;
          if (numb.value !== '') {
            const returnData = prefix.value + padLeft(numb.value, getNumber(length.value)) + suffix.value;
            resolve(returnData);
          } else {
            resolve(null);
          }
        });
    });
  }

  async getAccountVoucherCode(): Promise<any> {
    return new Promise((resolve, reject) => {
      const accountVoucherPrefix = this.getItem('accountVoucherPrefix');
      const accountVoucherNumber = this.getItem('accountVoucherNumber');
      const accountVoucherSuffix = this.getItem('accountVoucherSuffix');
      const accountVoucherLength = this.getItem('accountVoucherLength');
      Promise.all([accountVoucherPrefix, accountVoucherNumber, accountVoucherSuffix, accountVoucherLength])
        .then((values: any) => {
          const prefix = values[0].data as SettingModel;
          const numb = values[1].data as SettingModel;
          const suffix = values[2].data as SettingModel;
          const length = values[3].data as SettingModel;
          if (numb.value !== '') {
            const returnData = prefix.value + padLeft(numb.value, getNumber(length.value)) + suffix.value;
            resolve(returnData);
          } else {
            resolve(null);
          }
        });
    });
  }

  async getCashDeskVoucherCode(): Promise<any> {
    return new Promise((resolve, reject) => {
      const cashDeskPrefix = this.getItem('cashDeskVoucherPrefix');
      const cashDeskNumber = this.getItem('cashDeskVoucherNumber');
      const cashDeskSuffix = this.getItem('cashDeskVoucherSuffix');
      const cashDeskLength = this.getItem('cashDeskVoucherLength');
      Promise.all([cashDeskPrefix, cashDeskNumber, cashDeskSuffix, cashDeskLength])
        .then((values: any) => {
          const prefix = values[0].data as SettingModel;
          const numb = values[1].data as SettingModel;
          const suffix = values[2].data as SettingModel;
          const length = values[3].data as SettingModel;
          if (numb.value !== '') {
            const returnData = prefix.value + padLeft(numb.value, getNumber(length.value)) + suffix.value;
            resolve(returnData);
          } else {
            resolve(null);
          }
        });
    });
  }

  async increasePurchaseInvoiceNumber() {
    const purchaseInvoiceNumber = this.getItem('purchaseInvoiceNumber');
    Promise.all([ purchaseInvoiceNumber])
      .then((values: any) => {
        const numb = values[0].data as SettingModel;
        return this.setItem({
          key: 'purchaseInvoiceNumber',
          value: getString(getNumber(numb.value) + 1),
          valueBool: false,
          valueNumber: 0
        });
      });
  }

  async increasePaymentNumber() {
    const paymentNumber = this.getItem('paymentNumber');
    Promise.all([ paymentNumber])
      .then((values: any) => {
        const numb = values[0].data as SettingModel;
        return this.setItem({
          key: 'paymentNumber',
          value: getString(getNumber(numb.value) + 1),
          valueBool: false, valueNumber: 0
        });
      });
  }

  async increaseSalesInvoiceNumber() {
    const salesInvoiceNumber = this.getItem('salesInvoiceNumber');
    Promise.all([ salesInvoiceNumber])
      .then((values: any) => {
        const numb = values[0].data as SettingModel;
        return this.setItem({
          key: 'salesInvoiceNumber',
          value: getString(getNumber(numb.value) + 1),
          valueBool: false,
          valueNumber: 0
        });
      });
  }

  async increaseCollectionNumber() {
    const collectionNumber = this.getItem('collectionNumber');
    Promise.all([ collectionNumber])
      .then((values: any) => {
        const numb = values[0].data as SettingModel;
        return this.setItem({
          key: 'collectionNumber',
          value: getString(getNumber(numb.value) + 1),
          valueBool: false,
          valueNumber: 0
        });
      });
  }

  async increaseAccountVoucherNumber() {
    const accountVoucherNumber = this.getItem('accountVoucherNumber');
    Promise.all([ accountVoucherNumber])
      .then((values: any) => {
        const numb = values[0].data as SettingModel;
        return this.setItem({
          key: 'accountVoucherNumber',
          value: getString(getNumber(numb.value) + 1),
          valueBool: false,
          valueNumber: 0
        });
      });
  }

  async increaseCashDeskNumber() {
    const cashDeskVoucherNumber = this.getItem('cashDeskVoucherNumber');
    Promise.all([ cashDeskVoucherNumber])
      .then((values: any) => {
        const numb = values[0].data as SettingModel;
        return this.setItem({
          key: 'cashDeskVoucherNumber',
          value: getString(getNumber(numb.value) + 1),
          valueBool: false,
          valueNumber: 0
        });
      });
  }

}
