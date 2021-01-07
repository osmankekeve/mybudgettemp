import { Injectable } from '@angular/core';
import 'rxjs-compat/add/observable/of';
import 'rxjs-compat/add/operator/combineLatest';
import 'rxjs-compat/add/observable/combineLatest';
import 'rxjs-compat/add/observable/from';
import 'rxjs-compat/add/operator/merge';
import {
  AngularFirestore,
  AngularFirestoreCollection
} from '@angular/fire/firestore';
import { Observable } from 'rxjs/internal/Observable';
import { AuthenticationService } from './authentication.service';
import {LogService} from './log.service';
import {ProfileService} from './profile.service';
import {SettingService} from './setting.service';
import {DefinitionService} from './definition.service';
import {CompanyModel} from '../models/company-model';

@Injectable({
  providedIn: 'root'
})
export class CompanyService {

  listCollection: AngularFirestoreCollection<CompanyModel>;
  mainList$: Observable<CompanyModel[]>;
  tableName = 'tblCompany';

  constructor(public authService: AuthenticationService, public eService: ProfileService, public db: AngularFirestore,
              public sService: SettingService, public logService: LogService, protected defService: DefinitionService) {
  }

  async addItem(record: CompanyModel) {
    return await this.db.firestore.collection(this.tableName).doc(record.primaryKey).set(Object.assign({}, record));
  }

  async setItem(record: CompanyModel, primaryKey: string) {
    return await this.db.firestore.collection(this.tableName).doc(primaryKey).set(Object.assign({}, record));
  }

  async removeItem(record: CompanyModel) {
    return await this.db.firestore.collection(this.tableName).doc(record.primaryKey).delete();
  }

  async updateItem(record: CompanyModel) {
    return await this.db.firestore.collection(this.tableName).doc(record.primaryKey).set(Object.assign({}, record));
  }

  checkForSave(record: CompanyModel): Promise<string> {
    return new Promise((resolve, reject) => {
      if (record.companyName.trim() === '') {
        reject('Lüfen firma adı giriniz.');
      } else if (record.companyOwner.trim() === '') {
        reject('Lüfen firma sahibi giriniz.');
      } else if (record.companyOwnerMailAddress.trim() === '') {
        reject('Lüfen firma sahibi mail giriniz.');
      } else {
        resolve(null);
      }
    });
  }

  checkForRemove(record: CompanyModel): Promise<string> {
    return new Promise(async (resolve, reject) => {
      resolve(null);
    });
  }

  checkFields(model: CompanyModel): CompanyModel {
    const cleanModel = this.clearModel();
    return model;
  }

  clearModel(): CompanyModel {

    const returnData = new CompanyModel();
    returnData.primaryKey = null;
    returnData.companyName = '';
    returnData.companyOwner = '';
    returnData.companyOwnerMailAddress = '';
    returnData.companyManager = '';
    returnData.companyManagerMailAddress = '';
    returnData.companyMailAddress = '';
    returnData.address = '';
    returnData.telephone = '';
    returnData.fax = '';
    returnData.taxOffice = '';
    returnData.taxNumber = '';
    returnData.isActive = true;
    returnData.imgUrl = '../../assets/images/default-product-image.png';

    return returnData;
  }

  getItem(primaryKey: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.collection(this.tableName).doc(primaryKey).get().toPromise().then(doc => {
        if (doc.exists) {
          const data = doc.data() as CompanyModel;
          data.primaryKey = doc.id;
          resolve(Object.assign({data}));
        } else {
          reject();
        }
      });
    });
  }
}
