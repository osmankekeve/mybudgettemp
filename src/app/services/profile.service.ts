import { Injectable } from '@angular/core';
import {AngularFirestore, AngularFirestoreCollection, CollectionReference, Query} from '@angular/fire/firestore';
import { Observable } from 'rxjs/Observable';
import { map, flatMap } from 'rxjs/operators';
import { combineLatest } from 'rxjs';
import { AuthenticationService } from './authentication.service';
import { ProfileModel } from '../models/profile-model';
import { CustomerModel } from '../models/customer-model';
import { ProfileMainModel } from '../models/profile-main-model';
import {getEducation, getGenders, getStatus, getUserTypes, isNullOrEmpty} from '../core/correct-library';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  listCollection: AngularFirestoreCollection<ProfileModel>;
  mainList$: Observable<ProfileMainModel[]>;
  mainList2$: Observable<ProfileModel[]>;
  tableName = 'tblProfile';

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
    if (model.pathOfProfilePicture === '' || model.pathOfProfilePicture === undefined) { model.pathOfProfilePicture = cleanModel.pathOfProfilePicture; }
    if (model.isActive === undefined) { model.isActive = cleanModel.isActive; }
    if (model.birthDate === undefined) { model.birthDate = cleanModel.birthDate; }
    if (model.cityName === undefined) { model.cityName = cleanModel.cityName; }
    if (model.districtName === undefined) { model.districtName = cleanModel.districtName; }
    if (model.address === undefined) { model.address = cleanModel.address; }
    if (model.educationStatus === undefined) { model.educationStatus = cleanModel.educationStatus; }
    if (model.gender === undefined) { model.gender = cleanModel.gender; }

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
    returnData.birthDate = Date.now();
    returnData.cityName = '';
    returnData.districtName = '';
    returnData.address = '';
    returnData.educationStatus = 'primarySchool'; // primarySchool, middleSchool, highSchool, university
    returnData.gender = 'male'; // male, female

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

  convertMainModel(model: ProfileModel): ProfileMainModel {
    const returnData = this.clearProfileMainModel();
    returnData.data = this.checkFields(model);
    returnData.typeTr = getUserTypes().get(returnData.data.type);
    returnData.genderTr = getGenders().get(returnData.data.gender);
    returnData.educationStatusTr = getEducation().get(returnData.data.educationStatus);
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

        const returnData = this.clearProfileMainModel();
        returnData.data = this.checkFields(data);
        returnData.actionType = change.type;
        returnData.typeTr = getUserTypes().get(returnData.data.type);
        returnData.genderTr = getGenders().get(returnData.data.gender);
        returnData.educationStatusTr = getEducation().get(returnData.data.educationStatus);
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
      if (isNullOrEmpty(primaryKey)) {
        resolve(null);
      } else {
        this.db.collection(this.tableName).doc(primaryKey).get()
          .toPromise()
          .then(doc => {
            if (doc.exists) {
              const data = doc.data() as ProfileModel;
              data.primaryKey = doc.id;

              const returnData = this.clearProfileMainModel();
              returnData.data = this.checkFields(data);
              returnData.typeTr = getUserTypes().get(returnData.data.type);
              returnData.genderTr = getGenders().get(returnData.data.gender);
              returnData.educationStatusTr = getEducation().get(returnData.data.educationStatus);
              returnData.isActiveTr = returnData.data.isActive === true ? 'Aktif' : 'Pasif';
              if (isSetToSession) {sessionStorage.setItem('employee', JSON.stringify(returnData)); }
              resolve(Object.assign({returnData}));
            } else {
              resolve(null);
            }
        });
      }
    });
  }

  getMainItemsAsPromise = async ():
    Promise<Array<ProfileMainModel>> => new Promise(async (resolve, reject): Promise<void> => {
    try {
      const list = Array<ProfileMainModel>();
      this.db.collection(this.tableName, ref => {
        let query: CollectionReference | Query = ref;
        query = query.where('userPrimaryKey', '==', this.authService.getUid());
        query = query.where('isActive', '==', true);
        return query;
      }).get().subscribe(snapshot => {
        snapshot.forEach(doc => {
          const data = doc.data() as ProfileModel;
          data.primaryKey = doc.id;

          const returnData = new ProfileMainModel();
          returnData.data = this.checkFields(data);

          list.push(returnData);
        });
        resolve(list);
      });

    } catch (error) {
      console.error(error);
      reject({message: 'Error: ' + error});
    }
  })

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
      reject({message: 'Error: ' + error});
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
      reject({message: 'Error: ' + error});
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
      reject({message: 'Error: ' + error});
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
      reject({message: 'Error: ' + error});
    }
  })

  isEmployeePasswordExist = async (primaryKey: string, password: string):
    Promise<boolean> => new Promise(async (resolve, reject): Promise<void> => {
    try {
      this.db.collection('tblProfile', ref => {
        let query: CollectionReference | Query = ref;
        query = query.where('userPrimaryKey', '==', this.authService.getUid())
          .where('primaryKey', '==', primaryKey)
          .where('password', '==', password);
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
      reject({code: 401, message: error.message});
    }
  })

}
