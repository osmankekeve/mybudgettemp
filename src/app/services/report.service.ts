import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection, CollectionReference, Query } from '@angular/fire/firestore';
import { Observable } from 'rxjs/Observable';
import { CustomerModel } from '../models/customer-model';
import { SalesInvoiceModel } from '../models/sales-invoice-model';
import { AuthenticationService } from './authentication.service';
import { CustomerService } from './customer.service';
import { AccountTransactionModel } from '../models/account-transaction-model';
import { getModuleIcons, getTransactionTypes } from '../core/correct-library';
import { ProductService } from './product.service';
import { ProductModel } from '../models/product-model';

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  listCollection: AngularFirestoreCollection<SalesInvoiceModel>;
  mainList$: Observable<SalesInvoiceModel[]>;
  customerList$: Observable<CustomerModel[]>;
  transactionTypes = getTransactionTypes();

  constructor(public authService: AuthenticationService,
              public cService: CustomerService, public proService: ProductService,
              public db: AngularFirestore) {

  }

  getCustomerTransactionsWithDateControl = async (customerPrimaryKey: string, startDate: Date, endDate: Date):
    Promise<Array<AccountTransactionModel>> => new Promise(async (resolve, reject): Promise<void> => {
    try {
      const returnList = Array<AccountTransactionModel>();
      const refData = this.db.collection('tblAccountTransaction', ref => {

        let query: CollectionReference | Query = ref;
        query = query.orderBy('insertDate')
          .where('parentPrimaryKey', '==', customerPrimaryKey)
          .where('parentType', '==', 'customer');

        if (startDate !== undefined) {
          query = query.startAt(startDate.getTime());
        }
        if (endDate !== undefined) {
          query = query.endAt(endDate.getTime());
        }

        return query;
      });
      refData.get().subscribe(snapshot => {
        snapshot.forEach(doc => {
          const data = doc.data();
          data.primaryKey = doc.id;
          data.transactionTypeTr = this.transactionTypes.get(data.transactionType);
          data.iconUrl = getModuleIcons().get(data.transactionType);
          returnList.push(data);
        });
        resolve(returnList);
      });
    } catch (error) {
      console.error(error);
      reject({code: 401, message: 'You do not have permission or there is a problem about permissions!'});
    }
  })

  getAllAccountTransactions = async (customerPrimaryKey: string, startDate: Date, endDate: Date, filterBalance: string):
    Promise<Array<AccountTransactionModel>> => new Promise(async (resolve, reject): Promise<void> => {
    try {
      const list = Array<any>();
      Promise.all([this.cService.getCustomersForReport(customerPrimaryKey, true)])
        .then((values: any) => {
          if (values[0] !== undefined || values[0] !== null) {
            const returnData = values[0] as Array<CustomerModel>;
            returnData.forEach(item => {
              const dataReport = {
                stringField1: item.name,
                numberField1 : 0,
                numberField2 : 0,
                numberField3 : 0,
                numberField4 : 0,
                numberField5 : 0,
                numberField6 : 0
              };

              Promise.all([this.getCustomerTransactionsWithDateControl(item.primaryKey, startDate, endDate)])
                .then((values2: any) => {
                  if (values2[0] !== undefined || values2[0] !== null) {
                    const returnData2 = values2[0] as Array<AccountTransactionModel>;
                    returnData2.forEach(item2 => {
                      if (item2.transactionType === 'salesInvoice') {
                        dataReport.numberField1 += item2.amount;
                      } else if (item2.transactionType === 'collection') {
                        dataReport.numberField2 += item2.amount;
                      } else if (item2.transactionType === 'purchaseInvoice') {
                        dataReport.numberField3 += item2.amount;
                      } else if (item2.transactionType === 'payment') {
                        dataReport.numberField4 += item2.amount;
                      } else if (item2.transactionType === 'voucher') {
                        dataReport.numberField5 += item2.amount;
                      } else {

                      }
                      dataReport.numberField6 += item2.amount;
                    });
                    if (filterBalance === '1' && dataReport.numberField6 !== 0) {
                      list.push(dataReport);
                    }
                    if (filterBalance === '0' && dataReport.numberField6 === 0) {
                      list.push(dataReport);
                    }
                    if (filterBalance === '-1') {
                      list.push(dataReport);
                    }
                  }
                }).finally(() => {
                resolve(list);
              });
            });
          }
        });

    } catch (error) {
      console.error(error);
      reject({code: 401, message: 'You do not have permission or there is a problem about permissions!'});
    }
  })

  getProductsPurchaseSKU = async (startDate: Date, endDate: Date):
    Promise<Array<any>> => new Promise(async (resolve, reject): Promise<void> => {
      try {
        const list = Array<any>();
        this.db.collection('tblProduct', ref => {
          let query: CollectionReference | Query = ref;
          query = query.where('userPrimaryKey', '==', this.authService.getUid());
          return query;
        })
          .get().toPromise().then(snapshot => {
          snapshot.forEach(doc => {
            const data = doc.data() as ProductModel;
            const returnData = this.proService.convertMainModel(data);

            const addData = {
              productPrimaryKey: returnData.data.primaryKey,
              productCode: returnData.data.productCode,
              productName: returnData.data.productName,
              productStockType: returnData.stockTypeTr,
              sku: 0
            };

            this.db.collection('tblPurchaseInvoiceDetail', ref => {
              let query: CollectionReference | Query = ref;
              query = query.where('productPrimaryKey', '==', addData.productPrimaryKey);
              return query;
            })
              .get().toPromise().then(snapshot2 => {
                addData.sku = snapshot2.size;
                list.push(addData);
            });
          });
          resolve(list);
        });
      } catch (error) {
        console.error(error);
        reject({code: 401, message: 'You do not have permission or there is a problem about permissions!'});
      }
  })
}
