import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { Observable } from 'rxjs/Observable';
import { map, flatMap } from 'rxjs/operators';
import { combineLatest } from 'rxjs';
import { CashDeskModel } from '../models/cash-desk-model';
import { AuthenticationService } from './authentication.service';
import { CustomerModel } from '../models/customer-model';

@Injectable({
  providedIn: 'root'
})
export class CashDeskService {
  listCollection: AngularFirestoreCollection<CashDeskModel>;
  mainList$: Observable<CashDeskModel[]>;
  listCusttomer: AngularFirestoreCollection<CashDeskModel>;
  customerList$: Observable<CashDeskModel[]>;

  constructor(public authServis: AuthenticationService,
              public db: AngularFirestore) {

  }

  getAllItems(): Observable<CashDeskModel[]> {
    this.listCollection = this.db.collection<CashDeskModel>('tblCashDesk',
    ref => ref.where('userPrimaryKey', '==', this.authServis.getUid()));
    this.mainList$ = this.listCollection.valueChanges({ idField : 'primaryKey'});
    return this.mainList$;
  }

  async addItem(record: CashDeskModel) {
    return await this.listCollection.add(record);
  }

  async removeItem(record: CashDeskModel) {
    return await this.db.collection('tblCashDesk').doc(record.primaryKey).delete();
  }

  async updateItem(record: CashDeskModel) {
    return await this.db.collection('tblCashDesk').doc(record.primaryKey).update(record);
  }

  getMainItems(): Observable<CashDeskModel[]> {
    this.listCollection = this.db.collection('tblCashDesk',
    ref => ref.where('userPrimaryKey', '==', this.authServis.getUid()));
    this.mainList$ = this.listCollection.stateChanges().pipe(map(changes  => {
      return changes.map( change => {
        const data = change.payload.doc.data() as CashDeskModel;
        data.primaryKey = change.payload.doc.id;
        return this.db.collection('tblCustomer').doc('-1').valueChanges()
        .pipe(map( (customer: CustomerModel) => {
          return Object.assign({data, actionType: change.type}); }));
      });
    }), flatMap(feeds => combineLatest(feeds)));
    return this.mainList$;
  }

  /* getMainItems(): Observable<CashDeskModel[]> {
    this.listCollection = this.db.collection('tblCashDesk',
    ref => ref.where('userPrimaryKey', '==', this.authServis.getUid()));
    this.mainList$ = this.listCollection.stateChanges().pipe(map(changes  => {
      return changes.map( change => {
        const data = change.payload.doc.data() as CashDeskModel;
        data.primaryKey = change.payload.doc.id;
        return { actionType: change.type, ...data };
      });
    }));
    return this.mainList$;
  } */

}
