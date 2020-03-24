import { Component, OnInit, OnDestroy } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Observable } from 'rxjs/internal/Observable';
import { CustomerService } from '../services/customer.service';
import { AccountTransactionModel } from '../models/account-transaction-model';
import { AccountTransactionService } from '../services/account-transaction.service';
import { AuthenticationService } from '../services/authentication.service';
import { CashDeskService } from '../services/cash-desk.service';
import { InformationService } from '../services/information.service';
import { CashDeskVoucherService } from '../services/cashdesk-voucher.service';
import {
  getFirstDayOfMonthForInput, getTodayForInput, isNullOrEmpty, getDateForInput, getInputDataForInsert, getEncryptionKey,
  getFloat, currencyFormat, moneyFormat
} from '../core/correct-library';
import { ExcelService } from '../services/excel-service';
import * as CryptoJS from 'crypto-js';
import { Router, ActivatedRoute } from '@angular/router';
import {SettingService} from '../services/setting.service';
import {CashDeskVoucherMainModel} from '../models/cashdesk-voucher-main-model';
import {CashDeskMainModel} from '../models/cash-desk-main-model';

@Component({
  selector: 'app-cashdesk-voucher',
  templateUrl: './cashdesk-voucher.component.html',
  styleUrls: ['./cashdesk-voucher.component.css']
})
export class CashdeskVoucherComponent implements OnInit, OnDestroy {
  mainList: Array<CashDeskVoucherMainModel>;
  cashDeskList$: Observable<CashDeskMainModel[]>;
  selectedRecord: CashDeskVoucherMainModel;
  refModel: CashDeskVoucherMainModel;
  isRecordHasTransaction = false;
  isMainFilterOpened = false;
  recordDate: any;
  searchText: '';
  encryptSecretKey: string = getEncryptionKey();

  date = new Date();
  filterBeginDate: any;
  filterFinishDate: any;
  totalValues = {
    amount: 0
  };
  onTransaction = false;

  constructor(public authService: AuthenticationService, public route: Router, public router: ActivatedRoute,
              public service: CashDeskVoucherService, public cdService: CashDeskService,
              public atService: AccountTransactionService, public infoService: InformationService,
              public excelService: ExcelService, public sService: SettingService,
              public cService: CustomerService, public db: AngularFirestore) { }

  ngOnInit() {
    this.clearMainFiler();
    this.populateList();
    this.cashDeskList$ = this.cdService.getMainItems();
    this.selectedRecord = undefined;

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
    this.totalValues = {
      amount: 0
    };
    const beginDate = new Date(this.filterBeginDate.year, this.filterBeginDate.month - 1, this.filterBeginDate.day, 0, 0, 0);
    const finishDate = new Date(this.filterFinishDate.year, this.filterFinishDate.month - 1, this.filterFinishDate.day + 1, 0, 0, 0);
    this.service.getMainItemsBetweenDates(beginDate, finishDate).subscribe(list => {
      if (this.mainList === undefined) { this.mainList = []; }
      list.forEach((data: any) => {
        const item = data.returnData as CashDeskVoucherMainModel;
        if (item.actionType === 'added') {
          this.mainList.push(item);
          this.totalValues.amount += item.data.amount;
        } else if (item.actionType === 'removed') {
          this.mainList.splice(this.mainList.indexOf(this.refModel), 1);
          this.totalValues.amount -= item.data.amount;
        } else if (item.actionType === 'modified') {
          this.mainList[this.mainList.indexOf(this.refModel)] = item;
          this.totalValues.amount -= this.refModel.data.amount;
          this.totalValues.amount += item.data.amount;
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
    this.selectedRecord = record as CashDeskVoucherMainModel;
    this.refModel = record as CashDeskVoucherMainModel;
    this.recordDate = getDateForInput(this.selectedRecord.data.insertDate);
    if (this.selectedRecord.data.type === 'open') { this.selectedRecord.data.secondCashDeskPrimaryKey = '-1'; }
    this.atService.getRecordTransactionItems(this.selectedRecord.data.primaryKey)
    .subscribe(list => {
      this.isRecordHasTransaction = list.length > 0;
    });
  }

  btnReturnList_Click(): void {
    this.selectedRecord = undefined;
    this.route.navigate(['cashdesk-voucher', {}]);
  }

  async btnNew_Click(): Promise<void> {
    this.clearSelectedRecord();
    const receiptNoData = await this.sService.getCashDeskVoucherCode();
    if (receiptNoData !== null) {
      this.selectedRecord.data.receiptNo = receiptNoData;
    }
  }

  async btnSave_Click(): Promise<void> {
    this.selectedRecord.data.insertDate = getInputDataForInsert(this.recordDate);
    Promise.all([this.service.checkForSave(this.selectedRecord)])
      .then(async (values: any) => {
      if (this.selectedRecord.data.primaryKey === null) {
        const newId = this.db.createId();
        this.selectedRecord.data.primaryKey = '';
        await this.service.setItem(this.selectedRecord, newId)
          .then(() => {
          let calculatedAmount1 = this.selectedRecord.data.transactionType === 'credit' ?
            this.selectedRecord.data.amount : this.selectedRecord.data.amount * -1;
          if (this.selectedRecord.data.type === 'transfer') { calculatedAmount1 =  calculatedAmount1 * -1; }

          let calculatedAmount2 = this.selectedRecord.data.transactionType === 'credit' ?
            this.selectedRecord.data.amount * -1 : this.selectedRecord.data.amount;
          if (this.selectedRecord.data.type === 'transfer') { calculatedAmount2 =  calculatedAmount2 * -1; }

          this.db.collection('tblAccountTransaction').add({
            primaryKey: '',
            userPrimaryKey: this.selectedRecord.data.userPrimaryKey,
            parentPrimaryKey: this.selectedRecord.data.firstCashDeskPrimaryKey,
            parentType: 'cashDesk',
            transactionPrimaryKey: newId,
            transactionType: 'cashDeskVoucher',
            amountType: this.selectedRecord.data.transactionType,
            amount: calculatedAmount1,
            cashDeskPrimaryKey: this.selectedRecord.data.type === 'transfer' ? this.selectedRecord.data.secondCashDeskPrimaryKey : '-1' ,
            receiptNo: this.selectedRecord.data.receiptNo,
            insertDate: this.selectedRecord.data.insertDate
          })
            .then(() => {
            if (this.selectedRecord.data.type === 'transfer') {
              this.db.collection('tblAccountTransaction').add({
                primaryKey: '',
                userPrimaryKey: this.selectedRecord.data.userPrimaryKey,
                parentPrimaryKey: this.selectedRecord.data.secondCashDeskPrimaryKey,
                parentType: 'cashDesk',
                transactionPrimaryKey: newId,
                transactionType: 'cashDeskVoucher',
                amountType: this.selectedRecord.data.transactionType,
                amount: calculatedAmount2,
                cashDeskPrimaryKey: this.selectedRecord.data.firstCashDeskPrimaryKey,
                receiptNo: this.selectedRecord.data.receiptNo,
                insertDate: this.selectedRecord.data.insertDate
              })
                .then(() => {
                this.infoService.success('Fiş başarıyla kaydedildi.');
                this.selectedRecord = undefined;
              })
                .catch((error) => {
                  this.finishProcessAndError(error);
                });
            } else {
              this.infoService.success('Fiş başarıyla kaydedildi.');
              this.selectedRecord = undefined;
            }
          })
            .catch((error) => {
              this.finishProcessAndError(error);
            });
        })
          .catch((error) => {
            this.finishProcessAndError(error);
          });
      }
    })
      .catch((error) => {
        this.finishProcessAndError(error);
      });
  }

  async btnRemove_Click(): Promise<void> {
    Promise.all([this.service.checkForRemove(this.selectedRecord)])
      .then(async (values: any) => {
      await this.service.removeItem(this.selectedRecord)
        .then(() => {
        this.db.collection<AccountTransactionModel>('tblAccountTransaction',
          ref => ref.where('transactionPrimaryKey', '==', this.selectedRecord.data.primaryKey))
          .get()
          .subscribe(list => {
          list.forEach((item) => {
            this.db.collection('tblAccountTransaction').doc(item.id).delete()
              .then(() => {
              this.infoService.success('Fiş başarıyla kaldırıldı.');
              this.selectedRecord = undefined;
            })
              .catch((error) => {
                this.finishProcessAndError(error);
              });
          });
        });
      })
        .catch((error) => {
          this.finishProcessAndError(error);
        });
    })
      .catch((error) => {
        this.finishProcessAndError(error);
      });
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
      this.excelService.exportToExcel(this.mainList, 'cashdeskVoucher');
    } else {
      this.infoService.error('Aktarılacak kayıt bulunamadı.');
    }
  }

  onChangeVoucherType(record: any): void {
    if (record === 'open') { this.selectedRecord.data.secondCashDeskPrimaryKey = '-1'; }
  }

  clearSelectedRecord(): void {
    this.isRecordHasTransaction = false;
    this.refModel = undefined;
    this.recordDate = getTodayForInput();
    this.selectedRecord = this.service.clearMainModel();
  }

  clearMainFiler(): void {
    this.filterBeginDate = getFirstDayOfMonthForInput();
    this.filterFinishDate = getTodayForInput();
  }

  finishProcessAndError(error: any): void {
    // error.message sistem hatası
    // error kontrol hatası
    this.onTransaction = false;
    this.infoService.error(error.message !== undefined ? error.message : error);
  }

  format_amount($event): void {
    this.selectedRecord.data.amount = getFloat(moneyFormat($event.target.value));
    this.selectedRecord.amountFormatted = currencyFormat(getFloat(moneyFormat($event.target.value)));
  }

  focus_amount(): void {
    if (this.selectedRecord.data.amount === 0) {
      this.selectedRecord.data.amount = null;
      this.selectedRecord.amountFormatted = null;
    }
  }
}
