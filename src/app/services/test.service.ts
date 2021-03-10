import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { Observable } from 'rxjs/Observable';
import { CustomerModel } from '../models/customer-model';
import { map, mergeMap } from 'rxjs/operators';
import { AuthenticationService } from './authentication.service';
import { CustomerService } from './customer.service';

@Injectable({
  providedIn: 'root'
})
export class TestService {
  listCollection: AngularFirestoreCollection<any>;
  mainList$: Observable<any[]>;
  listCusttomer: AngularFirestoreCollection<CustomerModel>;
  customerList$: Observable<CustomerModel[]>;

  constructor(public authServis: AuthenticationService,
              public customerService: CustomerService,
              public db: AngularFirestore) {

  }

  getItems(): Observable<any[]> {
    this.listCollection = this.db.collection('tblTest');
    this.mainList$ = this.listCollection.stateChanges().pipe(map(changes  => {
      return changes.map( change => {
        const data = change.payload.doc.data();
        const id = change.payload.doc.id;
        data.primaryKey = id;
        return { ...data, type: change.type };
      });
    }));
    return this.mainList$;
  }
}
