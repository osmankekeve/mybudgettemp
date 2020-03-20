import { Component, OnInit, OnDestroy } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { AccountTransactionService } from '../services/account-transaction.service';
import { InformationService } from '../services/information.service';
import { AuthenticationService } from '../services/authentication.service';
import { Observable } from 'rxjs';
import { CustomerModel } from '../models/customer-model';
import { CustomerService } from '../services/customer.service';
import { ActivatedRoute, Router } from '@angular/router';
import {
  getTodayForInput, getDateForInput, getInputDataForInsert, getEncryptionKey, getFirstDayOfMonthForInput, isNullOrEmpty, getFloat
} from '../core/correct-library';
import { VisitService } from '../services/visit.service';
import { ProfileService } from '../services/profile.service';
import { VisitMainModel } from '../models/visit-main-model';
import * as CryptoJS from 'crypto-js';
import { ProfileMainModel } from '../models/profile-main-model';
import {Chart} from 'chart.js';

@Component({
  selector: 'app-visit',
  templateUrl: './visit.component.html',
  styleUrls: ['./visit.component.css']
})
export class VisitComponent implements OnInit, OnDestroy {
  mainList: Array<VisitMainModel> = [];
  collection: AngularFirestoreCollection<VisitMainModel>;
  customerList$: Observable<CustomerModel[]>;
  profileList$: Observable<ProfileMainModel[]>;
  selectedRecord: VisitMainModel;
  refModel: VisitMainModel;
  recordDate: any;
  encryptSecretKey: string = getEncryptionKey();
  filterBeginDate: any;
  filterFinishDate: any;
  isMainFilterOpened = false;
  searchText = '';
  chart1: any;
  chart2: any;
  onTransaction = false;

  constructor(public authService: AuthenticationService, public service: VisitService, public route: Router,
              public atService: AccountTransactionService, public infoService: InformationService,
              public cService: CustomerService, public router: ActivatedRoute, public proService: ProfileService,
              public db: AngularFirestore) {
  }

  async ngOnInit() {
    this.clearMainFiler();
    this.customerList$ = this.cService.getAllItems();
    this.profileList$ = this.proService.getMainItems();
    this.selectedRecord = undefined;
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
      this.mainList = [];
      list.forEach((data: any) => {
        const item = data.returnData as VisitMainModel;
        this.mainList.forEach(item2 => {
          if (item2.visit.primaryKey === item.visit.primaryKey) {
            this.refModel = item2;
          }
        });
        if (item.actionType === 'added') {
          this.mainList.push(item);
        } else if (item.actionType === 'removed') {
          this.mainList.splice(this.mainList.indexOf(this.refModel), 1);
        } else if (item.actionType === 'modified') {
          this.mainList[this.mainList.indexOf(this.refModel)] = item;
        } else {
          // nothing
        }
      });
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

    const chart1DataValues = [0 , 0 , 0];
    Promise.all([this.service.getMainItemsBetweenDatesAsPromise(startDate, endDate)])
      .then((values: any) => {
        if (values[0] !== undefined || values[0] !== null) {
          const returnData = values[0] as Array<VisitMainModel>;
          returnData.forEach(item => {
            chart1DataValues[0] += 1;
            if (item.visit.isVisited) {
              chart1DataValues[1] += 1;
            } else {
              chart1DataValues[2] += 1;
            }

          });
        }
      }).finally(() => {
      this.chart1 = new Chart('chart1', {
        type: 'bar', // bar, pie, doughnut
        data: {
          labels: ['Ziyaret Sayısı', 'Başarılı Ziyaret', 'Başarısız Ziyaret'],
          datasets: [{
            label: '# of Votes',
            data: chart1DataValues,
            backgroundColor: [
              'rgba(255, 99, 132, 0.2)',
              'rgba(54, 162, 235, 0.2)',
              'rgba(255, 206, 86, 0.2)'
            ],
            borderColor: [
              'rgba(255,99,132,1)',
              'rgba(54, 162, 235, 1)',
              'rgba(255, 206, 86, 1)'
            ],
            borderWidth: 1
          }]
        },
        options: {
          title: {
            text: 'Ziyaret Durumları',
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
      this.chart2 = new Chart('chart2', {
        type: 'doughnut', // bar, pie, doughnut
        data: {
          labels: ['Başarılı', 'Başarısız'],
          datasets: [{
            label: '# of Votes',
            data: [chart1DataValues[1], chart1DataValues[2]],
            backgroundColor: [
              'rgba(255, 99, 132, 0.2)',
              'rgba(54, 162, 235, 0.2)',
              'rgba(255, 206, 86, 0.2)',
              'rgba(75, 192, 192, 0.2)'
            ],
            borderColor: [
              'rgba(255,99,132,1)',
              'rgba(54, 162, 235, 1)',
              'rgba(255, 206, 86, 1)'
            ],
            borderWidth: 1
          }]
        }
      });
    });
  }

  showSelectedRecord(record: VisitMainModel): void {
    this.selectedRecord = record;
    this.refModel = record;
    this.recordDate = getDateForInput(this.selectedRecord.visit.visitDate);
  }

  btnNew_Click(): void {
    try {
      this.clearSelectedRecord();
    } catch (err) {
      this.infoService.error(err);
    }
  }

  async btnSave_Click(): Promise<void> {
    try {
      Promise.all([this.service.checkForSave(this.selectedRecord)]).then(async (values: any) => {
        if (this.selectedRecord.visit.primaryKey === null || this.selectedRecord.visit.primaryKey === '') {
          this.onTransaction = true;
          this.selectedRecord.visit.primaryKey = '';
          this.selectedRecord.visit.visitDate = getInputDataForInsert(this.recordDate);
          await this.service.addItem(this.selectedRecord)
            .then(() => {
              this.infoService.success('Ziyaret başarıyla kaydedildi.');
            }).catch(err => this.infoService.error(err)).finally(() => {
              this.finishRecordProcess();
            });
        } else {
          await this.service.updateItem(this.selectedRecord)
            .then(() => {
              this.infoService.success('Ziyaret başarıyla güncellendi.');
            }).catch(err => this.infoService.error(err)).finally(() => {
              this.finishRecordProcess();
            });
        }
      }).catch((error) => {
        this.infoService.error(error);
      });
    } catch (err) {
      this.infoService.error(err);
    }
  }

  async btnRemove_Click(): Promise<void> {
    try {
      Promise.all([this.service.checkForRemove(this.selectedRecord)]).then(async (values: any) => {
        this.onTransaction = true;
        await this.service.removeItem(this.selectedRecord)
          .then(() => {
            this.infoService.success('Ziyaret başarıyla kaldırıldı.');
          }).catch(err => this.infoService.error(err)).finally(() => {
            this.finishRecordProcess();
          });
      }).catch((error) => {
        this.infoService.error(error);
      });
    } catch (err) {
      this.infoService.error(err);
    }
  }

  async btnReturnList_Click(): Promise<void> {
    try {
      this.selectedRecord = undefined;
      await this.route.navigate(['visit', {}]);
      this.populateCharts();
    } catch (err) {
      this.infoService.error(err);
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

  onChangeEmployee($event: any): void {
    try {
      this.selectedRecord.employeeName = $event.target.options[$event.target.options.selectedIndex].text;
    } catch (err) {
      this.infoService.error(err);
    }
  }

  onChangeCustomer($event: any): void {
    try {
      this.selectedRecord.customerName = $event.target.options[$event.target.options.selectedIndex].text;
    } catch (err) {
      this.infoService.error(err);
    }
  }

  clearSelectedRecord(): void {
    this.refModel = undefined;
    this.recordDate = getTodayForInput();
    this.selectedRecord = this.service.clearVisitMainModel();
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
