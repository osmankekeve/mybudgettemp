import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { Observable } from 'rxjs/Observable';
import { map, flatMap } from 'rxjs/operators';
import { combineLatest } from 'rxjs';
import { AuthenticationService } from './authentication.service';
import { CustomerModel } from '../models/customer-model';
import { CustomerTargetModel } from '../models/customer-target-model';
import { CustomerTargetMainModel } from '../models/customer-target-main-model';

@Injectable({
  providedIn: 'root'
})
export class CustomerTargetService {
  listCollection: AngularFirestoreCollection<CustomerTargetModel>;
  mainList$: Observable<CustomerTargetMainModel[]>;
  mainList2$: Observable<CustomerTargetModel[]>;
  tableName = 'tblCustomerTarget';
  typeMap = new Map([['monthly', 'Aylık'], ['yearly', 'Yıllık'], ['periodic', 'Periyodik']]);

  constructor(public authService: AuthenticationService,
              public db: AngularFirestore) {

  }

  async addItem(record: CustomerTargetMainModel) {
    return await this.listCollection.add(Object.assign({}, record.data));
  }

  async removeItem(record: CustomerTargetMainModel) {
    return await this.db.collection(this.tableName).doc(record.data.primaryKey).delete();
  }

  async updateItem(record: CustomerTargetMainModel) {
    return await this.db.collection(this.tableName).doc(record.data.primaryKey).update(record.data);
  }

  async getItem(record: CustomerTargetMainModel) {
    return await this.db.collection(this.tableName).doc(record.data.primaryKey);
  }

  clearProfileModel(): CustomerTargetModel {
    const returnData = new CustomerTargetModel();
    returnData.primaryKey = null;
    returnData.type = 'yearly';
    returnData.beginMonth = -1;
    returnData.finishMonth = -1;
    returnData.userPrimaryKey = this.authService.getUid();
    returnData.insertDate = Date.now();

    return returnData;
  }

  clearProfileMainModel(): CustomerTargetMainModel {
    const returnData = new CustomerTargetMainModel();
    returnData.data = this.clearProfileModel();
    returnData.typeTr = 'Yıllık';
    returnData.actionType = 'added';
    return returnData;
  }

  getMainItems(): Observable<CustomerTargetMainModel[]> {
    this.listCollection = this.db.collection<CustomerTargetModel>(this.tableName,
    ref => ref.where('userPrimaryKey', '==', this.authService.getUid()));
    this.mainList$ = this.listCollection.stateChanges().pipe(map(changes  => {
      return changes.map( change => {
        const data = change.payload.doc.data() as CustomerTargetModel;
        data.primaryKey = change.payload.doc.id;

        const returnData = new CustomerTargetMainModel();
        returnData.data = data;
        returnData.actionType = change.type;
        returnData.typeTr = this.typeMap.get(data.type);

        return this.db.collection('tblCustomer').doc(data.customerCode).valueChanges()
        .pipe(map( (customer: CustomerModel) => {
          returnData.customerName = customer.name;

          return Object.assign({ returnData }); }));
      });
    }), flatMap(feeds => combineLatest(feeds)));
    return this.mainList$;
  }

}
