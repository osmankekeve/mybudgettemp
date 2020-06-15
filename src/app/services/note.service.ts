import { Injectable } from '@angular/core';
import {AngularFirestore, AngularFirestoreCollection, CollectionReference, Query} from '@angular/fire/firestore';
import { Observable } from 'rxjs/Observable';
import { map, flatMap } from 'rxjs/operators';
import { AuthenticationService } from './authentication.service';
import { NoteModel } from '../models/note-model';
import { NoteMainModel } from '../models/note-main-model';

@Injectable({
  providedIn: 'root'
})
export class NoteService {
  listCollection: AngularFirestoreCollection<NoteModel>;
  mainList$: Observable<NoteMainModel[]>;
  tableName = 'tblNote';

  constructor(public authService: AuthenticationService,
              public db: AngularFirestore) {

  }

  async addItem(record: NoteMainModel) {
    return await this.listCollection.add(Object.assign({}, record.data));
  }

  async removeItem(record: NoteMainModel) {
    return await this.db.collection(this.tableName).doc(record.data.primaryKey).delete();
  }

  async updateItem(record: NoteMainModel) {
    return await this.db.collection(this.tableName).doc(record.data.primaryKey).update(Object.assign({}, record.data));
  }

  checkForSave(record: NoteMainModel): Promise<string> {
    return new Promise((resolve, reject) => {
      if (record.data.note === null || record.data.note.trim() === '') {
        reject('Lüfen açıklama giriniz.');
      } else {
        resolve(null);
      }
    });
  }

  checkForRemove(record: NoteMainModel): Promise<string> {
    return new Promise((resolve, reject) => {
      resolve(null);
    });
  }

  clearSubModel(): NoteModel {
    const returnData = new NoteModel();
    returnData.primaryKey = null;
    returnData.userPrimaryKey = this.authService.getUid();
    returnData.employeePrimaryKey = this.authService.getEid();
    returnData.note = '';
    returnData.insertDate = Date.now();
    return returnData;
  }

  clearMainModel(): NoteMainModel {
    const returnData = new NoteMainModel();
    returnData.data = this.clearSubModel();
    return returnData;
  }

  checkFields(model: NoteModel): NoteModel {
    const cleanModel = this.clearSubModel();
    if (model.note === undefined) { model.note = cleanModel.note; }
    return model;
  }

  getItem(primaryKey: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.collection(this.tableName).doc(primaryKey).get()
        .toPromise()
        .then(doc => {
        if (doc.exists) {
          const data = doc.data() as NoteModel;
          data.primaryKey = doc.id;

          const returnData = new NoteMainModel();
          returnData.data = this.checkFields(data);
          resolve(Object.assign({returnData}));
        } else {
          resolve(null);
        }
      });
    });
  }

  getMainItems(): Observable<NoteMainModel[]> {
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
          const data = c.payload.doc.data() as NoteModel;
          data.primaryKey = c.payload.doc.id;

          const returnData = new NoteMainModel();
          returnData.data = this.checkFields(data);
          returnData.actionType = c.type;
          return Object.assign({returnData});
        })
      )
    );
    return this.mainList$;
  }

}
