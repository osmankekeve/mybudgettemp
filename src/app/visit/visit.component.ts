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
  getTodayForInput,
  getDateForInput,
  getInputDataForInsert,
  getEncryptionKey,
  getFirstDayOfMonthForInput, isNullOrEmpty
} from '../core/correct-library';
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
  collection: AngularFirestoreCollection<VisitMainModel>;
  customerList$: Observable<CustomerModel[]>;
  profileList$: Observable<ProfileMainModel[]>;
  selectedRecord: VisitMainModel;
  refModel: VisitMainModel;
  isShowAllRecords = false;
  openedPanel: any;
  recordDate: any;
  encryptSecretKey: string = getEncryptionKey();
  filterBeginDate: any;
  filterFinishDate: any;
  isMainFilterOpened = false;

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
    const beginDate = new Date(this.filterBeginDate.year, this.filterBeginDate.month - 1, this.filterBeginDate.day, 0, 0, 0);
    const finishDate = new Date(this.filterFinishDate.year, this.filterFinishDate.month - 1, this.filterFinishDate.day + 1, 0, 0, 0);
    this.mainList = [];
    this.service.getMainItemsBetweenDates(beginDate, finishDate).subscribe(list => {
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
    }
  }

  clearSelectedRecord(): void {
    this.openedPanel = 'mainPanel';
    this.refModel = undefined;
    this.recordDate = getTodayForInput();

    this.selectedRecord = this.service.clearVisitMainModel();
  }

  clearMainFiler(): void {
    this.filterBeginDate = getFirstDayOfMonthForInput();
    this.filterFinishDate = getTodayForInput();
  }

}
