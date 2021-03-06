import {Injectable} from '@angular/core';
import {AngularFirestore, AngularFirestoreCollection, CollectionReference, Query} from '@angular/fire/firestore';
import {Observable} from 'rxjs/Observable';
import {map, mergeMap} from 'rxjs/operators';
import {AuthenticationService} from './authentication.service';
import {LogService} from './log.service';
import {ProfileService} from './profile.service';
import {ActionService} from './action.service';
import {ProductUnitMainModel} from '../models/product-unit-main-model';
import {ProductUnitModel} from '../models/product-unit-model';
import { ProductUnitMappingModel } from '../models/product-unit-mapping-model';

@Injectable({
  providedIn: 'root'
})
export class ProductUnitService {
  listCollection: AngularFirestoreCollection<ProductUnitModel>;
  mainList$: Observable<ProductUnitMainModel[]>;
  tableName = 'tblProductUnit';

  constructor(protected authService: AuthenticationService, protected actService: ActionService,
              protected logService: LogService, protected eService: ProfileService, protected db: AngularFirestore) {
                this.listCollection = this.db.collection(this.tableName);

  }

  async addItem(record: ProductUnitMainModel) {
    return await this.listCollection.add(Object.assign({}, record.data))
      .then(async () => {
        await this.logService.addTransactionLog(record, 'insert', 'product-unit');
      });
  }

  async removeItem(record: ProductUnitMainModel) {
    return await this.db.collection(this.tableName).doc(record.data.primaryKey).delete()
      .then(async () => {
        await this.getUnitProductsAsync(record.data.primaryKey)
            .then((list) => {
              list.forEach(async item => {
                await this.db.collection('tblProductUnitMapping').doc(item.primaryKey).delete();
              });
            });
        await this.logService.addTransactionLog(record, 'delete', 'product-unit');
      });
  }

  async updateItem(record: ProductUnitMainModel) {
    return await this.db.collection(this.tableName).doc(record.data.primaryKey)
      .update(Object.assign({}, record.data))
      .then(async value => {
        await this.logService.addTransactionLog(record, 'update', 'product-unit');
      });
  }

  async setItem(record: ProductUnitMainModel, primaryKey: string) {
    return await this.listCollection.doc(primaryKey).set(Object.assign({}, record.data))
      .then(async value => {
        await this.logService.addTransactionLog(record, 'insert', 'product-unit');
      });
  }

  checkForSave(record: ProductUnitMainModel): Promise<string> {
    return new Promise((resolve, reject) => {
      if (record.data.unitName === '') {
        reject('L??tfen birim ad?? giriniz.');
      } else {
        resolve(null);
      }
    });
  }

  checkForRemove(record: ProductUnitMainModel): Promise<string> {
    return new Promise(async (resolve, reject) => {
      await this.isUnitUsedOnProduct(record.data.primaryKey).then(result => {
        if (result) {
          reject('Birim, ??r??n kart??nda oldu??undan silinemez.');
        }
      });
      await this.isUsedOnSalesOrderDetail(record.data.primaryKey).then(result => {
        if (result) {
          reject('Birim, sat???? teklifinde kullan??ld??????ndan silinemez.');
        }
      });
      await this.isUsedOnPurchaseOrderDetail(record.data.primaryKey).then(result => {
        if (result) {
          reject('Birim, alim teklifinde kullan??ld??????ndan silinemez.');
        }
      });
      await this.isUsedOnPacketCampaignDetail(record.data.primaryKey).then(result => {
        if (result) {
          reject('Birim, paket kampanyada kullan??ld??????ndan silinemez.');
        }
      });
      resolve(null);
    });
  }

  clearSubModel(): ProductUnitModel {

    const returnData = new ProductUnitModel();
    returnData.primaryKey = null;
    returnData.userPrimaryKey = this.authService.getUid();
    returnData.employeePrimaryKey = this.authService.getEid();
    returnData.unitName = '';
    returnData.isActive = true;
    returnData.insertDate = Date.now();

    return returnData;
  }

  clearMainModel(): ProductUnitMainModel {
    const returnData = new ProductUnitMainModel();
    returnData.data = this.clearSubModel();
    returnData.actionType = 'added';
    returnData.isActiveTr = returnData.data.isActive === true ? 'Aktif' : 'Pasif';
    return returnData;
  }

  checkFields(model: ProductUnitModel): ProductUnitModel {
    const cleanModel = this.clearSubModel();

    return model;
  }

  getItem(primaryKey: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.collection(this.tableName).doc(primaryKey).get().toPromise().then(doc => {
        if (doc.exists) {
          const data = doc.data() as ProductUnitModel;
          data.primaryKey = doc.id;

          const returnData = new ProductUnitMainModel();
          returnData.data = this.checkFields(data);
          returnData.isActiveTr = returnData.data.isActive === true ? 'Aktif' : 'Pasif';
          resolve(Object.assign({returnData}));
        } else {
          resolve(null);
        }
      });
    });
  }

  getMainItems(): Observable<ProductUnitMainModel[]> {
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
          const data = c.payload.doc.data() as ProductUnitModel;
          data.primaryKey = c.payload.doc.id;

          const returnData = new ProductUnitMainModel();
          returnData.data = this.checkFields(data);
          returnData.actionType = c.type;
          returnData.isActiveTr = returnData.data.isActive === true ? 'Aktif' : 'Pasif';
          return Object.assign({returnData});
        })
      )
    );
    return this.mainList$;
  }

  getItemsForSelect = async ():
    Promise<Array<ProductUnitModel>> => new Promise(async (resolve, reject): Promise<void> => {
    try {
      const list = Array<ProductUnitModel>();
      this.db.collection(this.tableName, ref => {
        let query: CollectionReference | Query = ref;
        query = query.orderBy('unitName', 'asc')
          .where('userPrimaryKey', '==', this.authService.getUid())
          .where('isActive', '==', true);
        return query;
      })
        .get().toPromise().then(snapshot => {
        snapshot.forEach(doc => {
          let data = doc.data() as ProductUnitModel;
          data.primaryKey = doc.id;
          data = this.checkFields(data);
          list.push(data);
        });
        resolve(list);
      });

    } catch (error) {
      console.error(error);
      reject({message: 'Error: ' + error});
    }
  })

  getUnitProductsAsync = async (unitPrimaryKey: string):
    Promise<Array<ProductUnitMappingModel>> => new Promise(async (resolve, reject): Promise<void> => {
    try {
      const list = Array<ProductUnitMappingModel>();
      this.db.collection(this.tableName, ref => {
        let query: CollectionReference | Query = ref;
        query = query.where('userPrimaryKey', '==', this.authService.getUid())
          .where('unitPrimaryKey', '==', unitPrimaryKey);
        return query;
      })
        .get().toPromise().then(snapshot => {
        snapshot.forEach(doc => {
          const data = doc.data() as ProductUnitMappingModel;
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

  isUnitUsedOnProduct = async (primaryKey: string):
    Promise<boolean> => new Promise(async (resolve, reject): Promise<void> => {
    try {
      this.db.collection('tblProduct', ref => {
        let query: CollectionReference | Query = ref;
        query = query.limit(1).where('userPrimaryKey', '==', this.authService.getUid())
          .where('defaultUnitCode', '==', primaryKey);
        return query;
      }).get().toPromise().then(snapshot => {
        if (snapshot.size > 0) {
          resolve(true);
        } else {
          resolve(false);
        }
      });
    } catch (error) {
      console.error(error);
      reject({message: 'Error: ' + error});
    }
  })

  isUnitUsedOnProductMapping = async (primaryKey: string):
    Promise<boolean> => new Promise(async (resolve, reject): Promise<void> => {
    try {
      this.db.collection('tblProductUnitMapping', ref => {
        let query: CollectionReference | Query = ref;
        query = query.limit(1).where('unitPrimaryKey', '==', primaryKey);
        return query;
      }).get().toPromise().then(snapshot => {
        if (snapshot.size > 0) {
          resolve(true);
        } else {
          resolve(false);
        }
      });
    } catch (error) {
      console.error(error);
      reject({message: 'Error: ' + error});
    }
  })

  isUsedOnSalesOrderDetail = async (primaryKey: string):
    Promise<boolean> => new Promise(async (resolve, reject): Promise<void> => {
    try {
      this.db.collection('tblSalesOrderDetail', ref => {
        let query: CollectionReference | Query = ref;
        query = query.limit(1)
          .where('unitPrimaryKey', '==', primaryKey);
        return query;
      }).get().toPromise().then(snapshot => {
        if (snapshot.size > 0) {
          resolve(true);
        } else {
          resolve(false);
        }
      });
    } catch (error) {
      console.error(error);
      reject({message: 'Error: ' + error});
    }
  })

  isUsedOnPurchaseOrderDetail = async (primaryKey: string):
    Promise<boolean> => new Promise(async (resolve, reject): Promise<void> => {
    try {
      this.db.collection('tblPurchaseOrderDetail', ref => {
        let query: CollectionReference | Query = ref;
        query = query.limit(1)
          .where('unitPrimaryKey', '==', primaryKey);
        return query;
      }).get().toPromise().then(snapshot => {
        if (snapshot.size > 0) {
          resolve(true);
        } else {
          resolve(false);
        }
      });
    } catch (error) {
      console.error(error);
      reject({message: 'Error: ' + error});
    }
  })

  isUsedOnPacketCampaignDetail = async (primaryKey: string):
    Promise<boolean> => new Promise(async (resolve, reject): Promise<void> => {
    try {
      this.db.collection('tblCampaignDetail', ref => {
        let query: CollectionReference | Query = ref;
        query = query.limit(1)
          .where('unitPrimaryKey', '==', primaryKey);
        return query;
      }).get().toPromise().then(snapshot => {
        if (snapshot.size > 0) {
          resolve(true);
        } else {
          resolve(false);
        }
      });
    } catch (error) {
      console.error(error);
      reject({message: 'Error: ' + error});
    }
  })
}
