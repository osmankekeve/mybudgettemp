import {Component, OnInit, OnDestroy, AfterViewInit} from '@angular/core';
import {AngularFirestore, AngularFirestoreCollection} from '@angular/fire/firestore';
import {AccountTransactionService} from '../services/account-transaction.service';
import {InformationService} from '../services/information.service';
import {AuthenticationService} from '../services/authentication.service';
import {NoteModel} from '../models/note-model';
import {NoteService} from '../services/note.service';
import {ExcelService} from '../services/excel-service';
import {CustomerAccountMainModel} from '../models/customer-main-account-model';
import {CustomerAccountService} from '../services/customer-account.service';
import {ActivatedRoute, Router} from '@angular/router';
import {
  currencyFormat,
  getDateForInput,
  getFirstDayOfMonthForInput,
  getFloat,
  getInputDataForInsert,
  getTodayForInput,
  isNullOrEmpty, moneyFormat
} from '../core/correct-library';
import {SettingModel} from '../models/setting-model';
import {CollectionMainModel} from '../models/collection-main-model';
import {PaymentMainModel} from '../models/payment-main-model';
import {Chart} from 'chart.js';
import {AccountTransactionModel} from '../models/account-transaction-model';
import {Observable} from 'rxjs/internal/Observable';
import {CustomerModel} from '../models/customer-model';
import {CustomerService} from '../services/customer.service';

@Component({
  selector: 'app-customer-account',
  templateUrl: './customer-account.component.html',
  styleUrls: ['./customer-account.component.css']
})
export class CustomerAccountComponent implements OnInit {
  mainList: Array<CustomerAccountMainModel>;
  selectedRecord: CustomerAccountMainModel;
  customerList$: Observable<CustomerModel[]>;
  refModel: CustomerAccountMainModel;
  isMainFilterOpened = false;
  openedPanel: any;
  searchText: '';
  onTransaction = false;
  filterCustomerCode: any;

  constructor(public authService: AuthenticationService, public route: Router, public service: CustomerAccountService,
              public atService: AccountTransactionService, public infoService: InformationService, public excelService: ExcelService,
              public db: AngularFirestore, public cService: CustomerService, public router: ActivatedRoute) {
  }

  ngOnInit() {
    this.clearMainFiler();
    this.customerList$ = this.cService.getAllItems();
    this.selectedRecord = undefined;
    this.populateList();
  }

  populateList(): void {
    this.mainList = undefined;
    this.service.getMainItems().subscribe(list => {
      console.log(list);
      if (this.mainList === undefined) {
        this.mainList = [];
      }
      list.forEach((data: any) => {
        const item = data.returnData as CustomerAccountMainModel;
        if (item.actionType === 'added') {
          this.mainList.push(item);
        } else if (item.actionType === 'removed') {
          this.mainList.splice(this.mainList.indexOf(this.refModel), 1);
        } else if (item.actionType === 'modified') {
          this.mainList[this.mainList.indexOf(this.refModel)] = item;
        } else {
          // nothing
        }
      });
    });
    setTimeout(() => {
      if (this.mainList === undefined) {
        this.mainList = [];
      }
    }, 1000);
  }

  showSelectedRecord(record: any): void {
    this.selectedRecord = record as CustomerAccountMainModel;
    this.refModel = record as CustomerAccountMainModel;
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
    this.populateList();
  }

  async btnReturnList_Click(): Promise<void> {
    this.selectedRecord = undefined;
    await this.route.navigate(['customer-account', {}]);
  }

  async btnNew_Click(): Promise<void> {
    this.clearSelectedRecord();
  }

  async btnSave_Click(): Promise<void> {
    if (this.selectedRecord.data.name === '') {
      this.infoService.error('Lütfen hesap adı giriniz.');
    } else if (this.selectedRecord.data.customerPrimaryKey === '-1') {
      this.infoService.error('Lütfen müşteri seçiniz.');
    } else {
      this.onTransaction = true;
      if (this.selectedRecord.data.primaryKey === null) {
        const newId = this.db.createId();
        this.selectedRecord.data.primaryKey = '';
        await this.service.setItem(this.selectedRecord, newId).then(() => {
          this.infoService.success('Hesap başarıyla kaydedildi.');
        }).catch(err => this.infoService.error(err)).finally(() => {
          this.finishRecordProcess();
        });
      } else {
        await this.service.updateItem(this.selectedRecord).then(() => {
          this.infoService.success('Hesap başarıyla güncellendi.');
        }).catch(err => this.infoService.error(err)).finally(() => {
          this.finishRecordProcess();
        });
      }
    }
  }

  async btnRemove_Click(): Promise<void> {
    await this.service.removeItem(this.selectedRecord).then(() => {
      this.infoService.success('Hesap başarıyla kaldırıldı.');
    }).catch(err => this.infoService.error(err)).finally(() => {
      this.finishRecordProcess();
    });
  }

  btnExportToExcel_Click(): void {
    if (this.mainList.length > 0) {
      this.excelService.exportToExcel(this.mainList, 'customer-account');
    } else {
      this.infoService.error('Aktarılacak kayıt bulunamadı.');
    }
  }

  clearSelectedRecord(): void {
    this.refModel = undefined;
    this.selectedRecord = this.service.clearMainModel();
  }

  clearMainFiler(): void {
    this.filterCustomerCode = '-1';
  }

  finishRecordProcess(): void {
    this.clearSelectedRecord();
    this.selectedRecord = undefined;
    this.onTransaction = false;
  }

}
