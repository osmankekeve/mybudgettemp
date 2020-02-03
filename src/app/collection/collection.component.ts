import { Component, OnInit, OnDestroy } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Observable } from 'rxjs/internal/Observable';
import { CollectionService } from '../services/collection.service';
import { CustomerModel } from '../models/customer-model';
import { CustomerService } from '../services/customer.service';
import { AccountTransactionModel } from '../models/account-transaction-model';
import { AccountTransactionService } from '../services/account-transaction.service';
import { AuthenticationService } from '../services/authentication.service';
import { CashDeskService } from '../services/cash-desk.service';
import { InformationService } from '../services/information.service';
import { getFirstDayOfMonthForInput, getTodayForInput, isNullOrEmpty, getDateForInput, getInputDataForInsert, getEncryptionKey
} from '../core/correct-library';
import { ExcelService } from '../services/excel-service';
import * as CryptoJS from 'crypto-js';
import { Router, ActivatedRoute } from '@angular/router';
import { SettingService } from '../services/setting.service';
import {CollectionMainModel} from '../models/collection-main-model';
import {CashDeskMainModel} from '../models/cash-desk-main-model';

@Component({
  selector: 'app-collection',
  templateUrl: './collection.component.html',
  styleUrls: ['./collection.component.css']
})
export class CollectionComponent implements OnInit, OnDestroy {
  mainList: Array<CollectionMainModel>;
  customerList$: Observable<CustomerModel[]>;
  cashDeskList$: Observable<CashDeskMainModel[]>;
  selectedRecord: CollectionMainModel;
  refModel: CollectionMainModel;
  isRecordHasTransaction = false;
  isMainFilterOpened = false;
  recordDate: any;
  encryptSecretKey: string = getEncryptionKey();
  searchText: '';

  date = new Date();
  filterBeginDate: any;
  filterFinishDate: any;
  filterCustomerCode: any;
  totalValues = {
    amount: 0
  };

  constructor(public authService: AuthenticationService, public route: Router, public router: ActivatedRoute,
              public service: CollectionService, public cdService: CashDeskService, public atService: AccountTransactionService,
              public infoService: InformationService, public excelService: ExcelService, public cService: CustomerService,
              public db: AngularFirestore, public sService: SettingService) { }

  ngOnInit() {
    this.clearMainFiler();
    this.populateList();
    this.customerList$ = this.cService.getAllItems();
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

  ngOnDestroy(): void { }

  populateList(): void {
    this.mainList = undefined;
    this.totalValues = {
      amount: 0
    };
    const beginDate = new Date(this.filterBeginDate.year, this.filterBeginDate.month - 1, this.filterBeginDate.day, 0, 0, 0);
    const finishDate = new Date(this.filterFinishDate.year, this.filterFinishDate.month - 1, this.filterFinishDate.day + 1, 0, 0, 0);
    this.service.getMainItemsBetweenDatesWithCustomer(beginDate, finishDate, this.filterCustomerCode).subscribe(list => {
      if (this.mainList === undefined) this.mainList = [];
      list.forEach((data: any) => {
        const item = data.returnData as CollectionMainModel;
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
    this.selectedRecord = record as CollectionMainModel;
    this.refModel = record as CollectionMainModel;
    this.recordDate = getDateForInput(this.selectedRecord.data.insertDate);
    this.atService.getRecordTransactionItems(this.selectedRecord.data.primaryKey)
    .subscribe(list => {
      if (list.length > 0) {
        this.isRecordHasTransaction = true;

      } else {
        this.isRecordHasTransaction = false;
      }
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

  btnReturnList_Click(): void {
    this.selectedRecord = undefined;
    this.route.navigate(['collection', {}]);
  }

  async btnNew_Click(): Promise<void> {
    this.clearSelectedRecord();
    const receiptNoData = await this.sService.getCollectionCode();
    if (receiptNoData !== null) {
      this.selectedRecord.data.receiptNo = receiptNoData;
    }
  }

  btnSave_Click(): void {
    this.selectedRecord.data.insertDate = getInputDataForInsert(this.recordDate);
    if (this.selectedRecord.data.amount <= 0) {
      this.infoService.error('Tutar sıfırdan büyük olmalıdır.');
    } else if (isNullOrEmpty(this.recordDate)) {
      this.infoService.error('Lütfen kayıt tarihi seçiniz.');
    } else {
      if (this.selectedRecord.data.primaryKey === null) {
        const newId = this.db.createId();
        this.selectedRecord.data.primaryKey = '';

        this.service.setItem(this.selectedRecord, newId).then(() => {
          const trans = {
            primaryKey: '',
            userPrimaryKey: this.selectedRecord.data.userPrimaryKey,
            receiptNo: this.selectedRecord.data.receiptNo,
            transactionPrimaryKey: newId,
            transactionType: 'collection',
            parentPrimaryKey: this.selectedRecord.data.customerCode,
            parentType: 'customer',
            cashDeskPrimaryKey: this.selectedRecord.data.cashDeskPrimaryKey,
            amount: this.selectedRecord.data.amount,
            amountType: 'credit',
            insertDate: this.selectedRecord.data.insertDate
          };
          this.db.collection('tblAccountTransaction').add(trans).then(() => {
            this.infoService.success('Tahsilat başarıyla kaydedildi.');
            this.selectedRecord = undefined;
          }).catch(err => this.infoService.error(err));
        }).catch(err => this.infoService.error(err));

      } else {
        this.service.updateItem(this.selectedRecord).then(() => {
          this.db.collection<AccountTransactionModel>('tblAccountTransaction',
          ref => ref.where('transactionPrimaryKey', '==', this.selectedRecord.data.primaryKey)).get().subscribe(list => {
            list.forEach((item) => {
              const trans = {
                receiptNo: this.selectedRecord.data.receiptNo,
                insertDate: this.selectedRecord.data.insertDate,
                cashDeskPrimaryKey: this.selectedRecord.data.cashDeskPrimaryKey,
                amount: this.selectedRecord.data.amount
              };
              this.db.collection('tblAccountTransaction').doc(item.id).update(trans).then(() => {
                this.infoService.success('Tahsilat başarıyla kaydedildi.');
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
        ref => ref.where('transactionPrimaryKey', '==', this.selectedRecord.data.primaryKey)).get().subscribe(list => {
          list.forEach((item) => {
            this.db.collection('tblAccountTransaction').doc(item.id).delete().then(() => {
              this.infoService.success('Tahsilat başarıyla kaldırıldı.');
              this.selectedRecord = undefined;
            }).catch(err => this.infoService.error(err));
          });
        });
    }).catch(err => this.infoService.error(err));
  }

  btnExportToExcel_Click(): void {
    if (this.mainList.length > 0) {
      this.excelService.exportToExcel(this.mainList, 'collection');
    } else {
      this.infoService.error('Aktarılacak kayıt bulunamadı.');
    }
  }

  btnExportToXml_Click(): void {

  }

  clearSelectedRecord(): void {
    this.refModel = undefined;
    this.isRecordHasTransaction = false;
    this.recordDate = getTodayForInput();
    this.selectedRecord = this.service.clearMainModel();
    console.log(this.selectedRecord);
  }

  clearMainFiler(): void {
    this.filterBeginDate = getFirstDayOfMonthForInput();
    this.filterFinishDate = getTodayForInput();
    this.filterCustomerCode = '-1';
  }

}
