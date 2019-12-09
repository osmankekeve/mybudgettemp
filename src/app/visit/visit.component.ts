import { Component, OnInit, OnDestroy } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { AccountTransactionService } from '../services/account-transaction.service';
import { InformationService } from '../services/information.service';
import { AuthenticationService } from '../services/authentication.service';
import { Observable } from 'rxjs';
import { CustomerModel } from '../models/customer-model';
import { CustomerService } from '../services/customer.service';
import { ActivatedRoute, Router } from '@angular/router';
import { getTodayForInput, getDateForInput, getInputDataForInsert, getEncriptionKey } from '../core/correct-library';
import { VisitService } from '../services/visit.service';
import { ProfileService } from '../services/profile.service';
import { ProfileModel } from '../models/profile-model';
import { VisitMainModel } from '../models/visit-main-model';
import * as CryptoJS from 'crypto-js';
import { ProfileMainModel } from '../models/profile-main-model';

@Component({
  selector: 'app-visit',
  templateUrl: './visit.component.html',
  styleUrls: ['./visit.component.css']
})
export class VisitComponent implements OnInit, OnDestroy {
  mainList: Array<VisitMainModel> = [];
  mainList1: Array<VisitMainModel> = [];
  mainList2: Array<VisitMainModel> = [];
  mainList3: Array<VisitMainModel> = [];
  collection: AngularFirestoreCollection<VisitMainModel>;
  customerList$: Observable<CustomerModel[]>;
  profileList$: Observable<ProfileMainModel[]>;
  selectedRecord: VisitMainModel;
  refModel: VisitMainModel;
  isShowAllRecords = false;
  openedPanel: any;
  recordDate: any;
  encryptSecretKey: string = getEncriptionKey();

  constructor(public authService: AuthenticationService, public service: VisitService, public route: Router,
              public atService: AccountTransactionService, public infoService: InformationService,
              public cService: CustomerService, public router: ActivatedRoute, public proService: ProfileService,
              public db: AngularFirestore) {
  }

  async ngOnInit() {

    this.customerList$ = this.cService.getAllItems();
    this.profileList$ = this.proService.getMainItems();
    this.selectedRecord = undefined;
    this.populateList();

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
    this.mainList1 = [];
    this.mainList2 = [];
    this.mainList3 = [];
    const date = new Date();
    const todayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
    const tomorrowStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);
    this.service.getMainItemsBeforeDate(todayStart).subscribe(list => {
      list.forEach((data: any) => {
        const item = data.returnData as VisitMainModel;
        if (item.actionType === 'added') {
          this.mainList1.push(item);
        } else if (item.actionType === 'removed') {
          this.mainList1.splice(this.mainList1.indexOf(this.refModel), 1);
        } else if (item.actionType === 'modified') {
          this.mainList1[this.mainList1.indexOf(this.refModel)] = item;
        } else {
          // nothing
        }
      });
    });
    this.service.getMainItemsBetweenDates(todayStart, tomorrowStart).subscribe(list => {
      list.forEach((data: any) => {
        const item = data.returnData as VisitMainModel;
        if (item.actionType === 'added') {
          this.mainList2.push(item);
        } else if (item.actionType === 'removed') {
          this.mainList2.splice(this.mainList2.indexOf(this.refModel), 1);
        } else if (item.actionType === 'modified') {
          this.mainList2[this.mainList2.indexOf(this.refModel)] = item;
        } else {
          // nothing
        }
      });
    });
    this.service.getMainItemsAfterDate(tomorrowStart).subscribe(list => {
      list.forEach((data: any) => {
        const item = data.returnData as VisitMainModel;
        if (item.actionType === 'added') {
          this.mainList3.push(item);
        } else if (item.actionType === 'removed') {
          this.mainList3.splice(this.mainList3.indexOf(this.refModel), 1);
        } else if (item.actionType === 'modified') {
          this.mainList3[this.mainList3.indexOf(this.refModel)] = item;
        } else {
          // nothing
        }
      });
    });
  }

  populateAllRecords(): void {
    this.mainList = [];
    this.service.getMainItems().subscribe(list => {
      list.forEach((data: any) => {
        const item = data.returnData as VisitMainModel;
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
  }

  showSelectedRecord(record: VisitMainModel): void {
    this.openedPanel = 'mainPanel';
    this.selectedRecord = record;
    this.refModel = record;
    this.recordDate = getDateForInput(this.selectedRecord.visit.visitDate);
  }

  btnReturnList_Click(): void {
    try {
      if (this.openedPanel === 'mainPanel') {
        this.selectedRecord = undefined;
        this.route.navigate(['visit', {}]);
      } else {
        this.openedPanel = 'mainPanel';
      }
    } catch (err) {
      this.infoService.error(err);
    }
  }

  btnNew_Click(): void {
    try {
      this.clearSelectedRecord();
    } catch (err) {
      this.infoService.error(err);
    }
  }

  btnSave_Click(): void {
    try {
      if (this.selectedRecord.visit.primaryKey === null) {
        this.selectedRecord.visit.primaryKey = '';
        this.selectedRecord.visit.visitDate = getInputDataForInsert(this.recordDate);
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
    } catch (err) {
      this.infoService.error(err);
    }
  }

  btnRemove_Click(): void {
    try {
      this.service.removeItem(this.selectedRecord)
        .then(() => {
          this.infoService.success('Ziyaret başarıyla kaldırıldı.');
          this.selectedRecord = undefined;
        }).catch(err => this.infoService.error(err));
    } catch (err) {
      this.infoService.error(err);
    }
  }

  btnAllRecords_Click(): void {
    try {
      if (this.isShowAllRecords) {
        this.isShowAllRecords = false;
      } else {
        this.isShowAllRecords = true;
        this.populateAllRecords();
      }
    } catch (err) {
      this.infoService.error(err);
    }
  }

  clearSelectedRecord(): void {
    this.openedPanel = 'mainPanel';
    this.refModel = undefined;
    this.recordDate = getTodayForInput();

    this.selectedRecord = this.service.clearVisitMainModel();
  }

}
