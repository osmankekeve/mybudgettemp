import {Component, OnInit, OnDestroy, OnChanges} from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { Observable } from 'rxjs/internal/Observable';
import { InformationService } from '../services/information.service';
import { AuthenticationService } from '../services/authentication.service';
import {ReminderModel} from '../models/reminder-model';
import {ReminderService} from '../services/reminder.service';
import {ProfileService} from '../services/profile.service';
import { getDateForInput, getInputDataForInsert, getTodayForInput } from '../core/correct-library';
import {ActivatedRoute, Router} from '@angular/router';
import { ProfileMainModel } from '../models/profile-main-model';

@Component({
  selector: 'app-reminder',
  templateUrl: './reminder.component.html',
  styleUrls: ['./reminder.component.css']
})
export class ReminderComponent implements OnInit, OnDestroy {
  mainList: Array<ReminderModel>;
  collection: AngularFirestoreCollection<ReminderModel>;
  employeeList$: Observable<ProfileMainModel[]>;
  selectedRecord: ReminderModel;
  refModel: ReminderModel;
  openedPanel: any;
  recordDate: any;
  searchText: '';
  isMainFilterOpened = false;
  paramPrimaryKey: any = undefined;

  filterIsPersonal = '-1';
  filterPeriodType = 'oneTime';
  filterIsActive = '1';

  constructor(public authService: AuthenticationService, public service: ReminderService,
              public proService: ProfileService, public router: ActivatedRoute,
              public infoService: InformationService, public route: Router,
              public db: AngularFirestore) { }

  async ngOnInit() {
    this.paramPrimaryKey = this.router.snapshot.paramMap.get('primaryKey');
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

  ngOnDestroy(): void { }

  populateList(): void {
    this.mainList = undefined;
    this.service.getMainItems().subscribe(list => {
      this.mainList = [];
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
    });
    setTimeout (() => {
      if (this.mainList === undefined) {
        this.mainList = [];
      }
    }, 1000);
  }

  showSelectedRecord(record: any): void {
    this.openedPanel = 'mainPanel';
    this.selectedRecord = record.data as ReminderModel;
    this.refModel = record.data as ReminderModel;
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

  btnSave_Click(): void {
    this.selectedRecord.reminderDate = getInputDataForInsert(this.recordDate);
    this.selectedRecord.year = this.recordDate.year;
    this.selectedRecord.month = this.recordDate.month;
    this.selectedRecord.day = this.recordDate.day;
    if (this.selectedRecord.primaryKey === undefined) {
      this.selectedRecord.primaryKey = '';
      this.service.addItem(this.selectedRecord)
      .then(() => {
        this.infoService.success('Hatırlatma başarıyla kaydedildi.');
        this.selectedRecord = undefined;
      }).catch(err => this.infoService.error(err));
    } else {
      this.service.updateItem(this.selectedRecord)
      .then(() => {
        this.infoService.success('Hatırlatma başarıyla güncellendi.');
        this.selectedRecord = undefined;
      }).catch(err => this.infoService.error(err));
    }
  }

  btnRemove_Click(): void {
    this.service.removeItem(this.selectedRecord)
    .then(() => {
      this.infoService.success('Hatırlatma başarıyla kaldırıldı.');
      this.selectedRecord = undefined;
    }).catch(err => this.infoService.error(err));
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
    this.refModel = undefined;
    this.recordDate = getTodayForInput();
    this.selectedRecord = {primaryKey: undefined, isPersonal: true, userPrimaryKey: this.authService.getUid(),
      isActive: true, periodType: 'oneTime', employeePrimaryKey: this.authService.getEid(), insertDate: Date.now()};
  }

  clearMainFiler(): void {
    this.filterPeriodType = 'oneTime';
    this.filterIsPersonal = '-1';
    this.filterIsActive = '1';
  }

}
