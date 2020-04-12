import {Component, OnInit, OnDestroy, ElementRef} from '@angular/core';
import {AngularFirestore} from '@angular/fire/firestore';
import {InformationService} from '../services/information.service';
import {AuthenticationService} from '../services/authentication.service';
import {CustomerTargetMainModel} from '../models/customer-target-main-model';
import {CustomerTargetService} from '../services/customer-target.service';
import {Observable} from 'rxjs';
import {CustomerModel} from '../models/customer-model';
import {CustomerService} from '../services/customer.service';
import {
  getFloat,
  getNumber,
  getTodayForInput,
  getBeginOfYear,
  getEndOfYear,
  getEncryptionKey, currencyFormat, moneyFormat
} from '../core/correct-library';
import {CollectionService} from '../services/collection.service';
import * as CryptoJS from 'crypto-js';
import {Router, ActivatedRoute} from '@angular/router';
import {CollectionMainModel} from '../models/collection-main-model';
import {RouterModel} from '../models/router-model';
import {GlobalService} from '../services/global.service';

@Component({
  selector: 'app-customer-target',
  templateUrl: './customer-target.component.html',
  styleUrls: ['./customer-target.component.css']
})
export class CustomerTargetComponent implements OnInit {
  mainList1: Array<CustomerTargetMainModel> = [];
  mainList2: Array<CustomerTargetMainModel> = [];
  mainList3: Array<CustomerTargetMainModel> = [];
  selectedRecord: CustomerTargetMainModel;
  customerList$: Observable<CustomerModel[]>;
  transactionList$: Observable<CollectionMainModel[]>;
  currentAmount = 0;
  encryptSecretKey: string = getEncryptionKey();
  onTransaction = false;
  searchText = '';

  constructor(public authService: AuthenticationService, public route: Router, public router: ActivatedRoute,
              public infoService: InformationService, public colService: CollectionService, public globService: GlobalService,
              public cService: CustomerService, public service: CustomerTargetService, public db: AngularFirestore) {
  }

  async ngOnInit() {
    this.customerList$ = this.cService.getAllItems();
    this.populateList();
    this.selectedRecord = undefined;

    if (this.router.snapshot.paramMap.get('paramItem') !== null) {
      const bytes = CryptoJS.AES.decrypt(this.router.snapshot.paramMap.get('paramItem'), this.encryptSecretKey);
      const paramItem = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
      if (paramItem) {
        this.showSelectedRecord(paramItem.returnData);
      }
    }
  }

  populateList(): void {
    this.mainList1 = undefined;
    this.mainList2 = undefined;
    this.mainList3 = undefined;
    this.service.getMainItems().subscribe(list => {
      if (this.mainList1 === undefined) {
        this.mainList1 = [];
      }
      if (this.mainList2 === undefined) {
        this.mainList2 = [];
      }
      if (this.mainList3 === undefined) {
        this.mainList3 = [];
      }
      list.forEach((data: any) => {
        const item = data.returnData as CustomerTargetMainModel;
        if (item.actionType === 'added') {
          if (item.data.type === 'yearly') {
            this.mainList1.push(item);
          }
          if (item.data.type === 'monthly') {
            this.mainList2.push(item);
          }
          if (item.data.type === 'periodic') {
            this.mainList3.push(item);
          }
        }
        if (item.actionType === 'removed') {
          if (item.data.type === 'yearly') {
            for (let i = 0; i < this.mainList1.length; i++) {
              if (item.data.primaryKey === this.mainList1[i].data.primaryKey) {
                this.mainList1.splice(i, 1);
                break;
              }
            }
          }
          if (item.data.type === 'monthly') {
            for (let i = 0; i < this.mainList2.length; i++) {
              if (item.data.primaryKey === this.mainList2[i].data.primaryKey) {
                this.mainList2.splice(i, 1);
                break;
              }
            }
          }
          if (item.data.type === 'periodic') {
            for (let i = 0; i < this.mainList3.length; i++) {
              if (item.data.primaryKey === this.mainList3[i].data.primaryKey) {
                this.mainList3.splice(i, 1);
                break;
              }
            }
          }
        }
        if (item.actionType === 'modified') {
          if (item.data.type === 'yearly') {
            for (let i = 0; i < this.mainList1.length; i++) {
              if (item.data.primaryKey === this.mainList1[i].data.primaryKey) {
                this.mainList1[i] = item;
                break;
              }
            }
          }
          if (item.data.type === 'monthly') {
            for (let i = 0; i < this.mainList2.length; i++) {
              if (item.data.primaryKey === this.mainList2[i].data.primaryKey) {
                this.mainList2[i] = item;
                break;
              }
            }
          }
          if (item.data.type === 'periodic') {
            for (let i = 0; i < this.mainList3.length; i++) {
              if (item.data.primaryKey === this.mainList3[i].data.primaryKey) {
                this.mainList3[i] = item;
                break;
              }
            }
          }
        }
      });
    });
    setTimeout(() => {
      if (this.mainList1 === undefined) {
        this.mainList1 = [];
      }
      if (this.mainList2 === undefined) {
        this.mainList2 = [];
      }
      if (this.mainList3 === undefined) {
        this.mainList3 = [];
      }
    }, 5000);
  }

  showSelectedRecord(record: any): void {
    try {
      this.selectedRecord = record as CustomerTargetMainModel;
      this.currentAmount = 0;

      let beginDate = new Date();
      let finishDate = new Date();
      if (this.selectedRecord.data.type === 'yearly') {
        beginDate = getBeginOfYear(getNumber(this.selectedRecord.data.year));
        finishDate = getEndOfYear(getNumber(this.selectedRecord.data.year));
      } else if (this.selectedRecord.data.type === 'monthly') {

      } else if (this.selectedRecord.data.type === 'periodic') {

      } else {

      }

      // tslint:disable-next-line:max-line-length
      this.transactionList$ = this.colService.getMainItemsBetweenDatesWithCustomer(beginDate, finishDate, this.selectedRecord.data.customerCode, 'approved');
      this.transactionList$.subscribe(list => {
        list.forEach((data: any) => {
          const item = data.returnData as CollectionMainModel;
          if (item.actionType === 'added') {
            this.currentAmount += item.data.amount;
          } else if (item.actionType === 'removed') {
            this.currentAmount -= item.data.amount;
          }
        });
      });
    } catch (error) {
      this.infoService.error(error);
    }
  }

  async btnReturnList_Click(): Promise<void> {
    try {
      this.selectedRecord = undefined;
      await this.route.navigate(['customer-target', {}]);
    } catch (error) {
      this.infoService.error(error);
    }
  }

  btnNew_Click(): void {
    try {
      this.clearSelectedRecord();
    } catch (error) {
      this.infoService.error(error);
    }
  }

  async btnSave_Click(): Promise<void> {
    try {
      this.onTransaction = true;
      Promise.all([this.service.checkForSave(this.selectedRecord)])
        .then(async (values: any) => {
          if (this.selectedRecord.data.type === 'yearly') {
            this.selectedRecord.data.beginMonth = -1;
            this.selectedRecord.data.finishMonth = -1;
          }
          if (this.selectedRecord.data.type === 'monthly') {
            this.selectedRecord.data.finishMonth = -1;
          }
          this.selectedRecord.data.beginMonth = getNumber(this.selectedRecord.data.beginMonth);
          this.selectedRecord.data.finishMonth = getNumber(this.selectedRecord.data.finishMonth);
          this.selectedRecord.data.year = getNumber(this.selectedRecord.data.year);
          if (this.selectedRecord.data.primaryKey === null) {
            this.selectedRecord.data.primaryKey = '';
            await this.service.addItem(this.selectedRecord)
              .then(() => {
                this.finishProcess(null, 'Hedef başarıyla kaydedildi.');
              })
              .catch((error) => {
                this.finishProcess(error, null);
              })
              .finally(() => {
                this.finishFinally();
              });
          } else {
            await this.service.updateItem(this.selectedRecord)
              .then(() => {
                this.finishProcess(null, 'Hedef başarıyla güncellendi.');
              })
              .catch((error) => {
                this.finishProcess(error, null);
              })
              .finally(() => {
                this.finishFinally();
              });
          }
        })
        .catch((error) => {
          this.finishProcess(error, null);
        });
    } catch (error) {
      this.finishProcess(error, null);
    }
  }

  async btnRemove_Click(): Promise<void> {
    try {
      this.onTransaction = true;
      Promise.all([this.service.checkForRemove(this.selectedRecord)])
        .then(async (values: any) => {
          await this.service.removeItem(this.selectedRecord)
            .then(() => {
              this.finishProcess(null, 'Hedef başarıyla kaldırıldı.');
            })
            .catch((error) => {
              this.finishProcess(error, null);
            })
            .finally(() => {
              this.finishFinally();
            });
        })
        .catch((error) => {
          this.finishProcess(error, null);
        });
    } catch (error) {
      this.finishProcess(error, null);
    }
  }

  onChangeType(record: any): void {
    if (record === 'yearly') {
      this.selectedRecord.data.beginMonth = -1;
      this.selectedRecord.data.finishMonth = -1;
    } else if (record === 'monthly') {
      this.selectedRecord.data.beginMonth = getTodayForInput().month;
      this.selectedRecord.data.finishMonth = -1;

    } else if (record === 'periodic') {
      this.selectedRecord.data.beginMonth = getTodayForInput().month;
      this.selectedRecord.data.finishMonth = 12;
    } else {
      this.selectedRecord.data.beginMonth = -1;
      this.selectedRecord.data.finishMonth = -1;
    }
  }

  onChangeCustomer($event: any): void {
    this.selectedRecord.customerName = $event.target.options[$event.target.options.selectedIndex].text;
  }

  onChangeBeginMonth($event: any): void {
    this.selectedRecord.beginMonthTr = $event.target.options[$event.target.options.selectedIndex].text;
  }

  onChangeFinishMonth($event: any): void {
    this.selectedRecord.finishMonthTr = $event.target.options[$event.target.options.selectedIndex].text;
  }

  async showTransactionRecord(item: any): Promise<void> {
    const r = new RouterModel();
    r.nextModule = 'collection';
    r.nextModulePrimaryKey = item.returnData.data.primaryKey;
    r.previousModule = 'customer-target';
    r.previousModulePrimaryKey = this.selectedRecord.data.primaryKey;
    await this.globService.showTransactionRecord(r);
  }

  clearSelectedRecord(): void {
    this.transactionList$ = new Observable<CollectionMainModel[]>();
    this.currentAmount = 0;
    this.selectedRecord = this.service.clearMainModel();
  }

  finishFinally(): void {
    this.clearSelectedRecord();
    this.selectedRecord = undefined;
    this.onTransaction = false;
  }

  finishProcess(error: any, info: any): void {
    // error.message sistem hatası
    // error kontrol hatası
    if (error === null) {
      this.infoService.success(info !== null ? info : 'Belirtilmeyen Bilgi');
      this.clearSelectedRecord();
      this.selectedRecord = undefined;
    } else {
      this.infoService.error(error.message !== undefined ? error.message : error);
    }
    this.onTransaction = false;
  }

  format_amount($event): void {
    this.selectedRecord.data.amount = getFloat(moneyFormat($event.target.value));
    this.selectedRecord.amountFormatted = currencyFormat(getFloat(moneyFormat($event.target.value)));
  }

  focus_amount(): void {
    if (this.selectedRecord.data.amount === 0) {
      this.selectedRecord.data.amount = null;
      this.selectedRecord.amountFormatted = null;
    }
  }

}
