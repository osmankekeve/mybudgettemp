import { Component, OnInit, OnDestroy } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { CashDeskService } from '../services/cash-desk.service';
import { AccountTransactionService } from '../services/account-transaction.service';
import { InformationService } from '../services/information.service';
import { AuthenticationService } from '../services/authentication.service';
import { CustomerRelationModel } from '../models/customer-relation-model';
import { CustomerRelationService } from '../services/crm.service';
import { NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import { Observable } from 'rxjs';
import { CustomerModel } from '../models/customer-model';
import { CustomerService } from '../services/customer.service';
import {ActivatedRoute, Router} from '@angular/router';
import * as CryptoJS from 'crypto-js';
import {getEncryptionKey, getFirstDayOfMonthForInput, getFloat, getTodayForInput, isNullOrEmpty} from '../core/correct-library';
import {PaymentMainModel} from '../models/payment-main-model';
import {Chart} from 'chart.js';
import {VisitMainModel} from '../models/visit-main-model';

@Component({
  selector: 'app-crm',
  templateUrl: './crm.component.html',
  styleUrls: ['./crm.component.css']
})
export class CRMComponent implements OnInit, OnDestroy {
  mainList: Array<CustomerRelationModel>;
  collection: AngularFirestoreCollection<CustomerRelationModel>;
  mainList$: Observable<CustomerRelationModel[]>;
  customerList$: Observable<CustomerModel[]>;
  selectedRecord: CustomerRelationModel;
  refModel: CustomerRelationModel;
  openedPanel: any;
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
              public atService: AccountTransactionService,
              public infoService: InformationService, public route: Router, public router: ActivatedRoute,
              public cService: CustomerService,
              public db: AngularFirestore) {
  }

  ngOnInit() {
    this.clearMainFiler();
    this.customerList$ = this.cService.getAllItems();
    this.populateList();
    this.populateCharts();

    if (this.router.snapshot.paramMap.get('paramItem') !== null) {
      const bytes = CryptoJS.AES.decrypt(this.router.snapshot.paramMap.get('paramItem'), this.encryptSecretKey);
      const paramItem = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
      if (paramItem) {
        this.showSelectedRecord(paramItem);
      }
    }
  }

  ngOnDestroy(): void {
  }

  populateList(): void {
    this.mainList = undefined;
    const beginDate = new Date(this.filterBeginDate.year, this.filterBeginDate.month - 1, this.filterBeginDate.day, 0, 0, 0);
    const finishDate = new Date(this.filterFinishDate.year, this.filterFinishDate.month - 1, this.filterFinishDate.day + 1, 0, 0, 0);

    this.service.getMainItemsBetweenDates(beginDate, finishDate).subscribe(list => {
      if (this.mainList === undefined) { this.mainList = []; }
      list.forEach((item: any) => {
        if (item.actionType === 'added') {
          this.mainList.push(item);
        } else if (item.actionType === 'removed') {
          this.mainList.splice(this.mainList.indexOf(this.refModel), 1);
        } else if (item.actionType === 'modified') {
          this.mainList[this.mainList.indexOf(this.refModel)] = item.data;
        } else {
          // nothing
        }
      });
    }, error => {
      this.infoService.error(error.toString());
    });
    setTimeout (() => {
      if (this.mainList === undefined) {
        this.mainList = [];
      }
    }, 1000);
  }

  populateCharts(): void {
    const startDate = new Date(this.filterBeginDate.year, this.filterBeginDate.month - 1, this.filterBeginDate.day, 0, 0, 0);
    const endDate = new Date(this.filterFinishDate.year, this.filterFinishDate.month - 1, this.filterFinishDate.day + 1, 0, 0, 0);

    const chart1DataValues = [0 , 0 , 0, 0 , 0 , 0];
    Promise.all([this.service.getMainItemsBetweenDatesAsPromise(startDate, endDate)])
      .then((values: any) => {
        if (values[0] !== undefined || values[0] !== null) {
          const returnData = values[0] as Array<CustomerRelationModel>;
          returnData.forEach(item => {
            if (item.relationType === 'meeting') {
              chart1DataValues[0] += 1;
            } else if (item.relationType === 'mailSending') {
              chart1DataValues[1] += 1;
            } else if (item.relationType === 'faxSending') {
              chart1DataValues[2] += 1;
            } else if (item.relationType === 'phoneCall') {
              chart1DataValues[3] += 1;
            } else if (item.relationType === 'visit') {
              chart1DataValues[4] += 1;
            } else if (item.relationType === 'travel') {
              chart1DataValues[5] += 1;
            } else {
              // nothing
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
            data: chart1DataValues,
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

  showSelectedRecord(record: any): void {
    this.openedPanel = 'mainPanel';
    this.selectedRecord = record.data as CustomerRelationModel;
    this.refModel = record.data as CustomerRelationModel;
    const selectedDate = new Date(this.selectedRecord.actionDate);
    this.today = {year: selectedDate.getFullYear(), month: selectedDate.getMonth() + 1, day: selectedDate.getDate()};
  }

  btnNew_Click(): void {
    this.clearSelectedRecord();
  }

  async btnSave_Click(): Promise<void> {
    const date = new Date(this.today.year, this.today.month - 1, this.today.day);
    if (this.selectedRecord.primaryKey === undefined) {
      this.onTransaction = true;
      this.selectedRecord.primaryKey = '';
      this.selectedRecord.actionDate = date.getTime();
      await this.service.addItem(this.selectedRecord)
        .then(() => {
          this.infoService.success('Etkinlik başarıyla kaydedildi.');
        }).catch(err => this.infoService.error(err)).finally(() => {
          this.finishRecordProcess();
        });
    } else {
      await this.service.updateItem(this.selectedRecord)
        .then(() => {
          this.infoService.success('Etkinlik başarıyla güncellendi.');
        }).catch(err => this.infoService.error(err)).finally(() => {
          this.finishRecordProcess();
        });
    }
  }

  async btnRemove_Click(): Promise<void> {
    this.onTransaction = true;
    await this.service.removeItem(this.selectedRecord)
      .then(() => {
        this.infoService.success('Etkinlik başarıyla kaldırıldı.');
      }).catch(err => this.infoService.error(err)).finally(() => {
        this.finishRecordProcess();
      });
  }

  async btnReturnList_Click(): Promise<void> {
    if (this.openedPanel === 'mainPanel') {
      this.selectedRecord = undefined;
      await this.route.navigate(['crm', {}]);
      this.populateCharts();
    } else {
      this.openedPanel = 'mainPanel';
    }
  }

  btnMainFilter_Click(): void {
    if (isNullOrEmpty(this.filterBeginDate)) {
      this.infoService.error('Lütfen başlangıç tarihi filtesinden tarih seçiniz.');
    } else if (isNullOrEmpty(this.filterFinishDate)) {
      this.infoService.error('Lütfen bitiş tarihi filtesinden tarih seçiniz.');
    } else {
      this.populateList();
      this.populateCharts();
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
    this.openedPanel = 'mainPanel';
    this.refModel = undefined;
    const selectedDate = new Date();
    this.today = {year: selectedDate.getFullYear(), month: selectedDate.getMonth() + 1, day: selectedDate.getDate()};
    this.selectedRecord = {
      primaryKey: undefined, description: '', status: 'waiting', parentType: 'customer',
      userPrimaryKey: this.authService.getUid(), insertDate: Date.now(), employeePrimaryKey: this.authService.getEid()
    };
  }

  clearMainFiler(): void {
    this.filterBeginDate = getFirstDayOfMonthForInput();
    this.filterFinishDate = getTodayForInput();
  }

  finishRecordProcess(): void {
    this.populateCharts();
    this.clearSelectedRecord();
    this.selectedRecord = undefined;
    this.onTransaction = false;
  }

}
