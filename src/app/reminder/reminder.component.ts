import {Component, OnInit, OnDestroy, OnChanges} from '@angular/core';
import {AngularFirestore, AngularFirestoreCollection} from '@angular/fire/firestore';
import {Observable} from 'rxjs/internal/Observable';
import {InformationService} from '../services/information.service';
import {AuthenticationService} from '../services/authentication.service';
import {ReminderModel} from '../models/reminder-model';
import {ReminderService} from '../services/reminder.service';
import {ProfileService} from '../services/profile.service';
import {getDateForInput, getFirstDayOfMonthForInput, getInputDataForInsert, getTodayForInput} from '../core/correct-library';
import {ActivatedRoute, Router} from '@angular/router';
import {ProfileMainModel} from '../models/profile-main-model';
import {PurchaseInvoiceMainModel} from '../models/purchase-invoice-main-model';

@Component({
  selector: 'app-reminder',
  templateUrl: './reminder.component.html',
  styleUrls: ['./reminder.component.css']
})
export class ReminderComponent implements OnInit {
  mainList: Array<ReminderModel>;
  collection: AngularFirestoreCollection<ReminderModel>;
  employeeList$: Observable<ProfileMainModel[]>;
  selectedRecord: ReminderModel;
  openedPanel: any;
  recordDate: any;
  searchText: '';
  isMainFilterOpened = false;
  paramPrimaryKey: any = undefined;

  filterIsPersonal = '-1';
  filterPeriodType = '-1';
  filterIsActive = '1';
  onTransaction = false;

  constructor(public authService: AuthenticationService, public service: ReminderService,
              public proService: ProfileService, public router: ActivatedRoute,
              public infoService: InformationService, public route: Router,
              public db: AngularFirestore) {
  }

  async ngOnInit() {
    this.paramPrimaryKey = this.router.snapshot.paramMap.get('primaryKey');
    this.clearMainFiler();
    this.populateList();
    this.employeeList$ = this.proService.getMainItems();
    this.selectedRecord = undefined;
    if (this.paramPrimaryKey !== undefined && this.paramPrimaryKey !== null) {
      const data = await this.service.getItem2(this.paramPrimaryKey);
      if (data) {
        this.showSelectedRecord(data);
      }
    }
  }

  populateList(): void {
    this.mainList = undefined;
    this.service.getMainItemsTimeBetweenDates(null, null, this.filterIsActive, this.filterPeriodType).subscribe(list => {
      if (this.mainList === undefined) {
        this.mainList = [];
      }
      list.forEach((data: any) => {
        const item = data as ReminderModel;
        if (data.actionType === 'added') {
          this.mainList.push(item);
        }
        if (data.actionType === 'removed') {
          for (let i = 0; i < this.mainList.length; i++) {
            if (item.primaryKey === this.mainList[i].primaryKey) {
              this.mainList.splice(i, 1);
            }
          }
        }
        if (data.actionType === 'modified') {
          for (let i = 0; i < this.mainList.length; i++) {
            if (item.primaryKey === this.mainList[i].primaryKey) {
              this.mainList[i] = item;
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
    this.openedPanel = 'mainPanel';
    this.selectedRecord = record.data as ReminderModel;
    this.recordDate = getDateForInput(this.selectedRecord.reminderDate);
  }

  btnReturnList_Click(): void {
    if (this.paramPrimaryKey !== undefined) {
      this.route.navigate(['reminder', {}]);
    }
    if (this.openedPanel === 'mainPanel') {
      this.selectedRecord = undefined;
    } else {
      this.openedPanel = 'mainPanel';
    }
  }

  btnNew_Click(): void {
    this.clearSelectedRecord();
  }

  async btnSave_Click(): Promise<void> {
    try {
      this.onTransaction = true;
      this.selectedRecord.reminderDate = getInputDataForInsert(this.recordDate);
      this.selectedRecord.year = this.recordDate.year;
      this.selectedRecord.month = this.recordDate.month;
      this.selectedRecord.day = this.recordDate.day;
      Promise.all([this.service.checkForSave(this.selectedRecord)])
        .then(async (values: any) => {
          if (this.selectedRecord.primaryKey === null) {
            this.selectedRecord.primaryKey = '';
            await this.service.addItem(this.selectedRecord)
              .then(() => {
                this.finishProcess(null, 'Hatırlatma başarıyla kaydedildi.');
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
                this.finishProcess(null, 'Hatırlatma başarıyla güncellendi.');
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
              this.finishProcess(null, 'Hatırlatma başarıyla kaldırıldı.');
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

  btnMainFilter_Click(): void {
    this.populateList();
  }

  btnShowMainFiler_Click(): void {
    if (this.isMainFilterOpened === true) {
      this.isMainFilterOpened = false;
    } else {
      this.isMainFilterOpened = true;
    }
    this.clearMainFiler();
  }

  onChangeVoucherType(isPersonal: any): void {
    this.selectedRecord.employeePrimaryKey = '-1';
    if (isPersonal === 'true') {
      this.selectedRecord.employeePrimaryKey = this.authService.getEid();
    }
  }

  clearSelectedRecord(): void {
    this.openedPanel = 'mainPanel';
    this.recordDate = getTodayForInput();
    this.selectedRecord = this.service.clearMainModel();
  }

  clearMainFiler(): void {
    this.filterPeriodType = '-1';
    this.filterIsPersonal = '-1';
    this.filterIsActive = '1';
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

}
