import { Component, OnInit, OnDestroy } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { AccountTransactionService } from '../services/account-transaction.service';
import { InformationService } from '../services/information.service';
import { AuthenticationService } from '../services/authentication.service';
import { CustomerRelationService } from '../services/crm.service';
import {NgbDateStruct, NgbModal} from '@ng-bootstrap/ng-bootstrap';
import { Observable } from 'rxjs';
import { CustomerModel } from '../models/customer-model';
import { CustomerService } from '../services/customer.service';
import {ActivatedRoute, Router} from '@angular/router';
import * as CryptoJS from 'crypto-js';
import {getEncryptionKey, getFirstDayOfMonthForInput, getFloat, getTodayForInput, isNullOrEmpty} from '../core/correct-library';
import {Chart} from 'chart.js';
import {CustomerRelationMainModel} from '../models/customer-relation-main-model';
import {CustomerSelectComponent} from '../partials/customer-select/customer-select.component';
import {ToastService} from '../services/toast.service';
import {GlobalUploadService} from '../services/global-upload.service';
import { fail } from 'assert';

@Component({
  selector: 'app-crm',
  templateUrl: './crm.component.html',
  styleUrls: ['./crm.component.css']
})
export class CRMComponent implements OnInit {
  mainList: Array<CustomerRelationMainModel>;
  selectedRecord: CustomerRelationMainModel;
  transactionList: Array<any>;
  date = new Date();
  today: NgbDateStruct = {year: this.date.getFullYear(), month: this.date.getMonth() + 1, day: this.date.getDate()};
  encryptSecretKey: string = getEncryptionKey();
  filterBeginDate: any;
  filterFinishDate: any;
  isMainFilterOpened = false;
  searchText = '';
  chart1: any;
  chart2: any;
  onTransaction = false;

  constructor(public authService: AuthenticationService, public service: CustomerRelationService,
              public atService: AccountTransactionService, protected toastService: ToastService,
              public infoService: InformationService, public route: Router, public router: ActivatedRoute,
              public cService: CustomerService, protected modalService: NgbModal,
              public db: AngularFirestore) {
  }

  ngOnInit() {
    this.clearMainFiler();
    this.populateList();

    if (this.router.snapshot.paramMap.get('paramItem') !== null) {
      const bytes = CryptoJS.AES.decrypt(this.router.snapshot.paramMap.get('paramItem'), this.encryptSecretKey);
      const paramItem = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
      if (paramItem) {
        this.showSelectedRecord(paramItem);
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
    const beginDate = new Date(this.filterBeginDate.year, this.filterBeginDate.month - 1, this.filterBeginDate.day, 0, 0, 0);
    const finishDate = new Date(this.filterFinishDate.year, this.filterFinishDate.month - 1, this.filterFinishDate.day + 1, 0, 0, 0);

    this.service.getMainItemsBetweenDates(beginDate, finishDate).subscribe(list => {
      if (this.mainList === undefined) { this.mainList = []; }
      list.forEach((data: any) => {
        const item = data.returnData as CustomerRelationMainModel;
        if (item.actionType === 'added') {
          this.mainList.push(item);
        }
        if (item.actionType === 'removed') {
          // tslint:disable-next-line:prefer-for-of
          for (let i = 0; i < this.mainList.length; i++) {
            if (item.data.primaryKey === this.mainList[i].data.primaryKey) {
              this.mainList.splice(i, 1);
            }
          }
        }
        if (item.actionType === 'modified') {
          // tslint:disable-next-line:prefer-for-of
          for (let i = 0; i < this.mainList.length; i++) {
            if (item.data.primaryKey === this.mainList[i].data.primaryKey) {
              this.mainList[i] = item;
            }
          }
        }
      });
    });

    setTimeout (() => {
      if (this.mainList === undefined) {
        this.mainList = [];
      }
      this.generateCharts();
    }, 1000);
  }

  populateCharts(): void {

    const chart1 = document.getElementById('chart1');
    if (chart1) {
      this.transactionList = undefined;
      const startDate = new Date(this.filterBeginDate.year, this.filterBeginDate.month - 1, this.filterBeginDate.day, 0, 0, 0);
      const endDate = new Date(this.filterFinishDate.year, this.filterFinishDate.month - 1, this.filterFinishDate.day + 1, 0, 0, 0);

      Promise.all([this.service.getMainItemsBetweenDatesAsPromise(startDate, endDate)])
        .then((values: any) => {
          if (values[0] !== null) {
            this.transactionList = [0 , 0 , 0, 0 , 0 , 0];
            const returnData = values[0] as Array<CustomerRelationMainModel>;
            returnData.forEach(item => {
              if (item.data.relationType === 'meeting') {
                this.transactionList[0] += 1;
              }
              if (item.data.relationType === 'mailSending') {
                this.transactionList[1] += 1;
              }
              if (item.data.relationType === 'faxSending') {
                this.transactionList[2] += 1;
              }
              if (item.data.relationType === 'phoneCall') {
                this.transactionList[3] += 1;
              }
              if (item.data.relationType === 'visit') {
                this.transactionList[4] += 1;
              }
              if (item.data.relationType === 'travel') {
                this.transactionList[5] += 1;
              }
            });
          }
        }).finally(() => {
        this.chart1 = new Chart('chart1', {
          type: 'horizontalBar', // bar, pie, doughnut, horizontalBar
          data: {
            labels: ['Toplantı', 'Mail Gönderim', 'Fax Gönderim', 'Telefon Görüşmesi', 'Ziyaret', 'Seyahat'],
            datasets: [{
              label: '# of Votes',
              data: this.transactionList,
              backgroundColor: [
                'rgba(255, 99, 132, 0.2)',
                'rgba(54, 162, 235, 0.2)',
                'rgba(255, 206, 86, 0.2)',
                'rgba(75, 192, 192, 0.2)',
                'rgba(153, 102, 255, 0.2)',
                'rgba(255, 159, 64, 0.2)',
              ],
              borderColor: [
                'rgba(255,99,132,1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)',
                'rgba(75, 192, 192, 1)',
                'rgba(153, 102, 255, 1)',
                'rgba(255, 159, 64, 1)',
              ],
              borderWidth: 1
            }]
          },
          options: {
            title: {
              text: 'Etkinlik Chart',
              display: true
            },
            scales: {
              yAxes: [{
                ticks: {
                  beginAtZero: true
                }
              }]
            }
          }
        });
      });

    }
  }

  generateCharts(): void {
    setTimeout (() => { this.populateCharts(); }, 500);
  }

  showSelectedRecord(record: any): void {
    this.selectedRecord = record as CustomerRelationMainModel;
    const selectedDate = new Date(this.selectedRecord.data.actionDate);
    this.today = {year: selectedDate.getFullYear(), month: selectedDate.getMonth() + 1, day: selectedDate.getDate()};
  }

  btnNew_Click(): void {
    this.clearSelectedRecord();
  }

  async btnSave_Click(): Promise<void> {
    try {
      this.onTransaction = true;
      const date = new Date(this.today.year, this.today.month - 1, this.today.day);
      Promise.all([this.service.checkForSave(this.selectedRecord)])
        .then(async (values: any) => {
        if (this.selectedRecord.data.primaryKey === null) {
          this.selectedRecord.data.primaryKey = this.db.createId();
          this.selectedRecord.data.actionDate = date.getTime();
          await this.service.setItem(this.selectedRecord, this.selectedRecord.data.primaryKey)
            .then(() => {
              this.generateModule(false, this.selectedRecord.data.primaryKey, null, 'Kayıt başarıyla kaydedildi.');
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
            this.finishProcess(null, 'Etkinlik başarıyla kaldırıldı.');
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

  async btnReturnList_Click(): Promise<void> {
    await this.finishProcess(null, null);
    await this.route.navigate(['crm', {}]);
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
          this.selectedRecord.data.parentPrimaryKey = this.selectedRecord.customer.data.primaryKey;
        }
      }, () => {});
    } catch (error) {
      await this.infoService.error(error);
    }
  }

  btnMainFilter_Click(): void {
    if (isNullOrEmpty(this.filterBeginDate)) {
      this.infoService.error('Lütfen başlangıç tarihi filtesinden tarih seçiniz.');
    } else if (isNullOrEmpty(this.filterFinishDate)) {
      this.infoService.error('Lütfen bitiş tarihi filtesinden tarih seçiniz.');
    } else {
      this.populateList();
      this.generateCharts();
    }
  }

  btnShowMainFiler_Click(): void {
    if (this.isMainFilterOpened === true) {
      this.isMainFilterOpened = false;
    } else {
      this.isMainFilterOpened = true;
    }
    this.clearMainFiler();
  }

  clearSelectedRecord(): void {
    const selectedDate = new Date();
    this.today = {year: selectedDate.getFullYear(), month: selectedDate.getMonth() + 1, day: selectedDate.getDate()};
    this.selectedRecord = this.service.clearMainModel();
  }

  clearMainFiler(): void {
    this.filterBeginDate = getFirstDayOfMonthForInput();
    this.filterFinishDate = getTodayForInput();
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

}
