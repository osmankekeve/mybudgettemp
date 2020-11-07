import {Component, OnInit, OnDestroy, ElementRef} from '@angular/core';
import {AngularFirestore} from '@angular/fire/firestore';
import {InformationService} from '../services/information.service';
import {AuthenticationService} from '../services/authentication.service';
import {CustomerTargetMainModel} from '../models/customer-target-main-model';
import {CustomerTargetService} from '../services/customer-target.service';
import {Observable} from 'rxjs';
import {CustomerModel} from '../models/customer-model';
import {CustomerService} from '../services/customer.service';
import { getFloat, getNumber, getTodayForInput, getBeginOfYear, getEndOfYear, getEncryptionKey, currencyFormat, moneyFormat
} from '../core/correct-library';
import {CollectionService} from '../services/collection.service';
import * as CryptoJS from 'crypto-js';
import {Router, ActivatedRoute} from '@angular/router';
import {CollectionMainModel} from '../models/collection-main-model';
import {RouterModel} from '../models/router-model';
import {GlobalService} from '../services/global.service';
import {CustomerSelectComponent} from '../partials/customer-select/customer-select.component';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {AccountTransactionService} from '../services/account-transaction.service';
import {ToastService} from '../services/toast.service';
import {InfoModuleComponent} from '../partials/info-module/info-module.component';

@Component({
  selector: 'app-customer-target',
  templateUrl: './customer-target.component.html',
  styleUrls: ['./customer-target.component.css']
})
export class CustomerTargetComponent implements OnInit {
  mainList: Array<CustomerTargetMainModel> = [];
  selectedRecord: CustomerTargetMainModel;
  transactionList$: Observable<CollectionMainModel[]>;
  currentAmount = 0;
  encryptSecretKey: string = getEncryptionKey();
  onTransaction = false;
  searchText = '';
  isMainFilterOpened = false;
  filter = {
    isActive: true
  };

  constructor(protected authService: AuthenticationService, protected route: Router, protected router: ActivatedRoute,
              protected infoService: InformationService, protected colService: CollectionService, protected globService: GlobalService,
              protected cService: CustomerService, protected service: CustomerTargetService, protected db: AngularFirestore,
              protected modalService: NgbModal, protected toastService: ToastService) {
  }

  async ngOnInit() {
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

  async generateModule(isReload: boolean, primaryKey: string, error: any, info: any): Promise<void> {
    if (error === null) {
      this.toastService.success(info !== null ? info : 'Belirtilmeyen Bilgi');
      if (isReload) {
        this.service.getItem(primaryKey)
          .then(item => {
            this.showSelectedRecord(item.returnData);
          })
          .catch(reason => {
            this.finishProcess(reason, null);
          });
      } else {
        this.generateCharts();
        this.clearSelectedRecord();
        this.selectedRecord = undefined;
      }
    } else {
      await this.infoService.error(error.message !== undefined ? error.message : error);
    }
    this.onTransaction = false;
  }

  populateList(): void {
    this.mainList = undefined;
    this.service.getMainItems(this.filter.isActive).subscribe(list => {
      if (this.mainList === undefined) {
        this.mainList = [];
      }
      list.forEach((data: any) => {
        const item = data.returnData as CustomerTargetMainModel;
        if (item.actionType === 'added') {
          this.mainList.push(item);
        }
        if (item.actionType === 'removed') {
          for (let i = 0; i < this.mainList.length; i++) {
            if (item.data.primaryKey === this.mainList[i].data.primaryKey) {
              this.mainList.splice(i, 1);
              break;
            }
          }
        }
        if (item.actionType === 'modified') {
          for (let i = 0; i < this.mainList.length; i++) {
            if (item.data.primaryKey === this.mainList[i].data.primaryKey) {
              this.mainList[i] = item;
              break;
            }
          }
        }
      });
    });
    setTimeout(() => {
      if (this.mainList === undefined) {
        this.mainList = [];
      }
    }, 1000);
  }

  generateCharts(): void {

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
      await this.finishProcess(null, null);
      await this.route.navigate(['customer-target', {}]);
    } catch (error) {
      await this.infoService.error(error);
    }
  }

  async btnNew_Click(): Promise<void> {
    try {
      this.clearSelectedRecord();
    } catch (error) {
      await this.infoService.error(error);
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
            this.selectedRecord.data.primaryKey = this.db.createId();
            await this.service.setItem(this.selectedRecord, this.selectedRecord.data.primaryKey)
              .then(() => {
                this.generateModule(true, this.selectedRecord.data.primaryKey, null, 'Kayıt başarıyla kaydedildi.');
              })
              .catch((error) => {
                this.finishProcess(error, null);
              });
          } else {
            await this.service.updateItem(this.selectedRecord)
              .then(() => {
                this.generateModule(true, this.selectedRecord.data.primaryKey, null, 'Kayıt başarıyla güncellendi.');
              })
              .catch((error) => {
                this.finishProcess(error, null);
              });
          }
        })
        .catch((error) => {
          this.finishProcess(error, null);
        });
    } catch (error) {
      await this.finishProcess(error, null);
    }
  }

  async btnRemove_Click(): Promise<void> {
    try {
      this.onTransaction = true;
      Promise.all([this.service.checkForRemove(this.selectedRecord)])
        .then(async (values: any) => {
          await this.service.removeItem(this.selectedRecord)
            .then(() => {
              this.finishProcess(null, 'Kayıt başarıyla kaldırıldı.');
            })
            .catch((error) => {
              this.finishProcess(error, null);
            });
        })
        .catch((error) => {
          this.finishProcess(error, null);
        });
    } catch (error) {
      await this.finishProcess(error, null);
    }
  }

  async btnSelectCustomer_Click(): Promise<void> {
    try {
      const list = Array<string>();
      list.push('customer');
      list.push('customer-supplier');
      list.push('supplier');
      const modalRef = this.modalService.open(CustomerSelectComponent, {size: 'lg'});
      modalRef.componentInstance.customer = this.selectedRecord.customer;
      modalRef.componentInstance.customerTypes = list;
      modalRef.result.then((result: any) => {
        if (result) {
          this.selectedRecord.customer = result;
          this.selectedRecord.data.customerCode = this.selectedRecord.customer.data.primaryKey;
        }
      }, () => {});
    } catch (error) {
      await this.infoService.error(error);
    }
  }

  async btnShowMainFiler_Click(): Promise<void> {
    try {
      if (this.isMainFilterOpened === true) {
        this.isMainFilterOpened = false;
      } else {
        this.isMainFilterOpened = true;
      }
      this.clearMainFiler();
    } catch (error) {
      await this.infoService.error(error);
    }
  }

  async btnMainFilter_Click(): Promise<void> {
    try {
      this.populateList();
    } catch (error) {
      await this.infoService.error(error);
    }
  }

  async btnShowJsonData_Click(): Promise<void> {
    try {
      await this.infoService.showJsonData(JSON.stringify(this.selectedRecord, null, 2));
    } catch (error) {
      await this.infoService.error(error);
    }
  }

  async btnShowInfoModule_Click(): Promise<void> {
    try {
      this.modalService.open(InfoModuleComponent, {size: 'lg'});
    } catch (error) {
      await this.infoService.error(error);
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

  async finishProcess(error: any, info: any): Promise<void> {
    // error.message sistem hatası
    // error kontrol hatası
    if (error === null) {
      if (info !== null) {
        this.infoService.success(info);
      }
      this.generateCharts();
      this.clearSelectedRecord();
      this.selectedRecord = undefined;
    } else {
      await this.infoService.error(error.message !== undefined ? error.message : error);
    }
    this.onTransaction = false;
  }

  clearSelectedRecord(): void {
    this.transactionList$ = new Observable<CollectionMainModel[]>();
    this.currentAmount = 0;
    this.selectedRecord = this.service.clearMainModel();
  }

  clearMainFiler(): void {
    this.filter.isActive = true;
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
