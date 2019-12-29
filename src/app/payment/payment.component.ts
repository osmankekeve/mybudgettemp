import { Component, OnInit, OnDestroy } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { Observable } from 'rxjs/internal/Observable';
import { PaymentModel } from '../models/payment-model';
import { PaymentService } from '../services/payment.service';
import { CashDeskModel } from '../models/cash-desk-model';
import { CashDeskService } from '../services/cash-desk.service';
import { CustomerModel } from '../models/customer-model';
import { CustomerService } from '../services/customer.service';
import { AuthenticationService } from '../services/authentication.service';
import { AccountTransactionService } from '../services/account-transaction.service';
import { AccountTransactionModel } from '../models/account-transaction-model';
import { InformationService } from '../services/information.service';
import { getDateForInput, getInputDataForInsert, getTodayForInput, getFirstDayOfMonthForInput, isNullOrEmpty, getEncriptionKey
} from '../core/correct-library';
import { ExcelService } from '../services/excel-service';
import * as CryptoJS from 'crypto-js';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-payment',
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.css']
})
export class PaymentComponent implements OnInit, OnDestroy {
  mainList: Array<PaymentModel>;
  cashDeskList$: Observable<CashDeskModel[]>;
  customerList$: Observable<CustomerModel[]>;
  collection: AngularFirestoreCollection<PaymentModel>;
  selectedRecord: PaymentModel;
  refModel: PaymentModel;
  isRecordHasTransaction = false;
  isMainFilterOpened = false;
  recordDate: any;
  encryptSecretKey: string = getEncriptionKey();

  date = new Date();
  filterBeginDate: any;
  filterFinishDate: any;
  filterCustomerCode: any;
  totalValues = {
    amount: 0
  };

  constructor(public authService: AuthenticationService, public route: Router, public router: ActivatedRoute,
              public service: PaymentService,
              public cdService: CashDeskService,
              public cService: CustomerService,
              public db: AngularFirestore,
              public excelService: ExcelService,
              public infoService: InformationService,
              public atService: AccountTransactionService) { }

  ngOnInit() {
    this.clearMainFiler();
    this.populateList();
    this.selectedRecord = undefined;
    this.customerList$ = this.cService.getAllItems();
    this.cashDeskList$ = this.cdService.getAllItems();

    if (this.router.snapshot.paramMap.get('paramItem') !== null) {
      const bytes = CryptoJS.AES.decrypt(this.router.snapshot.paramMap.get('paramItem'), this.encryptSecretKey);
      const paramItem = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
      if (paramItem) {
        this.showSelectedRecord(paramItem);
      }
    }
  }

  ngOnDestroy(): void { }

  populateList(): void {
    this.mainList = [];
    this.totalValues = {
      amount: 0
    };
    const beginDate = new Date(this.filterBeginDate.year, this.filterBeginDate.month - 1, this.filterBeginDate.day, 0, 0, 0);
    const finishDate = new Date(this.filterFinishDate.year, this.filterFinishDate.month - 1, this.filterFinishDate.day + 1, 0, 0, 0);
    this.service.getMainItemsBetweenDatesWithCustomer(beginDate, finishDate, this.filterCustomerCode).subscribe(list => {
      list.forEach((item: any) => {
        if (item.actionType === 'added') {
          this.mainList.push(item);
          this.totalValues.amount += item.data.amount;
        } else if (item.actionType === 'removed') {
          this.mainList.splice(this.mainList.indexOf(this.refModel), 1);
          this.totalValues.amount -= item.data.amount;
        } else if (item.actionType === 'modified') {
          this.mainList[this.mainList.indexOf(this.refModel)] = item.data;
          this.totalValues.amount -= this.refModel.amount;
          this.totalValues.amount += item.data.amount;
        } else {
          // nothing
        }
      });
    });
  }

  showSelectedRecord(record: any): void {
    this.selectedRecord = record.data as PaymentModel;
    this.refModel = record.data as PaymentModel;
    this.recordDate = getDateForInput(this.selectedRecord.insertDate);
    console.log(this.selectedRecord);
    this.atService.getRecordTransactionItems(this.selectedRecord.primaryKey)
    .subscribe(list => {
      if (list.length > 0) {
        this.isRecordHasTransaction = true;

      } else {
        this.isRecordHasTransaction = false;
      }
    });
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

  btnReturnList_Click(): void {
    this.selectedRecord = undefined;
    this.route.navigate(['payment', {}]);
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
            transactionType: 'payment',
            parentPrimaryKey: this.selectedRecord.customerCode,
            parentType: 'customer',
            cashDeskPrimaryKey: this.selectedRecord.cashDeskPrimaryKey,
            amount: this.selectedRecord.amount * -1,
            amountType: 'debit',
            insertDate: this.selectedRecord.insertDate,
          };
          this.db.collection('tblAccountTransaction').add(trans).then(() => {
            this.infoService.success('Ödeme başarıyla kaydedildi.');
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
                cashDeskPrimaryKey: this.selectedRecord.cashDeskPrimaryKey,
                amount: this.selectedRecord.amount * -1,
              };
              this.db.collection('tblAccountTransaction').doc(item.id).update(trans).then(() => {
                this.infoService.success('Ödeme başarıyla güncellendi.');
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
              this.infoService.success('Ödeme başarıyla kaldırıldı.');
              this.selectedRecord = undefined;
            }).catch(err => this.infoService.error(err));
          });
        });
    }).catch(err => this.infoService.error(err));
  }

  btnExportToExcel_Click(): void {
    if (this.mainList.length > 0) {
      this.excelService.exportToExcel(this.mainList, 'payment');
    } else {
      this.infoService.error('Aktarılacak kayıt bulunamadı.');
    }
  }

  clearSelectedRecord(): void {
    this.refModel = undefined;
    this.isRecordHasTransaction = false;
    this.recordDate = getTodayForInput();
    this.selectedRecord = {primaryKey: undefined, customerCode: '', cashDeskPrimaryKey: '', receiptNo: '',
    type: '', description: '', userPrimaryKey: this.authService.getUid()};
  }

  clearMainFiler(): void {
    this.filterBeginDate = getFirstDayOfMonthForInput();
    this.filterFinishDate = getTodayForInput();
    this.filterCustomerCode = '-1';
  }

}
