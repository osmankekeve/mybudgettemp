import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { Observable } from 'rxjs/Observable';
import { map, flatMap } from 'rxjs/operators';
import { combineLatest } from 'rxjs';
import { AuthenticationService } from './authentication.service';
import { ProfileModel } from '../models/profile-model';
import { CustomerModel } from '../models/customer-model';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  listCollection: AngularFirestoreCollection<ProfileModel>;
  mainList$: Observable<ProfileModel[]>;
  tableName = 'tblProfile';

  constructor(public authServis: AuthenticationService,
              public db: AngularFirestore) {

  }

  getAllItems(): Observable<ProfileModel[]> {
    this.listCollection = this.db.collection<ProfileModel>(this.tableName,
    ref => ref.where('userPrimaryKey', '==', this.authServis.getUid()));
    this.mainList$ = this.listCollection.valueChanges({ idField : 'primaryKey'});
    return this.mainList$;
  }

  async addItem(record: ProfileModel) {
    return await this.listCollection.add(record);
  }

  async removeItem(record: ProfileModel) {
    return await this.db.collection(this.tableName).doc(record.primaryKey).delete();
  }

  async updateItem(record: ProfileModel) {
    return await this.db.collection(this.tableName).doc(record.primaryKey).update(record);
  }

  async getItem(record: ProfileModel) {
    return await this.db.collection(this.tableName).doc(record.primaryKey);
  }

  getMainItems(): Observable<ProfileModel[]> {
    this.listCollection = this.db.collection(this.tableName,
    ref => ref.where('userPrimaryKey', '==', this.authServis.getUid()).orderBy('longName', 'asc'));
    this.mainList$ = this.listCollection.stateChanges().pipe(map(changes  => {
      return changes.map( change => {
        const data = change.payload.doc.data() as ProfileModel;
        data.primaryKey = change.payload.doc.id;
        return this.db.collection('tblCustomer').doc('-1').valueChanges()
        .pipe(map( (customer: CustomerModel) => {
          return Object.assign({data, actionType: change.type}); }));
      });
    }), flatMap(feeds => combineLatest(feeds)));
    return this.mainList$;
  }

  getProfile(): any {
    return new Promise((resolve, reject) => {
      this.db.collection('tblProfile').doc(JSON.parse(localStorage.getItem('employee'))).get().toPromise().then(item => {
        resolve(item.data());
      });
    });
  }

}
