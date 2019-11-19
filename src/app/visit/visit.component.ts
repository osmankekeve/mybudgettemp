import { Component, OnInit, OnDestroy } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { AccountTransactionService } from '../services/account-transaction-service';
import { InformationService } from '../services/information.service';
import { AuthenticationService } from '../services/authentication.service';
import { Observable } from 'rxjs';
import { CustomerModel } from '../models/customer-model';
import { CustomerService } from '../services/customer.service';
import {ActivatedRoute} from '@angular/router';
import { VisitModel } from '../models/visit-model';
import { getTodayForInput, getDateForInput, getInputDataForInsert } from '../core/correct-library';
import { VisitService } from '../services/visit.service';
import { ProfileService } from '../services/profile.service';
import { ProfileModel } from '../models/profile-model';

@Component({
  selector: 'app-visit',
  templateUrl: './visit.component.html',
  styleUrls: ['./visit.component.css']
})
export class VisitComponent implements OnInit, OnDestroy {
  mainList: Array<VisitModel>;
  mainList1: Array<VisitModel>;
  mainList2: Array<VisitModel>;
  mainList3: Array<VisitModel>;
  collection: AngularFirestoreCollection<VisitModel>;
  customerList$: Observable<CustomerModel[]>;
  profileList$: Observable<ProfileModel[]>;
  selectedRecord: VisitModel;
  refModel: VisitModel;
  isShowAllRecords = false;
  openedPanel: any;
  recordDate: any;
  paramPrimaryKey: any = undefined;

  constructor(public authService: AuthenticationService, public service: VisitService,
              public atService: AccountTransactionService, public infoService: InformationService,
              public cService: CustomerService, public router: ActivatedRoute, public proService: ProfileService,
              public db: AngularFirestore) {
  }

  ngOnInit() {

    this.customerList$ = this.cService.getAllItems();
    this.profileList$ = this.proService.getAllItems();
    this.populateList();
  }

  ngOnDestroy(): void {
  }

  populateList(): void {
    this.mainList1 = [];
    this.mainList2 = [];
    this.mainList3 = [];
    const date = new Date();
    const todayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
    const tomorrowStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);
    this.service.getMainItemsBeforeDate(todayStart).subscribe(list => {
      list.forEach((item: any) => {
        if (item.actionType === 'added') {
          this.mainList1.push(item);
        } else if (item.actionType === 'removed') {
          this.mainList1.splice(this.mainList1.indexOf(this.refModel), 1);
        } else if (item.actionType === 'modified') {
          this.mainList1[this.mainList1.indexOf(this.refModel)] = item.data;
        } else {
          // nothing
        }
      });
    });
    this.service.getMainItemsBetweenDates(todayStart, tomorrowStart).subscribe(list => {
      list.forEach((item: any) => {
        if (item.actionType === 'added') {
          this.mainList2.push(item);
        } else if (item.actionType === 'removed') {
          this.mainList2.splice(this.mainList2.indexOf(this.refModel), 1);
        } else if (item.actionType === 'modified') {
          this.mainList2[this.mainList2.indexOf(this.refModel)] = item.data;
        } else {
          // nothing
        }
      });
    });
    this.service.getMainItemsAfterDate(tomorrowStart).subscribe(list => {
      list.forEach((item: any) => {
        if (item.actionType === 'added') {
          this.mainList3.push(item);
        } else if (item.actionType === 'removed') {
          this.mainList3.splice(this.mainList3.indexOf(this.refModel), 1);
        } else if (item.actionType === 'modified') {
          this.mainList3[this.mainList3.indexOf(this.refModel)] = item.data;
        } else {
          // nothing
        }
      });
    });
  }

  populateAllRecords(): void {
    this.mainList = [];
    this.service.getMainItems().subscribe(list => {
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
  }

  showSelectedRecord(record: any): void {
    this.openedPanel = 'mainPanel';
    this.selectedRecord = record.data as VisitModel;
    this.refModel = record.data as VisitModel;
    this.recordDate = getDateForInput(this.selectedRecord.insertDate);
  }

  btnReturnList_Click(): void {
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
    if (this.selectedRecord.primaryKey === undefined) {
      this.selectedRecord.primaryKey = '';
      this.selectedRecord.visitDate = getInputDataForInsert(this.recordDate);
      this.service.addItem(this.selectedRecord)
        .then(() => {
          this.infoService.success('Ziyaret başarıyla kaydedildi.');
          this.selectedRecord = undefined;
        }).catch(err => this.infoService.error(err));
    } else {
      this.service.updateItem(this.selectedRecord)
        .then(() => {
          this.infoService.success('Ziyaret başarıyla güncellendi.');
          this.selectedRecord = undefined;
        }).catch(err => this.infoService.error(err));
    }
  }

  btnRemove_Click(): void {
    this.service.removeItem(this.selectedRecord)
      .then(() => {
        this.infoService.success('Ziyaret başarıyla kaldırıldı.');
        this.selectedRecord = undefined;
      }).catch(err => this.infoService.error(err));
  }

  btnAllRecords_Click(): void {
    if (this.isShowAllRecords) {
      this.isShowAllRecords = false;
    } else {
      this.isShowAllRecords = true;
      this.populateAllRecords();
    }
  }

  clearSelectedRecord(): void {
    this.openedPanel = 'mainPanel';
    this.refModel = undefined;
    this.recordDate = getTodayForInput();
    this.selectedRecord = {
      primaryKey: undefined, userPrimaryKey: this.authService.getUid(),
      insertDate: Date.now()
    };
  }

}
