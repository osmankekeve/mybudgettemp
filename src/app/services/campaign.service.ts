import {Injectable} from '@angular/core';
import {AngularFirestore, AngularFirestoreCollection, CollectionReference, Query} from '@angular/fire/firestore';
import {Observable} from 'rxjs/Observable';
import {map} from 'rxjs/operators';
import {AuthenticationService} from './authentication.service';
import {LogService} from './log.service';
import {
  getCampaignType,
  getDateTimeForQueryFilter,
  getDateTimeNow} from '../core/correct-library';
import {AccountTransactionService} from './account-transaction.service';
import {PriceListService} from './price-list.service';
import {DiscountListService} from './discount-list.service';
import { CampaignModel } from '../models/campaign-model';
import { CampaignMainModel } from '../models/campaign-main-model';
import { CampaignDetailService } from './campaign-detail.service';

@Injectable({
  providedIn: 'root'
})
export class CampaignService {
  listCollection: AngularFirestoreCollection<CampaignModel>;
  mainList$: Observable<CampaignMainModel[]>;
  employeeMap = new Map();
  tableName = 'tblCampaign';

  constructor(protected authService: AuthenticationService, protected logService: LogService, protected db: AngularFirestore,
              protected atService: AccountTransactionService, protected cdService: CampaignDetailService,
              protected plService: PriceListService, protected dService: DiscountListService) {
    this.listCollection = this.db.collection(this.tableName);
  }

  async removeItem(record: CampaignMainModel) {
    return await this.db.collection(this.tableName).doc(record.data.primaryKey).delete()
      .then(async () => {
        for (const item of record.detailList) {
          await this.db.collection(this.cdService.tableName).doc(item.data.primaryKey).delete();
        }
        await this.logService.addTransactionLog(record, 'delete', 'campaign');
      });
  }

  async updateItem(record: CampaignMainModel) {
    return await this.db.collection(this.tableName).doc(record.data.primaryKey).update(Object.assign({}, record.data))
      .then(async () => {
        await this.cdService.getMainItemsWithPrimaryKey(record.data.primaryKey)
        .then((list) => {
          list.forEach(async item => {
            await this.db.collection(this.cdService.tableName).doc(item.data.primaryKey).delete();
          });
        });
        for (const item of record.detailList) {
        await this.db.collection(this.cdService.tableName).doc(item.data.primaryKey).set(Object.assign({}, item.data));
      }
        await this.logService.addTransactionLog(record, 'update', 'campaign');
      });
  }

  async setItem(record: CampaignMainModel, primaryKey: string) {
    return await this.listCollection.doc(primaryKey).set(Object.assign({}, record.data))
      .then(async () => {
        await this.cdService.getMainItemsWithPrimaryKey(record.data.primaryKey)
          .then((list) => {
            list.forEach(async item => {
              await this.db.collection(this.cdService.tableName).doc(item.data.primaryKey).delete();
            });
          });
        for (const item of record.detailList) {
          await this.db.collection(this.cdService.tableName).doc(item.data.primaryKey).set(Object.assign({}, item.data));
        }
        await this.logService.addTransactionLog(record, 'insert', 'campaign');
      });
  }

  checkForSave(record: CampaignMainModel): Promise<string> {
    return new Promise(async (resolve, reject) => {
      await this.isCampaignCodeExist(record.data.code, record.data.primaryKey).then(result => {
        if (result) {
          reject('Kampanya kodu sistemde mevcut, lütfen farklı bir kod giriniz.');
        }
      });
      if (record.data.code === '') {
        reject('Lütfen kampanya kodu giriniz.');
      } else if (record.data.title === '') {
        reject('Lütfen kampanya başlık giriniz.');
      } else if (record.data.priceListPrimaryKey === '-1') {
        reject('Lütfen fiyat listesi seçiniz.');
      } else if (record.data.discountListPrimaryKey === '-1') {
        reject('Lütfen iskonto listesi seçiniz.');
      } else if (record.data.type === 'packet' && record.detailList.length === 0) {
        reject('Boş sipariş kaydedilemez.');
      } else {
        resolve(null);
      }
    });
  }

  checkForRemove(record: CampaignMainModel): Promise<string> {
    return new Promise(async (resolve, reject) => {
      await this.isUsedOnSalesOrder(record.data.primaryKey).then(result => {
        if (result) {
          reject('Kampanya satış teklifinde kullanıldığından silinemez.');
        }
      });
      await this.isUsedOnSalesOrderDetail(record.data.primaryKey).then(result => {
        if (result) {
          reject('Kampanya satış teklif detayında kullanıldığından silinemez.');
        }
      });
      resolve(null);
    });
  }

  checkFields(model: CampaignModel): CampaignModel {

    return model;
  }

  clearSubModel(): CampaignModel {
    const returnData = new CampaignModel();
    returnData.primaryKey = null;
    returnData.code = '';
    returnData.title = '';
    returnData.userPrimaryKey = this.authService.getUid();
    returnData.priceListPrimaryKey = '-1';
    returnData.discountListPrimaryKey = '-1';
    returnData.description = '';
    returnData.type = 'normal'; // normal, packet
    returnData.platform = 'web'; // mobile, web
    returnData.insertDate = Date.now();

    return returnData;
  }

  clearMainModel(): CampaignMainModel {
    const returnData = new CampaignMainModel();
    returnData.data = this.clearSubModel();
    returnData.actionType = 'added';
    returnData.isAvaliableForNewDetail = true;
    returnData.typeTr = getCampaignType().get(returnData.data.type);
    returnData.platformTr = returnData.data.platform === 'web' ? 'Web' : 'Mobil';
    return returnData;
  }

  convertMainModel(model: CampaignModel): CampaignMainModel {
    const returnData = this.clearMainModel();
    returnData.data = this.checkFields(model);
    returnData.typeTr = getCampaignType().get(returnData.data.type);
    returnData.platformTr = returnData.data.platform === 'web' ? 'Web' : 'Mobil';
    return returnData;
  }

  getItem(primaryKey: string): Promise<any> {
    return new Promise((resolve) => {
      this.db.collection(this.tableName).doc(primaryKey).get().toPromise().then(async doc => {
        if (doc.exists) {
          const data = doc.data() as CampaignModel;
          data.primaryKey = doc.id;

          const returnData = this.convertMainModel(data);
          returnData.data = this.checkFields(data);
          returnData.typeTr = getCampaignType().get(returnData.data.type);
          returnData.platformTr = returnData.data.platform === 'web' ? 'Web' : 'Mobil';
          if (returnData.data.type === 'packet') {
            await this.isUsedOnSalesOrder(primaryKey).then(result => {
              if (result) {
                returnData.isAvaliableForNewDetail = !result;
              }
            });
          }
          resolve(Object.assign({returnData}));
        } else {
          resolve(null);
        }
      });
    });
  }

  getMainItems(): Observable<CampaignMainModel[]> {
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
          const data = c.payload.doc.data() as CampaignModel;
          data.primaryKey = c.payload.doc.id;

          const returnData = new CampaignMainModel();
          returnData.data = this.checkFields(data);
          returnData.actionType = c.type;
          returnData.typeTr = getCampaignType().get(returnData.data.type);
          returnData.platformTr = returnData.data.platform === 'web' ? 'Web' : 'Mobil';
          return Object.assign({returnData});
        })
      )
    );
    return this.mainList$;
  }

  getMainItemsBetweenDates(startDate: Date, endDate: Date): Observable<CampaignMainModel[]> {
    // left join siz
    this.listCollection = this.db.collection(this.tableName,
      ref => {
        let query: CollectionReference | Query = ref;
        query = query.orderBy('beginDate').where('userPrimaryKey', '==', this.authService.getUid());
        if (startDate !== null) {
          query = query.startAt(startDate.getTime());
        }
        if (endDate !== null) {
          query = query.endAt(endDate.getTime());
        }
        return query;
      });
    this.mainList$ = this.listCollection.stateChanges().pipe(
      map(changes =>
        changes.map(c => {
          const data = c.payload.doc.data() as CampaignModel;
          data.primaryKey = c.payload.doc.id;

          const returnData = new CampaignMainModel();
          returnData.data = this.checkFields(data);
          returnData.actionType = c.type;
          returnData.typeTr = getCampaignType().get(returnData.data.type);
          returnData.platformTr = returnData.data.platform === 'web' ? 'Web' : 'Mobil';
          return Object.assign({returnData});
        })
      )
    );
    return this.mainList$;
  }

  getAvaliableCampaignsAsPromise = async (type: string):
    Promise<Array<CampaignModel>> => new Promise(async (resolve, reject): Promise<void> => {
    try {
      const list = Array<CampaignModel>();
      this.db.collection(this.tableName, ref => {
        let query: CollectionReference | Query = ref;
        query = query
        .where('userPrimaryKey', '==', this.authService.getUid())
        .where('type', '==', type);
        return query;
      }).get().subscribe(snapshot => {
        snapshot.forEach(doc => {
          const data = doc.data() as CampaignModel;
          data.primaryKey = doc.id;
          const dataDateNow = getDateTimeNow();
          if (((getDateTimeForQueryFilter(data.beginDate) <= getDateTimeForQueryFilter(dataDateNow)))
          && ((getDateTimeForQueryFilter(data.finishDate) >= getDateTimeForQueryFilter(dataDateNow)))) {
            list.push(data);
          }
        });
        resolve(list);
      });

    } catch (error) {
      console.error(error);
      reject({code: 401, message: 'You do not have permission or there is a problem about permissions!'});
    }
  })

  isCampaignCodeExist = async (code: string, primaryKey: string):
    Promise<boolean> => new Promise(async (resolve, reject): Promise<void> => {
    try {
      this.db.collection(this.tableName, ref => {
        let query: CollectionReference | Query = ref;
        query = query.limit(1).where('code', '==', code).where('primaryKey', '!=', primaryKey);
        return query;
      }).get().subscribe(snapshot => {
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

  isUsedOnSalesOrder = async (primaryKey: string):
    Promise<boolean> => new Promise(async (resolve, reject): Promise<void> => {
    try {
      this.db.collection('tblSalesOrder', ref => {
        let query: CollectionReference | Query = ref;
        query = query.limit(1).where('campaignPrimaryKey', '==', primaryKey);
        return query;
      }).get().subscribe(snapshot => {
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

  isUsedOnSalesOrderDetail = async (primaryKey: string):
    Promise<boolean> => new Promise(async (resolve, reject): Promise<void> => {
    try {
      this.db.collection('tblSalesOrderDetail', ref => {
        let query: CollectionReference | Query = ref;
        query = query.limit(1).where('campaignPrimaryKey', '==', primaryKey);
        return query;
      }).get().subscribe(snapshot => {
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
