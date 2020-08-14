import {Component, OnInit} from '@angular/core';
import {AngularFirestore} from '@angular/fire/firestore';
import {InformationService} from '../services/information.service';
import {AuthenticationService} from '../services/authentication.service';
import {Router, ActivatedRoute} from '@angular/router';
import {GlobalService} from '../services/global.service';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {CustomerAccountMainModel} from '../models/customer-main-account-model';
import {CustomerAccountService} from '../services/customer-account.service';
import {AccountTransactionMainModel} from '../models/account-transaction-main-model';
import {getFloat} from '../core/correct-library';
import {Chart} from 'chart.js';
import {AccountTransactionService} from '../services/account-transaction.service';
import {AccountTransactionModel} from '../models/account-transaction-model';
import {AccountMatchService} from '../services/account-match.service';

@Component({
  selector: 'app-account-match',
  templateUrl: './account-match.component.html',
  styleUrls: ['./account-match.component.css']
})
export class AccountMatchComponent implements OnInit {
  mainList: Array<CustomerAccountMainModel>;
  debitTransactionList: Array<AccountTransactionMainModel>;
  creditTransactionList: Array<AccountTransactionMainModel>;

  selectedRecord: CustomerAccountMainModel;
  date = new Date();
  searchText: '';
  onTransaction = false;
  isMatchPanelOpened = false;
  debitSelectedRecordPrimaryKey: string;
  creditSelectedRecordPrimaryKey: string;
  public xmlItems: any;

  constructor(public authService: AuthenticationService, public service: CustomerAccountService, public infoService: InformationService,
              public route: Router, public router: ActivatedRoute, public db: AngularFirestore, private http: HttpClient,
              public atService: AccountTransactionService, public amService: AccountMatchService) {
  }

  ngOnInit() {
    this.selectedRecord = undefined;
    this.populateList();

    // region Kur
    // this.loadXML();
    /*this.http.get('https://www.tcmb.gov.tr/kurlar/today.xml',
      {
        headers: new HttpHeaders()
          .set('Content-Type', 'text/xml')
          .append('Access-Control-Allow-Methods', 'GET')
          .append('Access-Control-Allow-Origin', 'https://www.tcmb.gov.tr')
          .append('Access-Control-Allow-Headers',
            'Access-Control-Allow-Headers, Access-Control-Allow-Origin, Access-Control-Request-Method'),
        responseType: 'text'
      })
      .subscribe(res => console.log(res));*/
    // endregion

  }

  populateList(): void {
    this.mainList = undefined;
    this.service.getMainItems().subscribe(list => {
      if (this.mainList === undefined) {
        this.mainList = [];
      }
      list.forEach((data: any) => {
        const item = data.returnData as CustomerAccountMainModel;
        if (item.actionType === 'added') {
          this.mainList.push(item);
        }
        if (item.actionType === 'removed') {
          for (let i = 0; i < this.mainList.length; i++) {
            if (item.data.primaryKey === this.mainList[i].data.primaryKey) {
              this.mainList.splice(i, 1);
              break;
            }
          }
        }
        if (item.actionType === 'modified') {
          for (let i = 0; i < this.mainList.length; i++) {
            if (item.data.primaryKey === this.mainList[i].data.primaryKey) {
              this.mainList[i] = item;
              break;
            }
          }
        }
      });
    });
    setTimeout(() => {
      if (this.mainList === undefined) {
        this.mainList = [];
      }
    }, 1000);
  }

  populateDebitTransactions(): void {
    // borc
    const list = Array<string>();
    list.push('salesInvoice');
    list.push('purchaseInvoice');
    list.push('payment');
    list.push('accountVoucher');
    this.debitTransactionList = undefined;
    Promise.all([this.atService.getAccountTransactionsByAmountType(this.selectedRecord.data.primaryKey, 'debit', list)])
      .then((values: any) => {
        if (values[0] !== undefined || values[0] !== null) {
          const returnData = values[0] as Array<AccountTransactionMainModel>;
          this.debitTransactionList = [];
          returnData.forEach((item: any) => {
            this.debitTransactionList.push(item);
          });
        }
      });
  }

  populateCreditTransactions(): void {
    // borc
    const list = Array<string>();
    list.push('salesInvoice');
    list.push('purchaseInvoice');
    list.push('collection');
    list.push('accountVoucher');
    this.creditTransactionList = undefined;
    Promise.all([this.atService.getAccountTransactionsByAmountType(this.selectedRecord.data.primaryKey, 'credit', list)])
      .then((values: any) => {
        if (values[0] !== undefined || values[0] !== null) {
          const returnData = values[0] as Array<AccountTransactionMainModel>;
          this.creditTransactionList = [];
          returnData.forEach((item: any) => {
            this.creditTransactionList.push(item);
          });
        }
      });
  }

  showSelectedRecord(record: any): void {
    this.selectedRecord = record as CustomerAccountMainModel;

    this.creditSelectedRecordPrimaryKey = '';
    this.debitSelectedRecordPrimaryKey = '';
    this.populateDebitTransactions();
    this.populateCreditTransactions();
  }

  selectDebitRecord(record: any): void {
    const selectedData = record as AccountTransactionMainModel;
    if (selectedData.data.primaryKey === this.debitSelectedRecordPrimaryKey) {
      this.debitSelectedRecordPrimaryKey = '';
    } else {
      this.debitSelectedRecordPrimaryKey = selectedData.data.primaryKey.toString();
    }
  }

  selectCreditRecord(record: any): void {
    const selectedData = record as AccountTransactionMainModel;
    if (selectedData.data.primaryKey === this.creditSelectedRecordPrimaryKey) {
      this.creditSelectedRecordPrimaryKey = '';
    } else {
      this.creditSelectedRecordPrimaryKey = selectedData.data.primaryKey.toString();
    }
  }

  async btnReturnList_Click(): Promise<void> {
    try {
      this.isMatchPanelOpened = false;
    } catch (error) {
      await this.finishProcess(error, null);
    }
  }

  async btnExportToExcel_Click(): Promise<void> {
    try {
      this.onTransaction = true;
      await this.infoService.error('Yazılmadı.');
      await this.finishProcess(null, null);
    } catch (error) {
      await this.finishProcess(error, null);
    }
  }

  async btnAutoMatchAccount_Click(): Promise<void> {
    try {
      this.onTransaction = true;
      this.isMatchPanelOpened = true;
    } catch (error) {
      await this.finishProcess(error, null);
    }
  }

  async btnManuelMatchAccount_Click(): Promise<void> {
    try {
      this.onTransaction = true;
      this.isMatchPanelOpened = true;
    } catch (error) {
      await this.finishProcess(error, null);
    }
  }

  async btnAccountMatch_Click(): Promise<void> {
    try {
      this.onTransaction = true;

      const debitRecord =  await this.service.getItem(this.debitSelectedRecordPrimaryKey);
      const creditRecord = await this.service.getItem(this.creditSelectedRecordPrimaryKey);

      const debit = debitRecord.returnData as AccountTransactionMainModel;
      const credit = creditRecord.returnData as AccountTransactionMainModel;

      const creditRemainingAmount = Math.abs(credit.data.amount) - Math.abs(credit.data.paidAmount);
      if (creditRemainingAmount > 0) {
        // kapama yapilacak miktar mevcut

        const debitRemainingAmount = Math.abs(debit.data.amount) - Math.abs(debit.data.paidAmount);
        if (debitRemainingAmount > 0) {

          if (debitRemainingAmount > creditRemainingAmount) {
            // eger odeme yapilacak miktar, faturanin kapatilmasi miktarindan buyuk ise fatura sifirlanir,
            // odeme, faturanin kalan miktari kadar kapatilir
            const batch = this.db.firestore.batch();

            const debitRef = this.db.firestore.collection(this.atService.tableName).doc(this.debitSelectedRecordPrimaryKey);
            batch.update(debitRef, {paidAmount: debit.data.paidAmount + creditRemainingAmount});

            const creditRef = this.db.firestore.collection(this.atService.tableName).doc(this.creditSelectedRecordPrimaryKey);
            batch.update(creditRef, {paidAmount: credit.data.amount});

            const matchData = this.amService.clearSubModel();
            matchData.primaryKey = this.db.createId();
            matchData.debitPrimaryKey = debit.data.primaryKey;
            matchData.debitType = debit.data.transactionType;
            matchData.debitParentPrimaryKey = debit.data.transactionPrimaryKey;
            matchData.creditPrimaryKey = credit.data.primaryKey;
            matchData.creditType = credit.data.transactionType;
            matchData.creditParentPrimaryKey = credit.data.transactionPrimaryKey;
            matchData.amount = creditRemainingAmount;
            matchData.insertDate = Date.now();

            const matchRef = this.db.firestore.collection(this.amService.tableName).doc(matchData.primaryKey);
            batch.set(matchRef, Object.assign({}, matchData));

            await batch.commit();
            await this.finishProcess(null, 'Hesap kapama başarılı.');

          } else {
            // eger odeme yapilacak miktar, faturanin kapatilmasi miktarindan kucuk ise odeme sifirlanir,
            // faturada odeme yapilacak miktar kadar kapatilir

            // region Account Match
            const batch = this.db.firestore.batch();

            const debitRef = this.db.firestore.collection(this.atService.tableName).doc(this.debitSelectedRecordPrimaryKey);
            batch.update(debitRef, {paidAmount: debit.data.amount});

            const creditRef = this.db.firestore.collection(this.atService.tableName).doc(this.creditSelectedRecordPrimaryKey);
            batch.update(creditRef, {paidAmount: credit.data.paidAmount + debitRemainingAmount});

            const matchData = this.amService.clearSubModel();
            matchData.primaryKey = this.db.createId();
            matchData.debitPrimaryKey = debit.data.primaryKey;
            matchData.debitType = debit.data.transactionType;
            matchData.debitParentPrimaryKey = debit.data.transactionPrimaryKey;
            matchData.creditPrimaryKey = credit.data.primaryKey;
            matchData.creditType = credit.data.transactionType;
            matchData.creditParentPrimaryKey = credit.data.transactionPrimaryKey;
            matchData.amount = debitRemainingAmount;
            matchData.insertDate = Date.now();

            const matchRef = this.db.firestore.collection(this.amService.tableName).doc(matchData.primaryKey);
            batch.set(matchRef, Object.assign({}, matchData));
            await batch.commit();
            await this.finishProcess(null, 'Hesap kapama başarılı.');
            // endregion
          }
        } else {
          // kapatılacak yapilacak miktar yok
          await this.finishProcess(Error('debitRemainingAmount > 0'), null);
        }
      } else {
        // kapama yapilacak miktar yok
        await this.finishProcess(Error('creditRemainingAmount > 0'), null);
      }
    } catch (error) {
      await this.finishProcess(error, null);
    }
  }

  async finishProcess(error: any, info: any): Promise<void> {
    // error.message sistem hatası
    // error kontrol hatası
    if (error === null) {
      if (info !== null) {
        await this.infoService.success(info);
        this.populateDebitTransactions();
        this.populateCreditTransactions();
      }
    } else {
      await this.infoService.error(error.message !== undefined ? error.message : error);
    }
    this.onTransaction = false;
  }

  clearSelectedRecord(): void {
    this.selectedRecord = this.service.clearMainModel();
  }

  loadXML() {
    this.http.get('https://www.tcmb.gov.tr/kurlar/today.xml',
      {
        headers: new HttpHeaders()
          .set('Content-Type', 'text/xml')
          .append('Access-Control-Allow-Methods', 'GET')
          .append('Access-Control-Allow-Origin', '*')
          .append('Access-Control-Allow-Headers',
            'Access-Control-Allow-Headers, Access-Control-Allow-Origin, Access-Control-Request-Method'),
        responseType: 'text'
      })
      .subscribe((data) => {
        console.table(data);
        /*this.parseXML(data)
          .then((data2) => {
            this.xmlItems = data2;
          });*/
      });
  }
}
