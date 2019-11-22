import { Component, OnInit, OnDestroy } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { CashDeskService } from '../services/cash-desk.service';
import { AccountTransactionService } from '../services/account-transaction-service';
import { InformationService } from '../services/information.service';
import { AuthenticationService } from '../services/authentication.service';
import { CustomerRelationModel } from '../models/customer-relation-model';
import { CustomerRelationService } from '../services/crm.service';
import { NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import { Observable } from 'rxjs';
import { CustomerModel } from '../models/customer-model';
import { CustomerService } from '../services/customer.service';
import {ActivatedRoute} from '@angular/router';
import * as CryptoJS from 'crypto-js';
import { getEncriptionKey } from '../core/correct-library';

@Component({
  selector: 'app-crm',
  templateUrl: './crm.component.html',
  styleUrls: ['./crm.component.css']
})
export class CRMComponent implements OnInit, OnDestroy {
  mainList: Array<CustomerRelationModel>;
  mainList1: Array<CustomerRelationModel>;
  mainList2: Array<CustomerRelationModel>;
  mainList3: Array<CustomerRelationModel>;
  collection: AngularFirestoreCollection<CustomerRelationModel>;
  customerList$: Observable<CustomerModel[]>;
  selectedRecord: CustomerRelationModel;
  refModel: CustomerRelationModel;
  isShowAllRecords = false;
  openedPanel: any;
  date = new Date();
  today: NgbDateStruct = {year: this.date.getFullYear(), month: this.date.getMonth() + 1, day: this.date.getDate()};
  encryptSecretKey: string = getEncriptionKey();

  constructor(public authService: AuthenticationService, public service: CustomerRelationService,
              public atService: AccountTransactionService,
              public infoService: InformationService,
              public cService: CustomerService, public router: ActivatedRoute,
              public db: AngularFirestore) {
  }

  ngOnInit() {

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
    this.selectedRecord = record.data as CustomerRelationModel;
    this.refModel = record.data as CustomerRelationModel;
    const selectedDate = new Date(this.selectedRecord.actionDate);
    this.today = {year: selectedDate.getFullYear(), month: selectedDate.getMonth() + 1, day: selectedDate.getDate()};
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
    const selectedDate = new Date();
    this.today = {year: selectedDate.getFullYear(), month: selectedDate.getMonth() + 1, day: selectedDate.getDate()};
    this.selectedRecord = {
      primaryKey: undefined, description: '', status: 'waiting', parentType: 'customer',
      userPrimaryKey: this.authService.getUid(), insertDate: Date.now()
    };
  }

}
