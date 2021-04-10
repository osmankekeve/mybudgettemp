import {Component, OnDestroy, OnInit} from '@angular/core';
import {AngularFirestore} from '@angular/fire/firestore';
import {Observable} from 'rxjs/internal/Observable';
import {InformationService} from '../services/information.service';
import {AuthenticationService} from '../services/authentication.service';
import {ReminderService} from '../services/reminder.service';
import {ProfileService} from '../services/profile.service';
import {getDateForInput, getFirstDayOfMonthForInput, getInputDataForInsert, getTodayForInput, isNullOrEmpty} from '../core/correct-library';
import {ActivatedRoute, Router} from '@angular/router';
import {ProfileMainModel} from '../models/profile-main-model';
import {ReminderMainModel} from '../models/reminder-main-model';
import {CustomerModel} from '../models/customer-model';
import {CustomerService} from '../services/customer.service';
import {ToastService} from '../services/toast.service';
import { ExcelService } from '../services/excel-service';
import { Subscription } from 'rxjs';
import { ProfileModel } from '../models/profile-model';
import { MainFilterComponent } from '../partials/main-filter/main-filter.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { InfoModuleComponent } from '../partials/info-module/info-module.component';
@Component({
  selector: 'app-reminder',
  templateUrl: './reminder.component.html',
  styleUrls: ['./reminder.component.css']
})
export class ReminderComponent implements OnInit, OnDestroy {
  mainList$: Subscription;
  mainList: Array<ReminderMainModel>;
  employeeList$: Observable<ProfileModel[]>;
  customerList$: Observable<CustomerModel[]>;
  selectedRecord: ReminderMainModel;
  recordDate: any;
  searchText: '';
  paramPrimaryKey: any = undefined;
  onTransaction = false;  
  filter = {
    filterIsPersonal: '-1',
    filterPeriodType: '-1',
    filterIsActive: '-1',
  };

  constructor(public authService: AuthenticationService, public service: ReminderService, protected cService: CustomerService,
              public proService: ProfileService, public router: ActivatedRoute, protected toastService: ToastService,
              public infoService: InformationService, public route: Router, public excelService: ExcelService,
              public db: AngularFirestore, protected modalService: NgbModal) {
  }

  async ngOnInit() {
    this.paramPrimaryKey = this.router.snapshot.paramMap.get('primaryKey');
    this.populateList();
    this.customerList$ = this.cService.getAllItems();
    this.employeeList$ = this.proService.getAllItems();
    this.selectedRecord = undefined;
    if (this.paramPrimaryKey !== undefined && this.paramPrimaryKey !== null) {
      const data = await this.service.getItem(this.paramPrimaryKey);
      if (data) {
        this.showSelectedRecord(data.returnData);
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

  generateCharts(): void {

  }

  populateList(): void {
    this.mainList = undefined;
    this.mainList$ = this.service.getMainItemsTimeBetweenDates(null, null, this.filter.filterIsActive, this.filter.filterPeriodType).subscribe(list => {
      if (this.mainList === undefined) {
        this.mainList = [];
      }
      list.forEach((data: any) => {
        const item = data.returnData as ReminderMainModel;
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

  showSelectedRecord(record: any): void {
    this.selectedRecord = record as ReminderMainModel;
    this.recordDate = getDateForInput(this.selectedRecord.data.reminderDate);
  }

  async btnReturnList_Click(): Promise<void> {
    this.selectedRecord = undefined;
    await this.route.navigate(['reminder', {}]);
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
      this.selectedRecord.data.reminderDate = getInputDataForInsert(this.recordDate);
      this.selectedRecord.data.year = this.recordDate.year;
      this.selectedRecord.data.month = this.recordDate.month;
      this.selectedRecord.data.day = this.recordDate.day;
      Promise.all([this.service.checkForSave(this.selectedRecord)])
        .then(async (values: any) => {
          if (this.selectedRecord.data.primaryKey === null) {
            this.selectedRecord.data.primaryKey = this.db.createId();
            await this.service.setItem(this.selectedRecord , this.selectedRecord.data.primaryKey)
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
              this.finishProcess(null, 'Hatırlatma başarıyla kaldırıldı.');
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

  async btnShowMainFiler_Click(): Promise<void> {
    try {
      const modalRef = this.modalService.open(MainFilterComponent, {size: 'md'});
      modalRef.result.then((result: any) => {
        if (result) {
          this.filter.filterIsPersonal = result.filterIsPersonal;
          this.filter.filterPeriodType = result.filterPeriodType;
          this.filter.filterIsActive = result.filterIsActive;
          this.ngOnDestroy();
          this.populateList();
        }
      }, () => {});
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

  async btnExportToExcel_Click(): Promise<void> {
    try {
      if (this.mainList.length > 0) {
        this.excelService.exportToExcel(this.mainList, 'reminder');
      } else {
        this.infoService.success('Aktarılacak kayıt bulunamadı.');
      }
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

  onChangeVoucherType(isPersonal: any): void {
    this.selectedRecord.data.employeePrimaryKey = '-1';
    if (isPersonal === 'true') {
      this.selectedRecord.data.employeePrimaryKey = this.authService.getEid();
    }
  }

  onChangeCustomer(value: any): void {
    this.selectedRecord.data.parentPrimaryKey = value;
  }

  onChangeParentType(value: any): void {
    if (value === '-1') {
      this.selectedRecord.data.parentPrimaryKey = '-1';
      this.selectedRecord.data.parentTransactionType = '-1';
    }
  }

  clearSelectedRecord(): void {
    this.recordDate = getTodayForInput();
    this.selectedRecord = this.service.clearMainModel();
  }

  async finishProcess(error: any, info: any): Promise<void> {
    // error.message sistem hatası
    // error kontrol hatası
    if (error === null) {
      if (info !== null) {
        this.toastService.success(info);
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
