import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection, CollectionReference, Query } from '@angular/fire/firestore';
import { Observable } from 'rxjs/Observable';
import { map } from 'rxjs/operators';
import { AuthenticationService } from './authentication.service';
import { LogService } from './log.service';
import { SettingService } from './setting.service';
import { CustomerService } from './customer.service';
import { ActionService } from './action.service';
import { PriceListModel } from '../models/price-list-model';
import { PriceListMainModel } from '../models/price-list-main-model';
import { ProductPriceService } from './product-price.service';

@Injectable({
  providedIn: 'root'
})
export class PriceListService {
  listCollection: AngularFirestoreCollection<PriceListModel>;
  mainList$: Observable<PriceListMainModel[]>;
  tableName = 'tblPriceList';

  constructor(protected authService: AuthenticationService, protected sService: SettingService, protected logService: LogService,
              protected db: AngularFirestore, protected ppService: ProductPriceService, protected actService: ActionService) {
                this.listCollection = this.db.collection(this.tableName);

  }

  async addItem(record: PriceListMainModel) {
    return await this.listCollection.add(Object.assign({}, record.data)).then(async () => {
      await this.logService.addTransactionLog(record, 'insert', 'price-list');
    });
  }

  async removeItem(record: PriceListMainModel) {
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
      await this.logService.addTransactionLog(record, 'delete', 'price-list');
    });
  }

  async updateItem(record: PriceListMainModel) {
    return await this.db.collection(this.tableName).doc(record.data.primaryKey).update(Object.assign({}, record.data))
      .then(async () => {
        await this.ppService.getProductsForTransaction(record.data.primaryKey)
          .then((list) => {
            list.forEach(async item => {
              await this.db.collection(this.ppService.tableName).doc(item.primaryKey).delete();
            });
          }).finally(async () => {
            for (const item of record.productList) {
              item.data.priceListPrimaryKey = record.data.primaryKey;
              await this.db.collection(this.ppService.tableName).doc(item.data.primaryKey).set(Object.assign({}, item.data));
            }
          });
      })
      .finally(async () => {
        await this.logService.addTransactionLog(record, 'update', 'price-list');
      });
  }

  async setItem(record: PriceListMainModel, primaryKey: string) {
    return await this.listCollection.doc(primaryKey).set(Object.assign({}, record.data))
      .then(async () => {
        await this.ppService.getProductsForTransaction(record.data.primaryKey)
          .then((list) => {
            list.forEach(async item => {
              await this.db.collection(this.ppService.tableName).doc(item.primaryKey).delete();
            });
          }).finally(async () => {
            for (const item of record.productList) {
              item.data.priceListPrimaryKey = record.data.primaryKey;
              await this.db.collection(this.ppService.tableName).doc(item.data.primaryKey).set(Object.assign({}, item.data));
            }
          });
      })
      .finally(async () => {
        await this.logService.addTransactionLog(record, 'insert', 'price-list');
      });
  }

  checkForSave(record: PriceListMainModel): Promise<string> {
    return new Promise((resolve, reject) => {
      if (record.data.listName === '') {
        reject('L??tfen liste ad?? giriniz.');
      } else if (record.data.type === '-1') {
        reject('L??tfen liste tipi se??iniz.');
      } else if (record.productList.length === 0) {
        reject('L??tfen listeye ??r??n ekleyiniz.');
      } else {
        resolve(null);
      }
    });
  }

  checkForRemove(record: PriceListMainModel): Promise<string> {
    return new Promise(async (resolve, reject) => {
      await this.isUsedOnSalesOrder(record.data.primaryKey).then(result => {
        if (result) {
          reject('Sat???? sipari??inde kullan??ld??????ndan silinemez.');
        }
      });
      await this.isUsedOnPurchaseOrder(record.data.primaryKey).then(result => {
        if (result) {
          reject('Al??m sipari??inde kullan??ld??????ndan silinemez.');
        }
      });
      await this.isUsedOnCampaign(record.data.primaryKey).then(result => {
        if (result) {
          reject('Kampanyada kullan??ld??????ndan silinemez.');
        }
      });
      resolve(null);
    });
  }

  clearSubModel(): PriceListModel {

    const returnData = new PriceListModel();
    returnData.primaryKey = null;
    returnData.userPrimaryKey = this.authService.getUid();
    returnData.listName = '';
    returnData.type = '-1';
    returnData.isActive = true;
    returnData.description = '';
    returnData.beginDate = Date.now();
    returnData.finishDate = Date.now();
    returnData.insertDate = Date.now();

    return returnData;
  }

  clearMainModel(): PriceListMainModel {
    const returnData = new PriceListMainModel();
    returnData.data = this.clearSubModel();
    returnData.actionType = 'added';
    returnData.isActiveTr = returnData.data.isActive === true ? 'Aktif' : 'Pasif';
    returnData.typeTr = returnData.data.type === 'sales' ? 'Sat???? Listesi' : 'Al??m Listesi';
    returnData.productList = [];
    return returnData;
  }

  checkFields(model: PriceListModel): PriceListModel {
    const cleanModel = this.clearSubModel();

    return model;
  }

  convertMainModel(model: PriceListModel): PriceListMainModel {
    const returnData = this.clearMainModel();
    returnData.data = this.checkFields(model);
    returnData.isActiveTr = returnData.data.isActive === true ? 'Aktif' : 'Pasif';
    returnData.typeTr = returnData.data.type === 'sales' ? 'Sat???? Listesi' : 'Al??m Listesi';
    returnData.productList = [];
    return returnData;
  }

  getItem(primaryKey: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.collection(this.tableName).doc(primaryKey).get().toPromise().then(doc => {
        if (doc.exists) {
          const data = doc.data() as PriceListModel;
          data.primaryKey = doc.id;
          const returnData = this.convertMainModel(data);
          resolve(Object.assign({ returnData }));
        } else {
          resolve(null);
        }
      });
    });
  }

  getMainItems(): Observable<PriceListMainModel[]> {
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
          const data = c.payload.doc.data() as PriceListModel;
          data.primaryKey = c.payload.doc.id;
          const returnData = this.convertMainModel(data);
          returnData.actionType = c.type;
          return Object.assign({ returnData });
        })
      )
    );
    return this.mainList$;
  }

  getPriceLists = async (isActive: Array<boolean>, type: string):
    Promise<Array<PriceListModel>> => new Promise(async (resolve, reject): Promise<void> => {
      try {
        const list = Array<PriceListModel>();
        await this.db.collection(this.tableName, ref => {
          let query: CollectionReference | Query = ref;
          query = query.where('userPrimaryKey', '==', this.authService.getUid())
            .where('isActive', 'in', isActive)
            .where('type', '==', type);
          return query;
        }).get()
          .subscribe(snapshot => {
            snapshot.forEach(doc => {
              const data = doc.data() as PriceListModel;
              data.primaryKey = doc.id;

              list.push(data);
            });
            resolve(list);
          });

      } catch (error) {
        console.error(error);
        reject({ message: 'Error: ' + error });
      }
    })

  isUsedOnSalesOrder = async (primaryKey: string):
    Promise<boolean> => new Promise(async (resolve, reject): Promise<void> => {
      try {
        this.db.collection('tblSalesOrder', ref => {
          let query: CollectionReference | Query = ref;
          query = query.limit(1).where('priceListPrimaryKey', '==', primaryKey);
          return query;
        }).get().toPromise().then(snapshot => {
          if (snapshot.size > 0) {
            resolve(true);
          } else {
            resolve(false);
          }
        });
      } catch (error) {
        reject({ code: 401, message: error.message });
      }
    })

  isUsedOnPurchaseOrder = async (primaryKey: string):
    Promise<boolean> => new Promise(async (resolve, reject): Promise<void> => {
      try {
        this.db.collection('tblPurchaseOrder', ref => {
          let query: CollectionReference | Query = ref;
          query = query.limit(1).where('priceListPrimaryKey', '==', primaryKey);
          return query;
        }).get().toPromise().then(snapshot => {
          if (snapshot.size > 0) {
            resolve(true);
          } else {
            resolve(false);
          }
        });
      } catch (error) {
        reject({ code: 401, message: error.message });
      }
    })

  isUsedOnCampaign = async (primaryKey: string):
    Promise<boolean> => new Promise(async (resolve, reject): Promise<void> => {
      try {
        this.db.collection('tblCampaign', ref => {
          let query: CollectionReference | Query = ref;
          query = query.limit(1).where('priceListPrimaryKey', '==', primaryKey);
          return query;
        }).get().toPromise().then(snapshot => {
          if (snapshot.size > 0) {
            resolve(true);
          } else {
            resolve(false);
          }
        });
      } catch (error) {
        reject({ code: 401, message: error.message });
      }
    })
}
