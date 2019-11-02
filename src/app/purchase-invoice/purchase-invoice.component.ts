import { Component, OnInit, OnDestroy } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { Observable } from 'rxjs/internal/Observable';
import { PurchaseInvoiceService } from '../services/purchase-invoice.service';
import { PurchaseInvoiceModel } from '../models/purchase-invoice-model';
import { CustomerModel } from '../models/customer-model';
import { CustomerService } from '../services/customer.service';
import { AuthenticationService } from '../services/authentication.service';
import { AccountTransactionModel } from '../models/account-transaction-model';
import { AccountTransactionService } from '../services/account-transaction-service';
import { InformationService } from '../services/information.service';
import {
  getFirstDayOfMonthForInput, getTodayForInput, getDateForInput, getInputDataForInsert, isNullOrEmpty, getDateForExcel
} from '../core/correct-library';
import {ExcelService} from '../services/excel-service';

@Component({
  selector: 'app-purchase-invoice',
  templateUrl: './purchase-invoice.component.html',
  styleUrls: ['./purchase-invoice.component.css']
})
export class PurchaseInvoiceComponent implements OnInit, OnDestroy {
  mainList: Array<PurchaseInvoiceModel>;
  mainList1: Array<PurchaseInvoiceModel>;
  mainList2: Array<PurchaseInvoiceModel>;
  mainList3: Array<PurchaseInvoiceModel>;
  mainList4: Array<PurchaseInvoiceModel>;
  customerList$: Observable<CustomerModel[]>;
  selectedRecord: PurchaseInvoiceModel;
  refModel: PurchaseInvoiceModel;
  isRecordHasTransaction = false;
  isShowAllRecords = false;
  isMainFilterOpened = false;
  recordDate: any;

  date = new Date();
  filterBeginDate: any;
  filterFinishDate: any;
  filterCustomerCode: any;
  totalValues = {
    totalPrice: 0,
    totalPriceWithTax: 0,
  };

  constructor(public authService: AuthenticationService,
              public service: PurchaseInvoiceService,
              public cService: CustomerService,
              public atService: AccountTransactionService,
              public infoService: InformationService,
              public excelService: ExcelService,
              public db: AngularFirestore) { }

  ngOnInit() {
    this.populateList();
    this.customerList$ = this.cService.getAllItems();
    this.selectedRecord = undefined;
  }

  ngOnDestroy(): void { }

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
      totalPrice: 0,
      totalPriceWithTax: 0,
    };
    const beginDate = new Date(this.filterBeginDate.year, this.filterBeginDate.month - 1, this.filterBeginDate.day, 0, 0, 0);
    const finishDate = new Date(this.filterFinishDate.year, this.filterFinishDate.month - 1, this.filterFinishDate.day + 1, 0, 0, 0);

    this.service.getMainItemsBetweenDatesWithCustomer(beginDate, finishDate, this.filterCustomerCode).subscribe(list => {
      list.forEach((item: any) => {
        if (item.actionType === 'added') {
          this.mainList.push(item);
          this.totalValues.totalPrice += item.data.totalPrice;
          this.totalValues.totalPriceWithTax += item.data.totalPriceWithTax;
        } else if (item.actionType === 'removed') {
          this.mainList.splice(this.mainList.indexOf(this.refModel), 1);
          this.totalValues.totalPrice -= item.data.totalPrice;
          this.totalValues.totalPriceWithTax -= item.data.totalPriceWithTax;
        } else if (item.actionType === 'modified') {
          this.mainList[this.mainList.indexOf(this.refModel)] = item.data;
          this.totalValues.totalPrice -= this.refModel.totalPrice;
          this.totalValues.totalPriceWithTax -= this.refModel.totalPriceWithTax;
          this.totalValues.totalPrice += item.data.totalPrice;
          this.totalValues.totalPriceWithTax += item.data.totalPriceWithTax;
        } else {
          // nothing
        }
      });
    });
  }

  showSelectedRecord(record: any): void {
    this.selectedRecord = record.data as PurchaseInvoiceModel;
    this.refModel = record.data as PurchaseInvoiceModel;
    this.selectedRecord.totalPrice = Math.abs(this.selectedRecord.totalPrice);
    this.selectedRecord.totalPriceWithTax = Math.abs(this.selectedRecord.totalPriceWithTax);
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

  btnShowMainFiler_Click(): void {
    if (this.isMainFilterOpened === true) {
      this.isMainFilterOpened = false;
    } else {
      this.isMainFilterOpened = true;
    }
    this.clearMainFiler();
  }

  btnNew_Click(): void {
    this.clearSelectedRecord();
  }

  btnSave_Click(): void {
    this.selectedRecord.insertDate = getInputDataForInsert(this.recordDate);
    if (this.selectedRecord.totalPrice <= 0) {
      this.infoService.error('Tutar sıfırdan büyük olmalıdır.');
    } else if (this.selectedRecord.totalPrice <= 0) {
      this.infoService.error('Tutar (+KDV) sıfırdan büyük olmalıdır.');
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
            transactionType: 'purchaseInvoice',
            parentPrimaryKey: this.selectedRecord.customerCode,
            parentType: 'customer',
            cashDeskPrimaryKey: '-1',
            amount: this.selectedRecord.type === 'purchase' ?
            this.selectedRecord.totalPriceWithTax : this.selectedRecord.totalPriceWithTax * -1,
            amountType: this.selectedRecord.type === 'purchase' ? 'credit' : 'debit',
            insertDate: this.selectedRecord.insertDate
          };
          this.db.collection('tblAccountTransaction').add(trans).then(() => {
            this.infoService.success('Fatura başarıyla kaydedildi.');
            this.selectedRecord = undefined;
          }).catch(err => this.infoService.error(err));
        }).catch(err => this.infoService.error(err));
      } else {
        this.service.updateItem(this.selectedRecord).then(() => {
          this.db.collection<AccountTransactionModel>('tblAccountTransaction',
          ref => ref.where('transactionPrimaryKey', '==', this.selectedRecord.primaryKey)).get().subscribe(list => {
            list.forEach((item) => {
              const trans = {
                receiptNo: this.selectedRecord.receiptNo,
                insertDate: this.selectedRecord.insertDate,
                amount: this.selectedRecord.type === 'purchase' ?
                this.selectedRecord.totalPriceWithTax : this.selectedRecord.totalPriceWithTax * -1,
              };
              this.db.collection('tblAccountTransaction').doc(item.id).update(trans).then(() => {
                this.infoService.success('Fatura başarıyla güncellendi.');
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
              this.infoService.success('Fatura başarıyla kaldırıldı.');
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

  clearSelectedRecord(): void {
    this.refModel = undefined;
    this.isRecordHasTransaction = false;
    this.recordDate = getTodayForInput();
    this.selectedRecord = {primaryKey: undefined, customerCode: '', receiptNo: '', type: '-1',
    description: '', userPrimaryKey: this.authService.getUid()};
  }

  clearMainFiler(): void {
    this.filterBeginDate = getFirstDayOfMonthForInput();
    this.filterFinishDate = getTodayForInput();
    this.filterCustomerCode = '-1';
  }

  btnExportToExcel_Click(): void {
    if (this.mainList.length > 0) {
      this.excelService.exportToExcel(this.mainList, 'purchaseInvoice');
    } else {
      this.infoService.error('Aktarılacak kayıt bulunamadı.');
    }
  }

}
