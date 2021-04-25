import {Component, OnInit, OnDestroy} from '@angular/core';
import {AngularFirestore, AngularFirestoreCollection} from '@angular/fire/firestore';
import {AccountTransactionService} from '../services/account-transaction.service';
import {InformationService} from '../services/information.service';
import {AuthenticationService} from '../services/authentication.service';
import {Observable, Subscription} from 'rxjs';
import {CustomerModel} from '../models/customer-model';
import {CustomerService} from '../services/customer.service';
import {ActivatedRoute, Router} from '@angular/router';
import {
  getTodayForInput, getDateForInput, getInputDataForInsert, getEncryptionKey, getFirstDayOfMonthForInput, isNullOrEmpty, getFloat
} from '../core/correct-library';
import {VisitService} from '../services/visit.service';
import {ProfileService} from '../services/profile.service';
import {VisitMainModel} from '../models/visit-main-model';
import * as CryptoJS from 'crypto-js';
import {ProfileMainModel} from '../models/profile-main-model';
import {Chart} from 'chart.js';
import {SettingModel} from '../models/setting-model';
import {InfoModuleComponent} from '../partials/info-module/info-module.component';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {ToastService} from '../services/toast.service';
import {CustomerSelectComponent} from '../partials/customer-select/customer-select.component';
import { MainFilterComponent } from '../partials/main-filter/main-filter.component';

@Component({
  selector: 'app-visit',
  templateUrl: './visit.component.html',
  styleUrls: ['./visit.component.css']
})
export class VisitComponent implements OnInit, OnDestroy {
  mainList$: Subscription;
  mainList: Array<VisitMainModel> = [];
  collection: AngularFirestoreCollection<VisitMainModel>;
  profileList$: Observable<ProfileMainModel[]>;
  profileList: Array<ProfileMainModel> = [];
  selectedRecord: VisitMainModel;
  recordDate: any;
  encryptSecretKey: string = getEncryptionKey();
  searchText = '';
  chart1: any;
  chart2: any;
  onTransaction = false;
  filter = {
    filterBeginDate: getFirstDayOfMonthForInput(),
    filterFinishDate: getTodayForInput(),
    filterStatus: '-1',
  };

  constructor(public authService: AuthenticationService, public service: VisitService, public route: Router,
              public atService: AccountTransactionService, public infoService: InformationService,
              public cService: CustomerService, public router: ActivatedRoute, public proService: ProfileService,
              public db: AngularFirestore, protected modalService: NgbModal, protected toastService: ToastService) {
  }

  async ngOnInit() {
    this.proService.getMainItems().toPromise().then(list => {
      if (this.profileList === undefined) {
        this.profileList = [];
      }
      list.forEach((data: any) => {
        const item = data.returnData as ProfileMainModel;

        if (item.actionType === 'added') {
          this.profileList.push(item);
        }
        if (item.actionType === 'removed') {
          for (let i = 0; i < this.profileList.length; i++) {
            if (item.data.primaryKey === this.profileList[i].data.primaryKey) {
              this.profileList.splice(i, 1);
              break;
            }
          }
        }
        if (item.actionType === 'modified') {
          for (let i = 0; i < this.profileList.length; i++) {
            if (item.data.primaryKey === this.profileList[i].data.primaryKey) {
              this.profileList[i] = item;
              break;
            }
          }
        }
      });
    });
    this.selectedRecord = undefined;
    this.generateCharts();
    this.populateList();

    if (this.router.snapshot.paramMap.get('paramItem') !== null) {
      const bytes = CryptoJS.AES.decrypt(this.router.snapshot.paramMap.get('paramItem'), this.encryptSecretKey);
      const paramItem = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
      if (paramItem) {
        this.showSelectedRecord(paramItem);
      }
    }
  }

  ngOnDestroy() {
    if (this.mainList$ !== undefined) {
      this.mainList$.unsubscribe();
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
    const beginDate = new Date(this.filter.filterBeginDate.year, this.filter.filterBeginDate.month - 1, this.filter.filterBeginDate.day, 0, 0, 0);
    const finishDate = new Date(this.filter.filterFinishDate.year, this.filter.filterFinishDate.month - 1, this.filter.filterFinishDate.day + 1, 0, 0, 0);
    this.mainList$ = this.service.getMainItemsBetweenDates(beginDate, finishDate).subscribe(list => {
      if (this.mainList === undefined) {
        this.mainList = [];
      }
      list.forEach((data: any) => {
        const item = data.returnData as VisitMainModel;
        if (item.actionType === 'added') {
          this.mainList.push(item);
        }
        if (item.actionType === 'removed') {
          for (let i = 0; i < this.mainList.length; i++) {
            if (item.visit.primaryKey === this.mainList[i].visit.primaryKey) {
              this.mainList.splice(i, 1);
              break;
            }
          }
        }
        if (item.actionType === 'modified') {
          for (let i = 0; i < this.mainList.length; i++) {
            if (item.visit.primaryKey === this.mainList[i].visit.primaryKey) {
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
    this.populateCharts();
  }

  populateCharts(): void {
    const startDate = new Date(this.filter.filterBeginDate.year, this.filter.filterBeginDate.month - 1, this.filter.filterBeginDate.day, 0, 0, 0);
    const endDate = new Date(this.filter.filterFinishDate.year, this.filter.filterFinishDate.month - 1, this.filter.filterFinishDate.day + 1, 0, 0, 0);

    const chart1DataValues = [0, 0, 0];
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
    this.recordDate = getDateForInput(this.selectedRecord.visit.visitDate);
  }

  async btnReturnList_Click(): Promise<void> {
    try {
      await this.finishProcess(null, null);
      await this.route.navigate(['visit', {}]);
    } catch (err) {
      await this.infoService.error(err);
    }
  }

  async btnNew_Click(): Promise<void> {
    try {
      this.clearSelectedRecord();
    } catch (err) {
      await this.infoService.error(err);
    }
  }

  async btnSave_Click(): Promise<void> {
    try {
      this.onTransaction = true;
      Promise.all([this.service.checkForSave(this.selectedRecord)])
        .then(async (values: any) => {
          if (this.selectedRecord.visit.primaryKey === null || this.selectedRecord.visit.primaryKey === '') {
            this.onTransaction = true;
            this.selectedRecord.visit.primaryKey = this.db.createId();
            this.selectedRecord.visit.visitDate = getInputDataForInsert(this.recordDate);
            await this.service.setItem(this.selectedRecord, this.selectedRecord.visit.primaryKey)
              .then(() => {
                this.generateModule(true, this.selectedRecord.visit.primaryKey, null, 'Kayıt başarıyla kaydedildi.');
              })
              .catch((error) => {
                this.finishProcess(error, null);
              });
          } else {
            await this.service.updateItem(this.selectedRecord)
              .then(() => {
                this.generateModule(true, this.selectedRecord.visit.primaryKey, null, 'Kayıt başarıyla güncellendi.');
              })
              .catch((error) => {
                this.finishProcess(error, null);
              });
          }
        })
        .catch((error) => {
          this.finishProcess(error, null);
        });
    } catch (err) {
      await this.finishProcess(err, null);
    }
  }

  async btnRemove_Click(): Promise<void> {
    try {
      this.onTransaction = true;
      Promise.all([this.service.checkForRemove(this.selectedRecord)])
        .then(async (values: any) => {
        this.onTransaction = true;
        await this.service.removeItem(this.selectedRecord)
          .then(() => {
            this.finishProcess(null, 'Ziyaret başarıyla kaldırıldı.');
          })
          .catch((error) => {
            this.finishProcess(error, null);
          });
      })
        .catch((error) => {
          this.finishProcess(error, null);
        });
    } catch (err) {
      await this.finishProcess(err, null);
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
          this.selectedRecord.visit.customerPrimaryKey = this.selectedRecord.customer.data.primaryKey;
        }
      }, () => {});
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

  async btnShowJsonData_Click(): Promise<void> {
    try {
      await this.infoService.showJsonData(JSON.stringify(this.selectedRecord, null, 2));
    } catch (error) {
      await this.infoService.error(error);
    }
  }

  async btnShowMainFiler_Click(): Promise<void> {
    try {
      const modalRef = this.modalService.open(MainFilterComponent, {size: 'md'});
      modalRef.result.then((result: any) => {
        if (result) {
          this.filter.filterBeginDate = result.filterBeginDate;
          this.filter.filterFinishDate = result.filterFinishDate;
          this.ngOnDestroy();
          this.populateCharts();
          this.populateList();
        }
      }, () => {});
    } catch (error) {
      await this.infoService.error(error);
    }
  }

  onChangeEmployee($event: any): void {
    try {
      this.selectedRecord.employeeName = $event.target.options[$event.target.options.selectedIndex].text;
    } catch (err) {
      this.infoService.error(err);
    }
  }

  clearSelectedRecord(): void {
    this.recordDate = getTodayForInput();
    this.selectedRecord = this.service.clearVisitMainModel();
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
