import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { Observable } from 'rxjs/Observable';
import { map, flatMap } from 'rxjs/operators';
import { combineLatest } from 'rxjs';
import { AuthenticationService } from './authentication.service';
import { NoteModel } from '../models/note-model';
import {SettingModel} from '../models/setting-model';
import {VisitMainModel} from "../models/visit-main-model";
import {VisitModel} from "../models/visit-model";
import {CustomerModel} from "../models/customer-model";

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
      Promise.all([purchaseInvoicePrefix, purchaseInvoiceNumber, purchaseInvoiceSuffix]).then(values => {
        console.log(values);
        console.log(values[0].value);
        if (values[0].data.value !== '') {

        }
      });

    });
  }

}
