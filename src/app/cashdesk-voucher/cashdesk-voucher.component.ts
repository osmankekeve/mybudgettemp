import { Component, OnInit, OnDestroy } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Observable } from 'rxjs/internal/Observable';
import { CustomerService } from '../services/customer.service';
import { AccountTransactionModel } from '../models/account-transaction-model';
import { AccountTransactionService } from '../services/account-transaction.service';
import { AuthenticationService } from '../services/authentication.service';
import { CashDeskModel } from '../models/cash-desk-model';
import { CashDeskService } from '../services/cash-desk.service';
import { InformationService } from '../services/information.service';
import { CashdeskVoucherModel } from '../models/cashdesk-voucher-model';
import { CashdeskVoucherService } from '../services/cashdesk-voucher.service';
import { getFirstDayOfMonthForInput, getTodayForInput, isNullOrEmpty, getDateForInput, getInputDataForInsert, getEncriptionKey
} from '../core/correct-library';
import { ExcelService } from '../services/excel-service';
import * as CryptoJS from 'crypto-js';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-cashdesk-voucher',
  templateUrl: './cashdesk-voucher.component.html',
  styleUrls: ['./cashdesk-voucher.component.css']
})
export class CashdeskVoucherComponent implements OnInit, OnDestroy {
  mainList: Array<CashdeskVoucherModel>;
  cashDeskList$: Observable<CashDeskModel[]>;
  recordTransactionList$: Observable<AccountTransactionModel[]>;
  selectedRecord: CashdeskVoucherModel;
  refModel: CashdeskVoucherModel;
  isRecordHasTransacton = false;
  isMainFilterOpened = false;
  recordDate: any;
  encryptSecretKey: string = getEncriptionKey();

  date = new Date();
  filterBeginDate: any;
  filterFinishDate: any;
  totalValues = {
    amount: 0
  };

  constructor(public authService: AuthenticationService, public route: Router, public router: ActivatedRoute,
              public service: CashdeskVoucherService,
              public cdService: CashDeskService,
              public atService: AccountTransactionService,
              public infoService: InformationService,
              public excelService: ExcelService,
              public cService: CustomerService, public db: AngularFirestore) { }

  ngOnInit() {
    this.clearMainFiler();
    this.populateList();
    this.cashDeskList$ = this.cdService.getAllItems();
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
    this.mainList = [];
    this.totalValues = {
      amount: 0
    };
    const beginDate = new Date(this.filterBeginDate.year, this.filterBeginDate.month - 1, this.filterBeginDate.day, 0, 0, 0);
    const finishDate = new Date(this.filterFinishDate.year, this.filterFinishDate.month - 1, this.filterFinishDate.day + 1, 0, 0, 0);
    this.service.getMainItemsBetweenDates(beginDate, finishDate).subscribe(list => {
      list.forEach((item: any) => {
        if (item.actionType === 'added') {
          this.mainList.push(item);
          this.totalValues.amount += item.data.amount;
        } else if (item.actionType === 'removed') {
          this.mainList.splice(this.mainList.indexOf(this.refModel), 1);
          this.totalValues.amount -= item.data.amount;
        } else if (item.actionType === 'modified') {
          this.mainList[this.mainList.indexOf(this.refModel)] = item.returnData;
          this.totalValues.amount -= this.refModel.amount;
          this.totalValues.amount += item.data.amount;
        } else {
          // nothing
        }
      });
    });
  }

  showSelectedRecord(record: any): void {
    this.selectedRecord = record.data as CashdeskVoucherModel;
    this.refModel = record.data as CashdeskVoucherModel;
    this.recordDate = getDateForInput(this.selectedRecord.insertDate);
    if (this.selectedRecord.type === 'open') { this.selectedRecord.secondCashDeskPrimaryKey = '-1'; }
    this.atService.getRecordTransactionItems(this.selectedRecord.primaryKey)
    .subscribe(list => {
      if (list.length > 0) {
        this.isRecordHasTransacton = true;

      } else {
        this.isRecordHasTransacton = false;
      }
    });
  }

  btnReturnList_Click(): void {
    this.selectedRecord = undefined;
    this.route.navigate(['cashdesk-voucher', {}]);
  }

  btnNew_Click(): void {
    this.clearSelectedRecord();
  }

  btnSave_Click(): void {
    this.selectedRecord.insertDate = getInputDataForInsert(this.recordDate);
    if (this.selectedRecord.amount <= 0) {
      this.infoService.error('Tutar sıfırdan büyük olmalıdır.');
    } else if (isNullOrEmpty(this.recordDate)) {
      this.infoService.error('Lütfen kayıt tarihi seçiniz.');
    } else {
      if (this.selectedRecord.primaryKey === undefined) {
        const newId = this.db.createId();
        this.selectedRecord.primaryKey = '';

        this.service.setItem(this.selectedRecord, newId).then(() => {
          this.db.collection('tblAccountTransaction').add({
            primaryKey: '',
            userPrimaryKey: this.selectedRecord.userPrimaryKey,
            parentPrimaryKey: this.selectedRecord.firstCashDeskPrimaryKey,
            parentType: 'cashDesk',
            transactionPrimaryKey: newId,
            transactionType: 'cashDeskVoucher',
            amountType: this.selectedRecord.transactionType,
            amount: this.selectedRecord.transactionType === 'credit' ? this.selectedRecord.amount : this.selectedRecord.amount * -1,
            cashDeskPrimaryKey: this.selectedRecord.type === 'open' ? '-1' : this.selectedRecord.secondCashDeskPrimaryKey,
            receiptNo: this.selectedRecord.receiptNo,
            insertDate: this.selectedRecord.insertDate
          }).then(() => {
            if (this.selectedRecord.type === 'transfer') {
              this.db.collection('tblAccountTransaction').add({
                primaryKey: '',
                userPrimaryKey: this.selectedRecord.userPrimaryKey,
                parentPrimaryKey: this.selectedRecord.secondCashDeskPrimaryKey,
                parentType: 'cashDesk',
                transactionPrimaryKey: newId,
                transactionType: 'cashDeskVoucher',
                amountType: this.selectedRecord.transactionType,
                amount: this.selectedRecord.transactionType === 'debit' ? this.selectedRecord.amount : this.selectedRecord.amount * -1,
                cashDeskPrimaryKey: this.selectedRecord.firstCashDeskPrimaryKey,
                receiptNo: this.selectedRecord.receiptNo,
                insertDate: this.selectedRecord.insertDate
              }).then(() => {
                this.infoService.success('Fiş başarıyla kaydedildi.');
                this.selectedRecord = undefined;
              }).catch(err => this.infoService.error(err));
            } else {
              this.infoService.success('Fiş başarıyla kaydedildi.');
              this.selectedRecord = undefined;
            }
          }).catch(err => this.infoService.error(err));
        }).catch(err => this.infoService.error(err));
      }
    }
  }

  btnRemove_Click(): void {
    this.service.removeItem(this.selectedRecord).then(() => {
      this.db.collection<AccountTransactionModel>('tblAccountTransaction',
        ref => ref.where('transactionPrimaryKey', '==', this.selectedRecord.primaryKey)).get().subscribe(list => {
          list.forEach((item) => {
            this.db.collection('tblAccountTransaction').doc(item.id).delete().then(() => {
              this.infoService.success('Fiş başarıyla kaldırıldı.');
              this.selectedRecord = undefined;
            }).catch(err => this.infoService.error(err));
          });
        });
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

  clearSelectedRecord(): void {
    this.isRecordHasTransacton = false;
    this.refModel = undefined;
    this.recordDate = getTodayForInput();
    this.selectedRecord = {primaryKey: undefined, firstCashDeskPrimaryKey: '-1', secondCashDeskPrimaryKey: '',
    receiptNo: '', type: '-1', description: '', userPrimaryKey: this.authService.getUid()};
  }

  btnExportToExcel_Click(): void {
    if (this.mainList.length > 0) {
      this.excelService.exportToExcel(this.mainList, 'cashdeskVoucher');
    } else {
      this.infoService.error('Aktarılacak kayıt bulunamadı.');
    }
  }

  clearMainFiler(): void {
    this.filterBeginDate = getFirstDayOfMonthForInput();
    this.filterFinishDate = getTodayForInput();
  }

  onChangeVoucherType(record: any): void {
    if (record === 'open') { this.selectedRecord.secondCashDeskPrimaryKey = '-1'; }
  }
}
