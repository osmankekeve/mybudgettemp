import {Injectable} from '@angular/core';
import {AngularFirestore, AngularFirestoreCollection, CollectionReference, Query} from '@angular/fire/firestore';
import {Observable} from 'rxjs/Observable';
import {map} from 'rxjs/operators';
import {AuthenticationService} from './authentication.service';
import {LogService} from './log.service';
import {SettingService} from './setting.service';
import {CustomerService} from './customer.service';
import {ActionService} from './action.service';
import {DiscountListMainModel} from '../models/discount-list-main-model';
import {DiscountListModel} from '../models/discount-list-model';
import {ProductDiscountService} from './product-discount.service';

@Injectable({
  providedIn: 'root'
})
export class DiscountListService {
  listCollection: AngularFirestoreCollection<DiscountListModel>;
  mainList$: Observable<DiscountListMainModel[]>;
  tableName = 'tblDiscountList';

  constructor(protected authService: AuthenticationService, protected sService: SettingService,
              protected logService: LogService, protected db: AngularFirestore,
              protected ppService: ProductDiscountService, protected actService: ActionService) {
                this.listCollection = this.db.collection(this.tableName);

  }

  async addItem(record: DiscountListMainModel) {
    return await this.listCollection.add(Object.assign({}, record.data)).then(async () => {
      await this.logService.addTransactionLog(record, 'insert', 'discount-list');
    });
  }

  async removeItem(record: DiscountListMainModel) {
    return await this.db.collection(this.tableName).doc(record.data.primaryKey).delete()
    .then(async () => {
      await this.ppService.getProductsForTransaction(record.data.primaryKey)
        .then((list) => {
          list.forEach(async item => {
            await this.db.collection(this.ppService.tableName).doc(item.primaryKey).delete();
          });
        });
    })
    .finally(async () => {
      await this.logService.addTransactionLog(record, 'delete', 'discount-list');
    });
  }

  async updateItem(record: DiscountListMainModel) {
    return await this.db.collection(this.tableName).doc(record.data.primaryKey).update(Object.assign({}, record.data))
      .then(async () => {
        await this.ppService.getProductsForTransaction(record.data.primaryKey)
          .then((list) => {
            list.forEach(async item => {
              await this.db.collection(this.ppService.tableName).doc(item.primaryKey).delete();
            });
          }).finally(async () => {
            for (const item of record.productList) {
              item.data.discountListPrimaryKey = record.data.primaryKey;
              await this.db.collection(this.ppService.tableName).doc(item.data.primaryKey).set(Object.assign({}, item.data));
            }
          });
      })
      .finally(async () => {
        await this.logService.addTransactionLog(record, 'update', 'discount-list');
      });
  }

  async setItem(record: DiscountListMainModel, primaryKey: string) {
    return await this.listCollection.doc(primaryKey).set(Object.assign({}, record.data))
      .then(async () => {
        await this.ppService.getProductsForTransaction(record.data.primaryKey)
          .then((list) => {
            list.forEach(async item => {
              await this.db.collection(this.ppService.tableName).doc(item.primaryKey).delete();
            });
          }).finally(async () => {
            for (const item of record.productList) {
              item.data.discountListPrimaryKey = record.data.primaryKey;
              await this.db.collection(this.ppService.tableName).doc(item.data.primaryKey).set(Object.assign({}, item.data));
            }
          });
      })
      .finally(async () => {
        await this.logService.addTransactionLog(record, 'insert', 'discount-list');
      });
  }

  checkForSave(record: DiscountListMainModel): Promise<string> {
    return new Promise((resolve, reject) => {
      if (record.data.listName === '' ) {
        reject('Lütfen liste adı giriniz.');
      } else if (record.data.type === '-1' ) {
        reject('Lütfen liste tipi seçiniz.');
      } else if (record.productList.length === 0) {
        reject('Lütfen listeye ürün ekleyiniz.');
      }  else {
        resolve(null);
      }
    });
  }

  checkForRemove(record: DiscountListMainModel): Promise<string> {
    return new Promise(async (resolve, reject) => {
      await this.isUsedOnSalesOrder(record.data.primaryKey).then(result => {
        if (result) {
          reject('Satış siparişinde kullanıldığından silinemez.');
        }
      });
      await this.isUsedOnPurchaseOrder(record.data.primaryKey).then(result => {
        if (result) {
          reject('Alım siparişinde kullanıldığından silinemez.');
        }
      });
      await this.isUsedOnCampaign(record.data.primaryKey).then(result => {
        if (result) {
          reject('Kampanyada kullanıldığından silinemez.');
        }
      });
      resolve(null);
    });
  }

  clearSubModel(): DiscountListModel {

    const returnData = new DiscountListModel();
    returnData.primaryKey = null;
    returnData.userPrimaryKey = this.authService.getUid();
    returnData.listName = '';
    returnData.type = '-1'; // sales, purchase
    returnData.isActive = true;
    returnData.description = '';
    returnData.beginDate = Date.now();
    returnData.finishDate = Date.now();
    returnData.insertDate = Date.now();

    return returnData;
  }

  clearMainModel(): DiscountListMainModel {
    const returnData = new DiscountListMainModel();
    returnData.data = this.clearSubModel();
    returnData.actionType = 'added';
    returnData.isActiveTr = returnData.data.isActive === true ? 'Aktif' : 'Pasif';
    returnData.typeTr = returnData.data.type === 'sales' ? 'Satış Listesi' : 'Alım Listesi';
    return returnData;
  }

  checkFields(model: DiscountListModel): DiscountListModel {
    const cleanModel = this.clearSubModel();

    return model;
  }

  convertMainModel(model: DiscountListModel): DiscountListMainModel {
    const returnData = this.clearMainModel();
    returnData.data = this.checkFields(model);
    returnData.isActiveTr = returnData.data.isActive === true ? 'Aktif' : 'Pasif';
    returnData.typeTr = returnData.data.type === 'sales' ? 'Satış Listesi' : 'Alım Listesi';
    returnData.productList = [];
    return returnData;
  }

  getItem(primaryKey: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.collection(this.tableName).doc(primaryKey).get().toPromise().then(doc => {
        if (doc.exists) {
          const data = doc.data() as DiscountListModel;
          data.primaryKey = doc.id;
          const returnData = this.convertMainModel(data);
          resolve(Object.assign({returnData}));
        } else {
          resolve(null);
        }
      });
    });
  }

  getMainItems(): Observable<DiscountListMainModel[]> {
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
          const data = c.payload.doc.data() as DiscountListModel;
          data.primaryKey = c.payload.doc.id;
          const returnData = this.convertMainModel(data);
          returnData.actionType = c.type;
          return Object.assign({returnData});
        })
      )
    );
    return this.mainList$;
  }

  getDiscountLists = async (isActive: Array<boolean>, type: string):
    Promise<Array<DiscountListModel>> => new Promise(async (resolve, reject): Promise<void> => {
    try {
      const list = Array<DiscountListModel>();
      await this.db.collection(this.tableName, ref => {
        let query: CollectionReference | Query = ref;
        query = query.where('userPrimaryKey', '==', this.authService.getUid())
          .where('isActive', 'in', isActive)
          .where('type', '==', type);
        return query;
      }).get()
        .subscribe(snapshot => {
          snapshot.forEach(doc => {
            const data = doc.data() as DiscountListModel;
            data.primaryKey = doc.id;

            list.push(data);
          });
          resolve(list);
        });

    } catch (error) {
      console.error(error);
      reject({message: 'Error: ' + error});
    }
  })

  isUsedOnSalesOrder = async (primaryKey: string):
    Promise<boolean> => new Promise(async (resolve, reject): Promise<void> => {
    try {
      this.db.collection('tblSalesOrder', ref => {
        let query: CollectionReference | Query = ref;
        query = query.limit(1).where('discountListPrimaryKey', '==', primaryKey);
        return query;
      }).get().toPromise().then(snapshot => {
        if (snapshot.size > 0) {
          resolve(true);
        } else {
          resolve(false);
        }
      });
    } catch (error) {
      reject({code: 401, message: error.message});
    }
  })

  isUsedOnPurchaseOrder = async (primaryKey: string):
    Promise<boolean> => new Promise(async (resolve, reject): Promise<void> => {
    try {
      this.db.collection('tblPurchaseOrder', ref => {
        let query: CollectionReference | Query = ref;
        query = query.limit(1).where('discountListPrimaryKey', '==', primaryKey);
        return query;
      }).get().toPromise().then(snapshot => {
        if (snapshot.size > 0) {
          resolve(true);
        } else {
          resolve(false);
        }
      });
    } catch (error) {
      reject({code: 401, message: error.message});
    }
  })

  isUsedOnCampaign = async (primaryKey: string):
    Promise<boolean> => new Promise(async (resolve, reject): Promise<void> => {
    try {
      this.db.collection('tblCampaign', ref => {
        let query: CollectionReference | Query = ref;
        query = query.limit(1).where('discountListPrimaryKey', '==', primaryKey);
        return query;
      }).get().toPromise().then(snapshot => {
        if (snapshot.size > 0) {
          resolve(true);
        } else {
          resolve(false);
        }
      });
    } catch (error) {
      reject({code: 401, message: error.message});
    }
  })
}
