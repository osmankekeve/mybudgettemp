import { Injectable } from '@angular/core';
import {AngularFirestore, AngularFirestoreCollection, CollectionReference, Query} from '@angular/fire/firestore';
import { Observable } from 'rxjs/Observable';
import { map, flatMap } from 'rxjs/operators';
import { AuthenticationService } from './authentication.service';
import { NoteModel } from '../models/note-model';
import { NoteMainModel } from '../models/note-main-model';
import {DeliveryAddressModel} from '../models/delivery-address-model';
import {DeliveryAddressMainModel} from '../models/delivery-address-main-model';
import {CollectionMainModel} from '../models/collection-main-model';
import {CollectionModel} from '../models/collection-model';
import {currencyFormat, getStatus} from '../core/correct-library';
import {CustomerModel} from '../models/customer-model';
import {combineLatest} from 'rxjs';
import {CustomerService} from './customer.service';
import {AccountVoucherMainModel} from '../models/account-voucher-main-model';
import {DefinitionModel} from '../models/definition-model';

@Injectable({
  providedIn: 'root'
})
export class DeliveryAddressService {
  listCollection: AngularFirestoreCollection<DeliveryAddressModel>;
  mainList$: Observable<DeliveryAddressMainModel[]>;
  tableName = 'tblDeliveryAddress';

  constructor(protected authService: AuthenticationService, protected db: AngularFirestore, protected cService: CustomerService) {

  }

  async addItem(record: DeliveryAddressMainModel) {
    return await this.listCollection.add(Object.assign({}, record.data));
  }

  async removeItem(record: DeliveryAddressMainModel) {
    return await this.db.collection(this.tableName).doc(record.data.primaryKey).delete();
  }

  async updateItem(record: DeliveryAddressMainModel) {
    return await this.db.collection(this.tableName).doc(record.data.primaryKey).update(Object.assign({}, record.data));
  }

  async setItem(record: DeliveryAddressMainModel, primaryKey: string) {
    return await this.listCollection.doc(primaryKey).set(Object.assign({}, record.data));
  }

  checkForSave(record: DeliveryAddressMainModel): Promise<string> {
    return new Promise((resolve, reject) => {
      if (record.data.address === null || record.data.address.trim() === '') {
        reject('Lüfen adres giriniz.');
      } else {
        resolve(null);
      }
    });
  }

  checkForRemove(record: DeliveryAddressMainModel): Promise<string> {
    return new Promise((resolve, reject) => {
      resolve(null);
    });
  }

  clearSubModel(): DeliveryAddressModel {
    const returnData = new DeliveryAddressModel();
    returnData.primaryKey = null;
    returnData.userPrimaryKey = this.authService.getUid();
    returnData.employeePrimaryKey = this.authService.getEid();
    returnData.addressName = '';
    returnData.address = '';
    returnData.cityPrimaryKey = '-1';
    returnData.districtPrimaryKey = '-1';
    returnData.insertDate = Date.now();
    return returnData;
  }

  clearMainModel(): DeliveryAddressMainModel {
    const returnData = new DeliveryAddressMainModel();
    returnData.data = this.clearSubModel();
    return returnData;
  }

  checkFields(model: DeliveryAddressModel): DeliveryAddressModel {
    const cleanModel = this.clearSubModel();
    return model;
  }

  getItem(primaryKey: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.collection(this.tableName).doc(primaryKey).get()
        .toPromise()
        .then(doc => {
        if (doc.exists) {
          const data = doc.data() as DeliveryAddressModel;
          data.primaryKey = doc.id;

          const returnData = new DeliveryAddressMainModel();
          returnData.data = this.checkFields(data);
          resolve(Object.assign({returnData}));
        } else {
          resolve(null);
        }
      });
    });
  }

  getMainItems(): Observable<DeliveryAddressMainModel[]> {
    this.listCollection = this.db.collection(this.tableName,
      ref => ref.orderBy('insertDate').where('userPrimaryKey', '==', this.authService.getUid()));
    this.mainList$ = this.listCollection.stateChanges().pipe(map(changes => {
      return changes.map(change => {
        const data = change.payload.doc.data() as DeliveryAddressModel;
        data.primaryKey = change.payload.doc.id;

        const returnData = new DeliveryAddressMainModel();
        returnData.data = this.checkFields(data);
        returnData.actionType = change.type;

        return this.db.collection('tblCustomer').doc(data.customerPrimaryKey).valueChanges()
          .pipe(map((customer: CustomerModel) => {
            returnData.customer = customer !== undefined ? this.cService.convertMainModel(customer) : undefined;
            return Object.assign({returnData});
          }));
      });
    }), flatMap(feeds => combineLatest(feeds)));
    return this.mainList$;
  }

  getMainItemsByCustomerPrimaryKey(customerPrimaryKey: string): Observable<DeliveryAddressMainModel[]> {
    // left join siz
    this.listCollection = this.db.collection(this.tableName,
      ref => {
        let query: CollectionReference | Query = ref;
        query = query.where('userPrimaryKey', '==', this.authService.getUid())
          .where('customerPrimaryKey', '==', customerPrimaryKey);
        return query;
      });
    this.mainList$ = this.listCollection.stateChanges().pipe(
      map(changes =>
        changes.map(c => {
          const data = c.payload.doc.data() as DeliveryAddressModel;
          data.primaryKey = c.payload.doc.id;

          const returnData = new DeliveryAddressMainModel();
          returnData.data = this.checkFields(data);
          returnData.actionType = c.type;
          return Object.assign({returnData});
        })
      )
    );
    return this.mainList$;
  }

  getItemsForFill = async (customerPrimaryKey: string):
    Promise<Array<DeliveryAddressModel>> => new Promise(async (resolve, reject): Promise<void> => {
    try {
      const list = Array<DeliveryAddressModel>();
      await this.db.collection(this.tableName, ref => {
        let query: CollectionReference | Query = ref;
        query = query.where('userPrimaryKey', '==', this.authService.getUid())
          .where('customerPrimaryKey', '==', customerPrimaryKey);
        return query;
      }).get()
        .subscribe(snapshot => {
          snapshot.forEach(doc => {
            const data = doc.data() as DeliveryAddressModel;
            data.primaryKey = doc.id;

            list.push(data);
          });
          resolve(list);
        });

    } catch (error) {
      console.error(error);
      reject({code: 401, message: 'You do not have permission or there is a problem about permissions!'});
    }
  })

}
