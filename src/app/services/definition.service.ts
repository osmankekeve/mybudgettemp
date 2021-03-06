import {Injectable} from '@angular/core';
import {AngularFirestore, AngularFirestoreCollection, CollectionReference, Query} from '@angular/fire/firestore';
import {Observable} from 'rxjs/Observable';
import {map} from 'rxjs/operators';
import {AuthenticationService} from './authentication.service';
import {LogService} from './log.service';
import {DefinitionModel} from '../models/definition-model';
import {DefinitionMainModel} from '../models/definition-main-model';

@Injectable({
  providedIn: 'root'
})
export class DefinitionService {
  listCollection: AngularFirestoreCollection<DefinitionModel>;
  mainList$: Observable<DefinitionMainModel[]>;
  tableName = 'tblDefinition';

  constructor(protected authService: AuthenticationService, protected logService: LogService, protected db: AngularFirestore) {

  }

  async addItem(record: DefinitionMainModel) {
    return await this.listCollection.add(Object.assign({}, record.data));
  }

  async removeItem(record: DefinitionMainModel) {
    return await this.db.collection(this.tableName).doc(record.data.primaryKey).delete();
  }

  async updateItem(record: DefinitionMainModel) {
    return await this.db.collection(this.tableName).doc(record.data.primaryKey)
      .update(Object.assign({}, record.data));
  }

  async setItem(record: DefinitionMainModel, primaryKey: string) {
    return await this.listCollection.doc(primaryKey).set(Object.assign({}, record.data));
  }

  checkForSave(record: DefinitionMainModel): Promise<string> {
    return new Promise((resolve, reject) => {
      if (record.data.key === '') {
        reject('Lütfen key giriniz.');
      } else if (record.data.typeKey === '') {
        reject('Lütfen tip giriniz.');
      } else {
        resolve(null);
      }
    });
  }

  checkForRemove(record: DefinitionMainModel): Promise<string> {
    return new Promise(async (resolve, reject) => {
      if (record.data.typeKey === 'storage') {
        await this.isStorageUsedOnSalesOrder(record.data.primaryKey).then(result => {
          if (result) {
            reject('Satış siparişinde kullanıldığından silinemez.');
          }
        });
        await this.isStorageUsedOnPurchaseOrder(record.data.primaryKey).then(result => {
          if (result) {
            reject('Alım siparişinde kullanıldığından silinemez.');
          }
        });
      }
      if (record.data.typeKey === 'term') {
        await this.isTermUsedOnCustomer(record.data.primaryKey).then(result => {
          if (result) {
            reject('Müşteride kullanıldığından silinemez.');
          }
        });
        await this.isTermUsedOnSalesOrder(record.data.primaryKey).then(result => {
          if (result) {
            reject('Satış siparişinde kullanıldığından silinemez.');
          }
        });
        await this.isTermUsedOnPurchaseOrder(record.data.primaryKey).then(result => {
          if (result) {
            reject('Alım siparişinde kullanıldığından silinemez.');
          }
        });
      }
      if (record.data.typeKey === 'payment-type') {
        await this.isPaymentTypeUsedOnCustomer(record.data.primaryKey).then(result => {
          if (result) {
            reject('Müşteride kullanıldığından silinemez.');
          }
        });
        await this.isPaymentTypeUsedOnSalesOrder(record.data.primaryKey).then(result => {
          if (result) {
            reject('Satış siparişinde kullanıldığından silinemez.');
          }
        });
        await this.isPaymentTypeUsedOnPurchaseOrder(record.data.primaryKey).then(result => {
          if (result) {
            reject('Alım siparişinde kullanıldığından silinemez.');
          }
        });
      }
      resolve(null);
    });
  }

  clearSubModel(): DefinitionModel {

    const returnData = new DefinitionModel();
    returnData.primaryKey = null;
    returnData.userPrimaryKey = this.authService.getUid();
    returnData.employeePrimaryKey = this.authService.getEid();
    returnData.key = '';
    returnData.typeKey = '';
    returnData.custom1 = '';
    returnData.custom2 = '';
    returnData.custom3 = '';
    returnData.customDouble = 0;
    returnData.customBool = false;
    returnData.isActive = true;
    returnData.insertDate = Date.now();

    return returnData;
  }

  clearMainModel(): DefinitionMainModel {
    const returnData = new DefinitionMainModel();
    returnData.data = this.clearSubModel();
    returnData.actionType = 'added';
    returnData.isActiveTr = returnData.data.isActive === true ? 'Aktif' : 'Pasif';
    return returnData;
  }

  checkFields(model: DefinitionModel): DefinitionModel {
    const cleanModel = this.clearSubModel();

    return model;
  }

  convertMainModel(model: DefinitionModel): DefinitionMainModel {
    const returnData = this.clearMainModel();
    returnData.data = this.checkFields(model);
    returnData.isActiveTr = returnData.data.isActive === true ? 'Aktif' : 'Pasif';
    return returnData;
  }

  getItem(primaryKey: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.collection(this.tableName).doc(primaryKey).get().toPromise().then(doc => {
        if (doc.exists) {
          const data = doc.data() as DefinitionModel;
          data.primaryKey = doc.id;

          const returnData = this.convertMainModel(data);
          resolve(Object.assign({returnData}));
        } else {
          resolve(null);
        }
      });
    });
  }

  getMainItems(typKey: string): Observable<DefinitionMainModel[]> {
    // left join siz
    this.listCollection = this.db.collection(this.tableName,
      ref => {
        let query: CollectionReference | Query = ref;
        query = query.orderBy('custom1', 'asc').where('userPrimaryKey', '==', this.authService.getUid())
          .where('typeKey', '==', typKey);
        return query;
      });
    this.mainList$ = this.listCollection.stateChanges().pipe(
      map(changes =>
        changes.map(c => {
          const data = c.payload.doc.data() as DefinitionModel;
          data.primaryKey = c.payload.doc.id;

          const returnData = this.convertMainModel(data);
          returnData.actionType = c.type;
          return Object.assign({returnData});
        })
      )
    );
    return this.mainList$;
  }

  getItemsForFill = async (typeKey: string):
    Promise<Array<DefinitionModel>> => new Promise(async (resolve, reject): Promise<void> => {
    try {
      const list = Array<DefinitionModel>();
      await this.db.collection(this.tableName, ref => {
        let query: CollectionReference | Query = ref;
        query = query.where('userPrimaryKey', '==', this.authService.getUid())
          .where('typeKey', '==', typeKey);
        return query;
      }).get()
        .subscribe(snapshot => {
          snapshot.forEach(doc => {
            const data = doc.data() as DefinitionModel;
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

  isStorageUsedOnSalesOrder = async (primaryKey: string):
    Promise<boolean> => new Promise(async (resolve, reject): Promise<void> => {
    try {
      this.db.collection('tblSalesOrder', ref => {
        let query: CollectionReference | Query = ref;
        query = query.limit(1).where('storagePrimaryKey', '==', primaryKey);
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

  isStorageUsedOnPurchaseOrder = async (primaryKey: string):
    Promise<boolean> => new Promise(async (resolve, reject): Promise<void> => {
    try {
      this.db.collection('tblPurchaseOrder', ref => {
        let query: CollectionReference | Query = ref;
        query = query.limit(1).where('storagePrimaryKey', '==', primaryKey);
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

  isTermUsedOnCustomer = async (primaryKey: string):
    Promise<boolean> => new Promise(async (resolve, reject): Promise<void> => {
    try {
      this.db.collection('tblCustomer', ref => {
        let query: CollectionReference | Query = ref;
        query = query.limit(1).where('termKey', '==', primaryKey);
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

  isTermUsedOnSalesOrder = async (primaryKey: string):
    Promise<boolean> => new Promise(async (resolve, reject): Promise<void> => {
    try {
      this.db.collection('tblSalesOrder', ref => {
        let query: CollectionReference | Query = ref;
        query = query.limit(1).where('termPrimaryKey', '==', primaryKey);
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

  isTermUsedOnPurchaseOrder = async (primaryKey: string):
    Promise<boolean> => new Promise(async (resolve, reject): Promise<void> => {
    try {
      this.db.collection('tblPurchaseOrder', ref => {
        let query: CollectionReference | Query = ref;
        query = query.limit(1).where('termPrimaryKey', '==', primaryKey);
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

  isPaymentTypeUsedOnCustomer = async (primaryKey: string):
    Promise<boolean> => new Promise(async (resolve, reject): Promise<void> => {
    try {
      this.db.collection('tblCustomer', ref => {
        let query: CollectionReference | Query = ref;
        query = query.limit(1).where('paymentTypeKey', '==', primaryKey);
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

  isPaymentTypeUsedOnSalesOrder = async (primaryKey: string):
    Promise<boolean> => new Promise(async (resolve, reject): Promise<void> => {
    try {
      this.db.collection('tblSalesOrder', ref => {
        let query: CollectionReference | Query = ref;
        query = query.limit(1).where('paymentTypePrimaryKey', '==', primaryKey);
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

  isPaymentTypeUsedOnPurchaseOrder = async (primaryKey: string):
    Promise<boolean> => new Promise(async (resolve, reject): Promise<void> => {
    try {
      this.db.collection('tblPurchaseOrder', ref => {
        let query: CollectionReference | Query = ref;
        query = query.limit(1).where('paymentTypePrimaryKey', '==', primaryKey);
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
