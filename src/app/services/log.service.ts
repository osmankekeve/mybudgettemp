import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { AuthenticationService } from './authentication.service';
import { LogModel } from '../models/log-model';
import { Observable, combineLatest } from 'rxjs';
import { CustomerModel } from '../models/customer-model';
import { map, flatMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class LogService {
  listCollection: AngularFirestoreCollection<LogModel>;
  mainList$: Observable<LogModel[]>;
  tableName = 'tblLogs';

  constructor(public authServis: AuthenticationService,
              public db: AngularFirestore) {

  }

  async setItem(record: LogModel) {
    return await this.db.collection(this.tableName).add(Object.assign({}, record));
  }

  getNotificationsBetweenDates(startDate: Date, endDate: Date): Observable < LogModel[] > {
   this.listCollection = this.db.collection(this.tableName,
    ref => ref.orderBy('insertDate').where('userPrimaryKey', '==', this.authServis.getUid()).where('isActive', '==', true)
    .startAt(startDate.getTime()).endAt(endDate.getTime()));
   this.mainList$ = this.listCollection.stateChanges().pipe(map(changes  => {
   return changes.map( change => {
     const data = change.payload.doc.data() as LogModel;
     data.primaryKey = change.payload.doc.id;
     return this.db.collection('tblCustomer').doc('-1').valueChanges().pipe(map( (customer: CustomerModel) => {
       return Object.assign({data, actionType: change.type}); }));
   });
 }), flatMap(feeds => combineLatest(feeds)));
   return this.mainList$;
 }
}
