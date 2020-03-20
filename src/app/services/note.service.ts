import { Injectable } from '@angular/core';
import {AngularFirestore, AngularFirestoreCollection, CollectionReference, Query} from '@angular/fire/firestore';
import { Observable } from 'rxjs/Observable';
import { map, flatMap } from 'rxjs/operators';
import { combineLatest } from 'rxjs';
import { AuthenticationService } from './authentication.service';
import { CustomerModel } from '../models/customer-model';
import { NoteModel } from '../models/note-model';
import {CollectionMainModel} from '../models/collection-main-model';
import {currencyFormat, getPaymentTypes, getTerms} from '../core/correct-library';
import {CustomerTargetModel} from '../models/customer-target-model';
import {CustomerMainModel} from '../models/customer-main-model';

@Injectable({
  providedIn: 'root'
})
export class NoteService {
  listCollection: AngularFirestoreCollection<NoteModel>;
  mainList$: Observable<NoteModel[]>;
  tableName = 'tblNote';

  constructor(public authService: AuthenticationService,
              public db: AngularFirestore) {

  }

  getAllItems(): Observable<NoteModel[]> {
    this.listCollection = this.db.collection<NoteModel>(this.tableName,
    ref => ref.where('userPrimaryKey', '==', this.authService.getUid()));
    this.mainList$ = this.listCollection.valueChanges({ idField : 'primaryKey'});
    return this.mainList$;
  }

  checkForSave(record: NoteModel): Promise<string> {
    return new Promise((resolve, reject) => {
      if (record.note === null || record.note.trim() === '') {
        reject('Lüfen açıklama giriniz.');
      } else {
        resolve(null);
      }
    });
}

  checkForRemove(record: NoteModel): Promise<string> {
    return new Promise((resolve, reject) => {
      resolve(null);
    });
  }

  async addItem(record: NoteModel) {
    return await this.listCollection.add(Object.assign({}, record));
  }

  async removeItem(record: NoteModel) {
    return await this.db.collection(this.tableName).doc(record.primaryKey).delete();
  }

  async updateItem(record: NoteModel) {
    return await this.db.collection(this.tableName).doc(record.primaryKey).update(Object.assign({}, record));
  }

  clearMainModel(): NoteModel {
    const returnData = new NoteModel();
    returnData.primaryKey = null;
    returnData.userPrimaryKey = this.authService.getUid();
    returnData.employeePrimaryKey = this.authService.getEid();
    returnData.note = '';
    returnData.insertDate = Date.now();
    return returnData;
  }

  checkFields(model: NoteModel): NoteModel {
    const cleanModel = this.clearMainModel();
    if (model.note === undefined) { model.note = cleanModel.note; }
    return model;
  }

  getItem(primaryKey: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.collection(this.tableName).doc(primaryKey).get().toPromise().then(doc => {
        if (doc.exists) {
          let data = doc.data() as NoteModel;
          data.primaryKey = doc.id;
          data = this.checkFields(data);
          resolve(Object.assign({data}));
        } else {
          resolve(null);
        }
      });
    });
  }

  getMainItems(): Observable<NoteModel[]> {
    // left join siz
    this.listCollection = this.db.collection(this.tableName,
      ref => {
        let query: CollectionReference | Query = ref;
        query = query.where('userPrimaryKey', '==', this.authService.getUid());
        return query;
      });
    this.mainList$ = this.listCollection.stateChanges().pipe(
      map(changes =>
        changes.map(c => {
          let data = c.payload.doc.data() as NoteModel;
          data.primaryKey = c.payload.doc.id;
          data = this.checkFields(data);
          return Object.assign({data, actionType: c.type});
        })
      )
    );
    return this.mainList$;
  }

}
