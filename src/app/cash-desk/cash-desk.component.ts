import { Component, OnInit, OnDestroy } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { Observable } from 'rxjs/internal/Observable';
import { CashDeskModel } from '../models/cash-desk-model';
import { CashDeskService } from '../services/cash-desk.service';
import { AccountTransactionModel } from '../models/account-transaction-model';
import { AccountTransactionService } from '../services/account-transaction-service';
import { InformationService } from '../services/information.service';
import { AuthenticationService } from '../services/authentication.service';
import {getFirstDayOfMonthForInput, getTodayForInput, isNullOrEmpty} from '../core/correct-library';
import { ExcelService } from '../services/excel-service';

@Component({
  selector: 'app-cash-desk',
  templateUrl: './cash-desk.component.html',
  styleUrls: ['./cash-desk.component.css']
})
export class CashDeskComponent implements OnInit, OnDestroy {
  mainList: Array<CashDeskModel>;
  collection: AngularFirestoreCollection<CashDeskModel>;
  transactionList: Array<AccountTransactionModel>;
  selectedRecord: CashDeskModel;
  refModel: CashDeskModel;
  openedPanel: any;
  isMainFilterOpened = false;

  date = new Date();
  filterBeginDate: any;
  filterFinishDate: any;

  constructor(public authService: AuthenticationService, public service: CashDeskService,
              public atService: AccountTransactionService,
              public infoService: InformationService,
              public excelService: ExcelService,
              public db: AngularFirestore) { }

  ngOnInit() {
    this.populateList();
    this.selectedRecord = undefined;
  }

  ngOnDestroy(): void { }

  populateList(): void {
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
    this.selectedRecord = record.data as CashDeskModel;
    this.refModel = record.data as CashDeskModel;
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
      this.service.addItem(this.selectedRecord)
      .then(() => {
        this.infoService.success('Kasa başarıyla kaydedildi.');
        this.selectedRecord = undefined;
      }).catch(err => this.infoService.error(err));
    } else {
      this.service.updateItem(this.selectedRecord)
      .then(() => {
        this.infoService.success('Kasa başarıyla güncellendi.');
        this.selectedRecord = undefined;
      }).catch(err => this.infoService.error(err));
    }
  }

  btnRemove_Click(): void {
    this.service.removeItem(this.selectedRecord)
    .then(() => {
      this.infoService.success('Kasa başarıyla kaldırıldı.');
      this.selectedRecord = undefined;
    }).catch(err => this.infoService.error(err));
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

  btnExportToExcel_Click(): void {
    if (this.mainList.length > 0) {
      this.excelService.exportToExcel(this.transactionList, 'cashdeskTransaction');
    } else {
      this.infoService.error('Aktarılacak kayıt bulunamadı.');
    }
  }

  clearSelectedRecord(): void {
    this.openedPanel = 'mainPanel';
    this.refModel = undefined;
    this.selectedRecord = {primaryKey: undefined, name: '', description: '', userPrimaryKey: this.authService.getUid()};
    console.log(this.selectedRecord);
  }

  clearMainFiler(): void {
    this.filterBeginDate = getFirstDayOfMonthForInput();
    this.filterFinishDate = getTodayForInput();
  }

  onClickShowTransactionReport(): void {
    this.openedPanel = 'transactionReport';
    this.transactionList = [];
    this.clearMainFiler();
    const beginDate = new Date(this.filterBeginDate.year, this.filterBeginDate.month - 1, this.filterBeginDate.day, 0, 0, 0);
    const finishDate = new Date(this.filterFinishDate.year, this.filterFinishDate.month - 1, this.filterFinishDate.day + 1, 0, 0, 0);
    this.atService.getCashDeskTransactions(this.selectedRecord.primaryKey, beginDate, finishDate).subscribe(list => {
      console.log(list);
      list.forEach(item => {
        this.transactionList.push(item);
      });
    });
  }

}
