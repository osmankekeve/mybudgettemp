import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { Observable } from 'rxjs/Observable';
import { map, flatMap } from 'rxjs/operators';
import { combineLatest } from 'rxjs';
import { AuthenticationService } from './authentication.service';
import { CustomerModel } from '../models/customer-model';
import { NoteModel } from '../models/note-model';

@Injectable({
  providedIn: 'root'
})
export class NoteService {
  listCollection: AngularFirestoreCollection<NoteModel>;
  mainList$: Observable<NoteModel[]>;
  tableName = 'tblNote';

  constructor(public authServis: AuthenticationService,
              public db: AngularFirestore) {

  }

  getAllItems(): Observable<NoteModel[]> {
    this.listCollection = this.db.collection<NoteModel>(this.tableName,
    ref => ref.where('userPrimaryKey', '==', this.authServis.getUid()));
    this.mainList$ = this.listCollection.valueChanges({ idField : 'primaryKey'});
    return this.mainList$;
  }

  async addItem(record: NoteModel) {
    return await this.listCollection.add(record);
  }

  async removeItem(record: NoteModel) {
    return await this.db.collection(this.tableName).doc(record.primaryKey).delete();
  }

  async updateItem(record: NoteModel) {
    return await this.db.collection(this.tableName).doc(record.primaryKey).update(record);
  }

  getMainItems(): Observable<NoteModel[]> {
    this.listCollection = this.db.collection(this.tableName,
    ref => ref.where('userPrimaryKey', '==', this.authServis.getUid()));
    this.mainList$ = this.listCollection.stateChanges().pipe(map(changes  => {
      return changes.map( change => {
        const data = change.payload.doc.data() as NoteModel;
        data.primaryKey = change.payload.doc.id;
        return this.db.collection('tblCustomer').doc('-1').valueChanges()
        .pipe(map( (customer: CustomerModel) => {
          return Object.assign({data, actionType: change.type}); }));
      });
    }), flatMap(feeds => combineLatest(feeds)));
    return this.mainList$;
  }

}
