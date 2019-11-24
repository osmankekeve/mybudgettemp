import { Component, OnInit, OnDestroy } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Observable } from 'rxjs/internal/Observable';
import { CustomerModel } from '../models/customer-model';
import { CustomerService } from '../services/customer.service';
import { AccountTransactionModel } from '../models/account-transaction-model';
import { AccountTransactionService } from '../services/account-transaction-service';
import { AuthenticationService } from '../services/authentication.service';
import { CashDeskModel } from '../models/cash-desk-model';
import { CashDeskService } from '../services/cash-desk.service';
import { InformationService } from '../services/information.service';
import { AccountVoucherModel } from '../models/account-voucher-model';
import { AccountVoucherService } from '../services/account-voucher.service';
import { getFirstDayOfMonthForInput, getTodayForInput, getInputDataForInsert, getDateForInput, isNullOrEmpty, getEncriptionKey
} from '../core/correct-library';
import { ExcelService } from '../services/excel-service';
import * as CryptoJS from 'crypto-js';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-account-voucher',
  templateUrl: './account-voucher.component.html',
  styleUrls: ['./account-voucher.component.css']
})
export class AccountVoucherComponent implements OnInit, OnDestroy {
  mainList: Array<AccountVoucherModel>;
  mainList1: Array<AccountVoucherModel>;
  mainList2: Array<AccountVoucherModel>;
  mainList3: Array<AccountVoucherModel>;
  mainList4: Array<AccountVoucherModel>;
  filteredMainList: Array<AccountVoucherModel>;
  customerList$: Observable<CustomerModel[]>;
  cashDeskList$: Observable<CashDeskModel[]>;
  recordTransactionList$: Observable<AccountTransactionModel[]>;
  selectedRecord: AccountVoucherModel;
  refModel: AccountVoucherModel;
  isRecordHasTransaction = false;
  isShowAllRecords = false;
  isMainFilterOpened = false;
  recordDate: any;
  encryptSecretKey: string = getEncriptionKey();

  date = new Date();
  filterBeginDate: any;
  filterFinishDate: any;
  totalValues = {
    amount: 0
  };

  constructor(public authServis: AuthenticationService, public route: Router, public router: ActivatedRoute,
              public service: AccountVoucherService,
              public cdService: CashDeskService,
              public atService: AccountTransactionService,
              public infoService: InformationService,
              public excelService: ExcelService,
              public cService: CustomerService, public db: AngularFirestore) { }

  ngOnInit() {
    this.populateList();
    this.customerList$ = this.cService.getAllItems();
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
    this.selectedRecord = record.data as AccountVoucherModel;
    this.refModel = record.data as AccountVoucherModel;
    this.recordDate = getDateForInput(this.selectedRecord.insertDate);
    this.atService.getRecordTransactionItems(this.selectedRecord.primaryKey)
    .subscribe(list => {
      if (list.length > 0) {
        this.isRecordHasTransaction = true;

      } else {
        this.isRecordHasTransaction = false;
      }
    });
  }

  btnReturnList_Click(): void {
    this.selectedRecord = undefined;
    this.route.navigate(['account-voucher', {}]);
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
          const trans = {
            primaryKey: '',
            userPrimaryKey: this.selectedRecord.userPrimaryKey,
            receiptNo: this.selectedRecord.receiptNo,
            transactionPrimaryKey: newId,
            transactionType: 'accountVoucher',
            parentPrimaryKey: this.selectedRecord.customerCode,
            parentType: 'customer',
            cashDeskPrimaryKey: this.selectedRecord.cashDeskPrimaryKey,
            amount: this.selectedRecord.type === 'creditVoucher' ? this.selectedRecord.amount : this.selectedRecord.amount * -1,
            amountType: this.selectedRecord.type === 'creditVoucher' ? 'credit' : 'debit',
            insertDate: this.selectedRecord.insertDate,
          };
          this.db.collection('tblAccountTransaction').add(trans).then(() => {
            this.infoService.success('Fiş başarıyla kaydedildi.');
            this.selectedRecord = undefined;
          }).catch(err => this.infoService.error(err));
        }).catch(err => this.infoService.error(err));

      } else {
        this.service.updateItem(this.selectedRecord).then(() => {
          this.db.collection<AccountTransactionModel>('tblAccountTransaction',
          ref => ref.where('transactionPrimaryKey', '==', this.selectedRecord.primaryKey)).get().subscribe(list => {
            list.forEach((item) => {
              this.db.collection('tblAccountTransaction').doc(item.id).update({
                receiptNo: this.selectedRecord.receiptNo,
                cashDeskPrimaryKey: this.selectedRecord.cashDeskPrimaryKey,
                amount: this.selectedRecord.type === 'creditVoucher' ? this.selectedRecord.amount : this.selectedRecord.amount * -1,
              }).then(() => {
                this.infoService.success('Fiş başarıyla güncellendi.');
                this.selectedRecord = undefined;
              }).catch(err => this.infoService.error(err));

            });
          });
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

  btnExportToExcel_Click(): void {
    if (this.mainList.length > 0) {
      this.excelService.exportToExcel(this.mainList, 'accountVoucher');
    } else {
      this.infoService.error('Aktarılacak kayıt bulunamadı.');
    }
  }

  clearMainFiler(): void {
    this.filterBeginDate = getFirstDayOfMonthForInput();
    this.filterFinishDate = getTodayForInput();
  }

  clearSelectedRecord(): void {
    this.isRecordHasTransaction = false;
    this.refModel = undefined;
    this.recordDate = getTodayForInput();
    this.selectedRecord = {primaryKey: undefined, customerCode: '-1', receiptNo: '', type: '-1', description: '',
    userPrimaryKey: this.authServis.getUid()};
  }

}
