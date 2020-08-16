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
  debitAccountMatchType = 'open';
  creditAccountMatchType = 'open';
  accountSummary = {
    piAmount: 0,
    piPaidAmount: 0,
    piRemainingAmount: 0,
    payAmount: 0,
    payPaidAmount: 0,
    payRemainingAmount: 0,
    siAmount: 0,
    siPaidAmount: 0,
    siRemainingAmount: 0,
    colAmount: 0,
    colPaidAmount: 0,
    colRemainingAmount: 0,
    avAmount: 0,
    avPaidAmount: 0,
    avRemainingAmount: 0
  };
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
            if (this.debitAccountMatchType === 'open') {
              if (item.remainingAmount > 0) {
                this.debitTransactionList.push(item);
              }
            } else if (this.debitAccountMatchType === 'close') {
              if (item.remainingAmount === 0) {
                this.debitTransactionList.push(item);
              }
            } else {
              this.debitTransactionList.push(item);
            }
            if (item.data.transactionType === 'salesInvoice') {
              this.accountSummary.siAmount += Math.abs(item.data.amount);
              this.accountSummary.siPaidAmount += Math.abs(item.data.paidAmount);
              this.accountSummary.siRemainingAmount += Math.abs(item.data.amount) - Math.abs(item.data.paidAmount);
            }
            if (item.data.transactionType === 'collection') {
              this.accountSummary.colAmount += Math.abs(item.data.amount);
              this.accountSummary.colPaidAmount += Math.abs(item.data.paidAmount);
              this.accountSummary.colRemainingAmount += Math.abs(item.data.amount) - Math.abs(item.data.paidAmount);
            }
            if (item.data.transactionType === 'purchaseInvoice') {
              this.accountSummary.piAmount += Math.abs(item.data.amount);
              this.accountSummary.piPaidAmount += Math.abs(item.data.paidAmount);
              this.accountSummary.piRemainingAmount += Math.abs(item.data.amount) - Math.abs(item.data.paidAmount);
            }
            if (item.data.transactionType === 'payment') {
              this.accountSummary.payAmount += Math.abs(item.data.amount);
              this.accountSummary.payPaidAmount += Math.abs(item.data.paidAmount);
              this.accountSummary.payRemainingAmount += Math.abs(item.data.amount) - Math.abs(item.data.paidAmount);
            }
            if (item.data.transactionType === 'accountVoucher') {
              this.accountSummary.avAmount += Math.abs(item.data.amount);
              this.accountSummary.avPaidAmount += Math.abs(item.data.paidAmount);
              this.accountSummary.avRemainingAmount += Math.abs(item.data.amount) - Math.abs(item.data.paidAmount);
            }
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
            if (this.creditAccountMatchType === 'open') {
              if (item.remainingAmount > 0) {
                this.creditTransactionList.push(item);
              }
            } else if (this.creditAccountMatchType === 'close') {
              if (item.remainingAmount === 0) {
                this.creditTransactionList.push(item);
              }
            } else {
              this.creditTransactionList.push(item);
            }
            if (item.data.transactionType === 'salesInvoice') {
              this.accountSummary.siAmount += Math.abs(item.data.amount);
              this.accountSummary.siPaidAmount += Math.abs(item.data.paidAmount);
              this.accountSummary.siRemainingAmount += Math.abs(item.data.amount) - Math.abs(item.data.paidAmount);
            }
            if (item.data.transactionType === 'collection') {
              this.accountSummary.colAmount += Math.abs(item.data.amount);
              this.accountSummary.colPaidAmount += Math.abs(item.data.paidAmount);
              this.accountSummary.colRemainingAmount += Math.abs(item.data.amount) - Math.abs(item.data.paidAmount);
            }
            if (item.data.transactionType === 'purchaseInvoice') {
              this.accountSummary.piAmount += Math.abs(item.data.amount);
              this.accountSummary.piPaidAmount += Math.abs(item.data.paidAmount);
              this.accountSummary.piRemainingAmount += Math.abs(item.data.amount) - Math.abs(item.data.paidAmount);
            }
            if (item.data.transactionType === 'payment') {
              this.accountSummary.payAmount += Math.abs(item.data.amount);
              this.accountSummary.payPaidAmount += Math.abs(item.data.paidAmount);
              this.accountSummary.payRemainingAmount += Math.abs(item.data.amount) - Math.abs(item.data.paidAmount);
            }
            if (item.data.transactionType === 'accountVoucher') {
              this.accountSummary.avAmount += Math.abs(item.data.amount);
              this.accountSummary.avPaidAmount += Math.abs(item.data.paidAmount);
              this.accountSummary.avRemainingAmount += Math.abs(item.data.amount) - Math.abs(item.data.paidAmount);
            }
          });
        }
      });
  }

  showSelectedRecord(record: any): void {
    this.selectedRecord = record as CustomerAccountMainModel;

    this.creditSelectedRecordPrimaryKey = '';
    this.debitSelectedRecordPrimaryKey = '';
    this.debitAccountMatchType = 'open';
    this.creditAccountMatchType = 'open';
    this.clearAccountSummary();
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
      this.debitAccountMatchType = 'open';
      this.creditAccountMatchType = 'open';
      this.clearAccountSummary();
      this.populateDebitTransactions();
      this.populateCreditTransactions();
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
      this.isMatchPanelOpened = true;
    } catch (error) {
      await this.finishProcess(error, null);
    }
  }

  async btnAccountMatch_Click(): Promise<void> {
    try {
      if (this.debitSelectedRecordPrimaryKey === '') {
        await this.infoService.error('Lütfen borç kaydı seçiniz');
      } else if (this.creditSelectedRecordPrimaryKey === '') {
        await this.infoService.error('Lütfen alacak kaydı seçiniz');
      } else {
        this.onTransaction = true;

        const debitRecord =  await this.atService.getItem(this.debitSelectedRecordPrimaryKey);
        const creditRecord = await this.atService.getItem(this.creditSelectedRecordPrimaryKey);

        const debit = debitRecord as AccountTransactionMainModel;
        const credit = creditRecord as AccountTransactionMainModel;

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
              this.creditSelectedRecordPrimaryKey = '';
              this.debitSelectedRecordPrimaryKey = '';
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
            await this.finishProcess(Error('Kapama yapmak için yeterli miktar bulunmamaktadır'), null);
          }
        } else {
          // kapama yapilacak miktar yok
          await this.finishProcess(Error('Kapatılacak miktar bulunmamaktadır'), null);
        }
      }
    } catch (error) {
      await this.finishProcess(error, null);
    }
  }

  async btnShowDebitRecords_Click(param: string): Promise<void> {
    try {
      this.debitAccountMatchType = param;
      this.populateDebitTransactions();
    } catch (error) {
      await this.finishProcess(error, null);
    }
  }

  async btnShowCreditRecords_Click(param: string): Promise<void> {
    try {
      this.creditAccountMatchType = param;
      this.populateCreditTransactions();
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

  clearAccountSummary(): void {
    this.accountSummary = {
      piAmount: 0,
      piPaidAmount: 0,
      piRemainingAmount: 0,
      payAmount: 0,
      payPaidAmount: 0,
      payRemainingAmount: 0,
      siAmount: 0,
      siPaidAmount: 0,
      siRemainingAmount: 0,
      colAmount: 0,
      colPaidAmount: 0,
      colRemainingAmount: 0,
      avAmount: 0,
      avPaidAmount: 0,
      avRemainingAmount: 0,
    };
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
