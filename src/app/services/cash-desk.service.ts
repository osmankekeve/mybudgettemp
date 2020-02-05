import {Injectable} from '@angular/core';
import {AngularFirestore, AngularFirestoreCollection} from '@angular/fire/firestore';
import {Observable} from 'rxjs/Observable';
import {map, flatMap} from 'rxjs/operators';
import {combineLatest} from 'rxjs';
import {CashDeskModel} from '../models/cash-desk-model';
import {AuthenticationService} from './authentication.service';
import {CustomerModel} from '../models/customer-model';
import {CashDeskMainModel} from '../models/cash-desk-main-model';
import {CashDeskVoucherMainModel} from '../models/cashdesk-voucher-main-model';
import {ProfileService} from './profile.service';

@Injectable({
  providedIn: 'root'
})
export class CashDeskService {
  listCollection: AngularFirestoreCollection<CashDeskModel>;
  mainList$: Observable<CashDeskMainModel[]>;
  mainList2$: Observable<CashDeskModel[]>;
  employeeMap = new Map();
  tableName = 'tblCashDesk';

  constructor(public authService: AuthenticationService, public eService: ProfileService,
              public db: AngularFirestore) {
    if (this.authService.isUserLoggedIn()) {
      this.eService.getItems().subscribe(list => {
        this.employeeMap.clear();
        this.employeeMap.set('-1', 'Tüm Kullanıcılar');
        list.forEach(item => {
          this.employeeMap.set(item.primaryKey, item.longName);
        });
      });
    }
  }

  async addItem(record: CashDeskMainModel) {
    return await this.listCollection.add(Object.assign({}, record.data));
  }

  async removeItem(record: CashDeskMainModel) {
    return await this.db.collection(this.tableName).doc(record.data.primaryKey).delete();
  }

  async updateItem(record: CashDeskMainModel) {
    return await this.db.collection(this.tableName).doc(record.data.primaryKey).update(Object.assign({}, record.data));
  }

  clearSubModel(): CashDeskModel {

    const returnData = new CashDeskModel();
    returnData.primaryKey = null;
    returnData.userPrimaryKey = this.authService.getUid();
    returnData.employeePrimaryKey = this.authService.getEid();
    returnData.name = null;
    returnData.description = '';
    returnData.insertDate = Date.now();

    return returnData;
  }

  clearMainModel(): CashDeskMainModel {
    const returnData = new CashDeskVoucherMainModel();
    returnData.data = this.clearSubModel();
    returnData.employeeName = this.employeeMap.get(returnData.data.employeePrimaryKey);
    returnData.actionType = 'added';
    return returnData;
  }

  getItem(primaryKey: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.collection(this.tableName).doc(primaryKey).get().toPromise().then(doc => {
        if (doc.exists) {
          const data = doc.data() as CashDeskModel;
          data.primaryKey = doc.id;

          const returnData = new CashDeskMainModel();
          returnData.data = data;
          returnData.employeeName = this.employeeMap.get(returnData.data.employeePrimaryKey);
          resolve(Object.assign({returnData}));
        } else {
          resolve(null);
        }
      });
    });
  }

  getItems(): Observable<CashDeskModel[]> {
    this.listCollection = this.db.collection<CashDeskModel>(this.tableName,
      ref => ref.where('userPrimaryKey', '==', this.authService.getUid()));
    this.mainList2$ = this.listCollection.valueChanges({ idField : 'primaryKey'});
    return this.mainList2$;
  }

  getMainItems(): Observable<CashDeskMainModel[]> {
    this.listCollection = this.db.collection(this.tableName,
      ref => ref.where('userPrimaryKey', '==', this.authService.getUid()));
    this.mainList$ = this.listCollection.stateChanges().pipe(map(changes => {
      return changes.map(change => {
        const data = change.payload.doc.data() as CashDeskModel;
        data.primaryKey = change.payload.doc.id;

        const returnData = new CashDeskMainModel();
        returnData.data = data;
        returnData.employeeName = this.employeeMap.get(returnData.data.employeePrimaryKey);
        returnData.actionType = change.type;

        return this.db.collection('tblCustomer').doc('-1').valueChanges()
          .pipe(map((customer: CustomerModel) => {
            return Object.assign({returnData});
          }));
      });
    }), flatMap(feeds => combineLatest(feeds)));
    return this.mainList$;
  }

}
