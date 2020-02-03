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
import {getEncryptionKey, getFirstDayOfMonthForInput, getTodayForInput, isNullOrEmpty} from '../core/correct-library';

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
      if (this.mainList === undefined) this.mainList = [];
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
      this.infoService.error(error.toString())
    });
    setTimeout (() => {
      if (this.mainList === undefined) {
        this.mainList = [];
      }
    }, 1000);
  }

  showSelectedRecord(record: any): void {
    this.openedPanel = 'mainPanel';
    this.selectedRecord = record.data as CustomerRelationModel;
    this.refModel = record.data as CustomerRelationModel;
    const selectedDate = new Date(this.selectedRecord.actionDate);
    this.today = {year: selectedDate.getFullYear(), month: selectedDate.getMonth() + 1, day: selectedDate.getDate()};
  }

  btnReturnList_Click(): void {
    if (this.openedPanel === 'mainPanel') {
      this.selectedRecord = undefined;
      this.route.navigate(['crm', {}]);
    } else {
      this.openedPanel = 'mainPanel';
    }
  }

  btnNew_Click(): void {
    this.clearSelectedRecord();
  }

  btnSave_Click(): void {
    const date = new Date(this.today.year, this.today.month - 1, this.today.day);
    if (this.selectedRecord.primaryKey === undefined) {
      this.selectedRecord.primaryKey = '';
      this.selectedRecord.actionDate = date.getTime();
      this.service.addItem(this.selectedRecord)
        .then(() => {
          this.infoService.success('Etkinlik başarıyla kaydedildi.');
          this.selectedRecord = undefined;
        }).catch(err => this.infoService.error(err));
    } else {
      this.service.updateItem(this.selectedRecord)
        .then(() => {
          this.infoService.success('Etkinlik başarıyla güncellendi.');
          this.selectedRecord = undefined;
        }).catch(err => this.infoService.error(err));
    }
  }

  btnRemove_Click(): void {
    this.service.removeItem(this.selectedRecord)
      .then(() => {
        this.infoService.success('Etkinlik başarıyla kaldırıldı.');
        this.selectedRecord = undefined;
      }).catch(err => this.infoService.error(err));
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

}
