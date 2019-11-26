import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { Observable } from 'rxjs/Observable';
import { map, flatMap } from 'rxjs/operators';
import { combineLatest } from 'rxjs';
import { AuthenticationService } from './authentication.service';
import { ProfileModel } from '../models/profile-model';
import { CustomerModel } from '../models/customer-model';
import { ProfileMainModel } from '../models/profile-main-model';

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
    return await this.db.collection(this.tableName).doc(record.data.primaryKey).update(record.data);
  }

  async getItem(record: ProfileMainModel) {
    return await this.db.collection(this.tableName).doc(record.data.primaryKey);
  }

  clearProfileModel(): ProfileModel {
    const returnData = new ProfileModel();
    returnData.primaryKey = null;
    returnData.type = 'admin';
    returnData.isActive = true;
    returnData.userPrimaryKey = this.authService.getUid();
    returnData.insertDate = Date.now();

    return returnData;
  }

  clearProfileMainModel(): ProfileMainModel {
    const returnData = new ProfileMainModel();
    returnData.data = this.clearProfileModel();
    returnData.typeTr = 'Administrator';
    returnData.actionType = 'added';
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
        returnData.data = data;
        returnData.actionType = change.type;
        returnData.typeTr = this.typeMap.get(data.type);

        return this.db.collection('tblCustomer').doc('-1').valueChanges()
        .pipe(map( (customer: CustomerModel) => {

          return Object.assign({ returnData }); }));
      });
    }), flatMap(feeds => combineLatest(feeds)));
    return this.mainList$;
  }

  getProfile(): any {
    return new Promise((resolve, reject) => {
      this.db.collection('tblProfile').doc(JSON.parse(localStorage.getItem('employee'))).get().toPromise().then((item) => {
        const returnData = new ProfileMainModel();
        returnData.data = item.data() as ProfileModel;
        returnData.typeTr = this.typeMap.get(returnData.data.type);
        resolve(returnData);
      });
    });
  }

}
