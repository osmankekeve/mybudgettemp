import { Injectable } from '@angular/core';
import {AngularFirestore, AngularFirestoreCollection, CollectionReference, Query} from '@angular/fire/firestore';
import { Observable } from 'rxjs/Observable';
import { map, flatMap } from 'rxjs/operators';
import { combineLatest } from 'rxjs';
import { AuthenticationService } from './authentication.service';
import { ProfileModel } from '../models/profile-model';
import { CustomerModel } from '../models/customer-model';
import { ProfileMainModel } from '../models/profile-main-model';
import {CollectionModel} from '../models/collection-model';
import {getUserTypes} from '../core/correct-library';
import {CashDeskModel} from '../models/cash-desk-model';
import {CashDeskMainModel} from '../models/cash-desk-main-model';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  listCollection: AngularFirestoreCollection<ProfileModel>;
  mainList$: Observable<ProfileMainModel[]>;
  mainList2$: Observable<ProfileModel[]>;
  tableName = 'tblProfile';
  typeMap = new Map([['admin', 'Administrator'], ['manager', 'Yönetici'], ['user', 'Kullanıcı']]);

  constructor(public authService: AuthenticationService,
              public db: AngularFirestore) {

  }

  async addItem(record: ProfileMainModel) {
    return await this.listCollection.add(Object.assign({}, record.data));
  }

  async removeItem(record: ProfileMainModel) {
    return await this.db.collection(this.tableName).doc(record.data.primaryKey).delete();
  }

  async updateItem(record: ProfileMainModel) {
    return await this.db.collection(this.tableName).doc(record.data.primaryKey).update(Object.assign({}, record.data));
  }

  checkForSave(record: ProfileMainModel): Promise<string> {
    return new Promise((resolve, reject) => {
      if (record.data.longName.trim() === '') {
        reject('Lüfen ad/soyad giriniz.');
      } else if (record.data.password.trim() === '') {
        reject('Lüfen şifre giriniz.');
      } else if (record.data.mailAddress.trim() === '') {
        reject('Lüfen mail adresi giriniz.');
      } else if (record.data.phone.trim() === '') {
        reject('Lüfen telefon giriniz.');
      } else {
        resolve(null);
      }
    });
  }

  checkForRemove(record: ProfileMainModel): Promise<string> {
    return new Promise(async (resolve, reject) => {
      await this.isCustomerHasSalesInvoice(record.data.primaryKey).then(result => {
        if (result) {
          reject('Personele ait satış faturası olduğundan silinemez.');
        }
      });
      await this.isCustomerHasCollection(record.data.primaryKey).then(result => {
        if (result) {
          reject('Personele ait tahsilat olduğundan silinemez.');
        }
      });
      await this.isCustomerHasPurchaseInvoice(record.data.primaryKey).then(result => {
        if (result) {
          reject('Personele ait alım faturası olduğundan silinemez.');
        }
      });
      await this.isCustomerHasPayment(record.data.primaryKey).then(result => {
        if (result) {
          reject('Personele ait ödeme olduğundan silinemez.');
        }
      });
      resolve(null);
    });
  }

  checkFields(model: ProfileModel): ProfileModel {
    const cleanModel = this.clearProfileModel();
    if (model.employeePrimaryKey === undefined) {
      model.employeePrimaryKey = '-1';
    }
    if (model.longName === undefined) { model.longName = cleanModel.longName; }
    if (model.mailAddress === undefined) { model.mailAddress = cleanModel.mailAddress; }
    if (model.phone === undefined) { model.phone = cleanModel.phone; }
    if (model.password === undefined) { model.password = cleanModel.password; }
    if (model.type === undefined) { model.type = cleanModel.type; }
    if (model.isActive === undefined) { model.isActive = cleanModel.isActive; }
    if (model.pathOfProfilePicture === undefined) { model.pathOfProfilePicture = cleanModel.pathOfProfilePicture; }

    return model;
  }

  clearProfileModel(): ProfileModel {
    const returnData = new ProfileModel();
    returnData.primaryKey = null;
    returnData.longName = '';
    returnData.mailAddress = '';
    returnData.phone = '';
    returnData.password = '';
    returnData.type = 'user';
    returnData.pathOfProfilePicture = '../../assets/images/users.png';
    returnData.isActive = true;
    returnData.userPrimaryKey = this.authService.getUid();
    returnData.insertDate = Date.now();

    return returnData;
  }

  clearProfileMainModel(): ProfileMainModel {
    const returnData = new ProfileMainModel();
    returnData.data = this.clearProfileModel();
    returnData.typeTr = getUserTypes().get(returnData.data.type);
    returnData.actionType = 'added';
    returnData.isActiveTr = returnData.data.isActive === true ? 'Aktif' : 'Pasif';
    return returnData;
  }

  getItems(): Observable<ProfileModel[]> {
    this.listCollection = this.db.collection<ProfileModel>(this.tableName,
    ref => ref.where('userPrimaryKey', '==', this.authService.getUid()));
    this.mainList2$ = this.listCollection.valueChanges({ idField : 'primaryKey'});
    return this.mainList2$;
  }

  getMainItems(): Observable<ProfileMainModel[]> {
    this.listCollection = this.db.collection<ProfileModel>(this.tableName,
    ref => ref.where('userPrimaryKey', '==', this.authService.getUid()).orderBy('longName', 'asc'));
    this.mainList$ = this.listCollection.stateChanges().pipe(map(changes  => {
      return changes.map( change => {
        const data = change.payload.doc.data() as ProfileModel;
        data.primaryKey = change.payload.doc.id;

        const returnData = new ProfileMainModel();
        returnData.data = this.checkFields(data);
        returnData.actionType = change.type;
        returnData.typeTr = this.typeMap.get(data.type);
        returnData.isActiveTr = returnData.data.isActive === true ? 'Aktif' : 'Pasif';

        return this.db.collection('tblCustomer').doc('-1').valueChanges()
        .pipe(map( (customer: CustomerModel) => {

          return Object.assign({ returnData }); }));
      });
    }), flatMap(feeds => combineLatest(feeds)));
    return this.mainList$;
  }

  getItem(primaryKey: string, isSetToSession: boolean): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.collection(this.tableName).doc(primaryKey).get()
        .toPromise()
        .then(doc => {
          if (doc.exists) {
            const data = doc.data() as ProfileModel;
            data.primaryKey = doc.id;

            const returnData = this.clearProfileMainModel();
            returnData.data = data;
            returnData.typeTr = getUserTypes().get(returnData.data.type);
            if (isSetToSession) {sessionStorage.setItem('employee', JSON.stringify(returnData)); }
            resolve(Object.assign({returnData}));
          } else {
            resolve(null);
          }
      });
    });
  }

  isCustomerHasSalesInvoice = async (primaryKey: string):
    Promise<boolean> => new Promise(async (resolve, reject): Promise<void> => {
    try {
      this.db.collection('tblSalesInvoice', ref => {
        let query: CollectionReference | Query = ref;
        query = query.orderBy('insertDate').limit(1)
          .where('userPrimaryKey', '==', this.authService.getUid())
          .where('employeePrimaryKey', '==', primaryKey);
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

  isCustomerHasCollection = async (primaryKey: string):
    Promise<boolean> => new Promise(async (resolve, reject): Promise<void> => {
    try {
      this.db.collection('tblCollection', ref => {
        let query: CollectionReference | Query = ref;
        query = query.orderBy('insertDate').limit(1)
          .where('userPrimaryKey', '==', this.authService.getUid())
          .where('employeePrimaryKey', '==', primaryKey);
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

  isCustomerHasPurchaseInvoice = async (primaryKey: string):
    Promise<boolean> => new Promise(async (resolve, reject): Promise<void> => {
    try {
      this.db.collection('tblPurchaseInvoice', ref => {
        let query: CollectionReference | Query = ref;
        query = query.orderBy('insertDate').limit(1)
          .where('userPrimaryKey', '==', this.authService.getUid())
          .where('employeePrimaryKey', '==', primaryKey);
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

  isCustomerHasPayment = async (primaryKey: string):
    Promise<boolean> => new Promise(async (resolve, reject): Promise<void> => {
    try {
      this.db.collection('tblPayment', ref => {
        let query: CollectionReference | Query = ref;
        query = query.orderBy('insertDate').limit(1)
          .where('userPrimaryKey', '==', this.authService.getUid())
          .where('employeePrimaryKey', '==', primaryKey);
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

}
