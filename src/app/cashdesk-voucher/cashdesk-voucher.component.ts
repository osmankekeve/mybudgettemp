import { Component, OnInit, OnDestroy } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Observable } from 'rxjs/internal/Observable';
import { CustomerService } from '../services/customer.service';
import { AccountTransactionModel } from '../models/account-transaction-model';
import { AccountTransactionService } from '../services/account-transaction-service';
import { AuthenticationService } from '../services/authentication.service';
import { CashDeskModel } from '../models/cash-desk-model';
import { CashDeskService } from '../services/cash-desk.service';
import { InformationService } from '../services/information.service';
import { CashdeskVoucherModel } from '../models/cashdesk-voucher-model';
import { CashdeskVoucherService } from '../services/cashdesk-voucher.service';
import { getFirstDayOfMonthForInput, getTodayForInput, isNullOrEmpty, getDateForInput, getInputDataForInsert 
} from '../core/correct-library';
import { ExcelService } from '../services/excel-service';

@Component({
  selector: 'app-cashdesk-voucher',
  templateUrl: './cashdesk-voucher.component.html',
  styleUrls: ['./cashdesk-voucher.component.css']
})
export class CashdeskVoucherComponent implements OnInit, OnDestroy {
  mainList: Array<CashdeskVoucherModel>;
  mainList1: Array<CashdeskVoucherModel>;
  mainList2: Array<CashdeskVoucherModel>;
  mainList3: Array<CashdeskVoucherModel>;
  mainList4: Array<CashdeskVoucherModel>;
  cashDeskList$: Observable<CashDeskModel[]>;
  recordTransactionList$: Observable<AccountTransactionModel[]>;
  selectedRecord: CashdeskVoucherModel;
  refModel: CashdeskVoucherModel;
  isRecordHasTransacton = false;
  isShowAllRecords = false;
  isMainFilterOpened = false;
  recordDate: any;

  date = new Date();
  filterBeginDate: any;
  filterFinishDate: any;
  totalValues = {
    amount: 0
  };

  constructor(public authServis: AuthenticationService,
              public service: CashdeskVoucherService,
              public cdService: CashDeskService,
              public atService: AccountTransactionService,
              public infoService: InformationService,
              public excelService: ExcelService,
              public cService: CustomerService, public db: AngularFirestore) { }

  ngOnInit() {
    this.populateList();
    this.cashDeskList$ = this.cdService.getAllItems();
    this.selectedRecord = undefined;
  }

  ngOnDestroy(): void {
  }

  populateList(): void {
    const date = new Date();
    const start1 = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
    const end1 = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1, 0, 0, 0);
    const start2 = new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1, 0, 0, 0);
    const end2 = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
    const start3 = new Date(date.getFullYear(), date.getMonth(), date.getDate() - 2, 0, 0, 0);
    const end3 = new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1, 0, 0, 0);
    const start4 = new Date(date.getFullYear(), date.getMonth(), date.getDate() - 3, 0, 0, 0);
    const end4 = new Date(date.getFullYear(), date.getMonth(), date.getDate() - 2, 0, 0, 0);

    this.mainList1 = [];
    this.mainList2 = [];
    this.mainList3 = [];
    this.mainList4 = [];
    this.service.getMainItemsBetweenDates(start4, end1).subscribe(list => {
      list.forEach((item: any) => {
        if (item.actionType === 'added') {
          if (item.data.insertDate > start1.getTime() && item.data.insertDate < end1.getTime()) { this.mainList1.push(item); }
          if (item.data.insertDate > start2.getTime() && item.data.insertDate < end2.getTime()) { this.mainList2.push(item); }
          if (item.data.insertDate > start3.getTime() && item.data.insertDate < end3.getTime()) { this.mainList3.push(item); }
          if (item.data.insertDate > start4.getTime() && item.data.insertDate < end4.getTime()) { this.mainList4.push(item); }
        } else if (item.actionType === 'removed') {
          if (item.data.insertDate > start1.getTime() && item.data.insertDate < end1.getTime()) {
            this.mainList1.splice(this.mainList1.indexOf(this.refModel), 1);
          }
          if (item.data.insertDate > start2.getTime() && item.data.insertDate < end2.getTime()) {
            this.mainList2.splice(this.mainList2.indexOf(this.refModel), 1);
           }
          if (item.data.insertDate > start3.getTime() && item.data.insertDate < end3.getTime()) {
            this.mainList3.splice(this.mainList3.indexOf(this.refModel), 1);
          }
          if (item.data.insertDate > start4.getTime() && item.data.insertDate < end4.getTime()) {
            this.mainList4.splice(this.mainList4.indexOf(this.refModel), 1);
          }
        } else if (item.actionType === 'modified') {
          if (item.data.insertDate > start1.getTime() && item.data.insertDate < end1.getTime()) {
            this.mainList1[this.mainList1.indexOf(this.refModel)] = item.data;
          }
          if (item.data.insertDate > start2.getTime() && item.data.insertDate < end2.getTime()) {
            this.mainList2[this.mainList2.indexOf(this.refModel)] = item.data;
           }
          if (item.data.insertDate > start3.getTime() && item.data.insertDate < end3.getTime()) {
            this.mainList3[this.mainList3.indexOf(this.refModel)] = item.data;
          }
          if (item.data.insertDate > start4.getTime() && item.data.insertDate < end4.getTime()) {
            this.mainList4[this.mainList4.indexOf(this.refModel)] = item.data;
          }
        } else {
          // nothing
        }
      });
    });
  }

  populateAllRecords(): void {
    this.mainList = [];
    this.totalValues = {
      amount: 0
    };
    const beginDate = new Date(this.filterBeginDate.year, this.filterBeginDate.month - 1, this.filterBeginDate.day, 0, 0, 0);
    const finishDate = new Date(this.filterFinishDate.year, this.filterFinishDate.month - 1, this.filterFinishDate.day + 1, 0, 0, 0);
    this.service.getMainItemsBetweenDates(beginDate, finishDate).subscribe(list => {
      console.log(list);
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
    console.log(record);
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

  btnAllRecords_Click(): void {
    if (this.isShowAllRecords) {
      this.isShowAllRecords = false;
    } else {
      this.isShowAllRecords = true;
      this.clearMainFiler();
      this.populateAllRecords();
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
      this.populateAllRecords();
    }
  }

  clearSelectedRecord(): void {
    this.isRecordHasTransacton = false;
    this.refModel = undefined;
    this.recordDate = getTodayForInput();
    this.selectedRecord = {primaryKey: undefined, firstCashDeskPrimaryKey: '-1', secondCashDeskPrimaryKey: '',
    receiptNo: '', type: '-1', description: '', userPrimaryKey: this.authServis.getUid()};
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
