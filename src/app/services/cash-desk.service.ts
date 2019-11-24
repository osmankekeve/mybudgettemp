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
  customerList$: Observable<CashDeskModel[]>;
  tableName = 'tblCashDesk';

  constructor(public authService: AuthenticationService,
              public db: AngularFirestore) {

  }

  getAllItems(): Observable<CashDeskModel[]> {
    this.listCollection = this.db.collection<CashDeskModel>(this.tableName,
    ref => ref.where('userPrimaryKey', '==', this.authService.getUid()));
    this.mainList$ = this.listCollection.valueChanges({ idField : 'primaryKey'});
    return this.mainList$;
  }

  async addItem(record: CashDeskModel) {
    return await this.listCollection.add(record);
  }

  async removeItem(record: CashDeskModel) {
    return await this.db.collection(this.tableName).doc(record.primaryKey).delete();
  }

  async updateItem(record: CashDeskModel) {
    return await this.db.collection(this.tableName).doc(record.primaryKey).update(record);
  }

  getItem(primaryKey: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.collection(this.tableName).doc(primaryKey).get().toPromise().then(doc => {
        if (doc.exists) {
          const data = doc.data() as CashDeskModel;
          data.primaryKey = doc.id;
          resolve(Object.assign({data}));
        } else {
          resolve(null);
        }
      });
    });
  }

  getMainItems(): Observable<CashDeskModel[]> {
    this.listCollection = this.db.collection(this.tableName,
    ref => ref.where('userPrimaryKey', '==', this.authService.getUid()));
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
}
