import { Component, OnInit, OnDestroy } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Chart } from 'chart.js';
import { AccountTransactionModel } from '../models/account-transaction-model';
import { AccountTransactionService } from '../services/account-transaction.service';
import { CustomerRelationService } from '../services/crm.service';
import { CustomerRelationModel } from '../models/customer-relation-model';
import { Router } from '@angular/router';
import { getFloat, getTodayStart, getTodayEnd, getEncriptionKey } from '../core/correct-library';
import { VisitMainModel } from '../models/visit-main-model';
import { VisitService } from '../services/visit.service';
import * as CryptoJS from 'crypto-js';
import { InformationService } from '../services/information.service';
import { PaymentService } from '../services/payment.service';
import { PurchaseInvoiceService } from '../services/purchase-invoice.service';
import { SalesInvoiceService } from '../services/sales-invoice.service';
import { CollectionService } from '../services/collection.service';
import { CashdeskVoucherService } from '../services/cashdesk-voucher.service';
import { AccountVoucherService } from '../services/account-voucher.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  BarChart: any;
  actionList: Array<CustomerRelationModel> = [];
  purchaseInvoiceAmount: any = 0;
  siAmount: any = 0;
  colAmount: any = 0;
  payAmount: any = 0;
  avAmount: any = 0;
  cvAmount: any = 0;
  transactionList: Array<AccountTransactionModel> = [];
  visitList: Array<VisitMainModel> = [];
  encryptSecretKey: string = getEncriptionKey();

  constructor(public db: AngularFirestore, public router: Router, public infoService: InformationService, public vService: VisitService,
              public siService: SalesInvoiceService, public colService: CollectionService,
              public cdService: CashdeskVoucherService, public avService: AccountVoucherService,
              public atService: AccountTransactionService, public crmService: CustomerRelationService,
              public puService: PurchaseInvoiceService, public pService: PaymentService) {  }

  async ngOnInit() {

    this.atService.getOnDayTransactions().subscribe(list => {
      // TODO: kasa fisinin eksili ve artilisi birbirini goturuyor sifir yaziyor, bunu duzelt.
        this.transactionList = list;
        list.forEach(item => {
            if (item.transactionType === 'salesInvoice') {
                this.siAmount += item.amount;
                item.transactionTypeTr = 'Satış Faturası';
            }
            if (item.transactionType === 'collection') {
                this.colAmount += item.amount;
                item.transactionTypeTr = 'Tahsilat';
            }
            if (item.transactionType === 'purchaseInvoice') {
                this.purchaseInvoiceAmount += item.amount;
                item.transactionTypeTr = 'Alım Faturası';
            }
            if (item.transactionType === 'payment') {
                this.payAmount += item.amount;
                item.transactionTypeTr = 'Ödeme';
            }
            if (item.transactionType === 'accountVoucher') {
                this.avAmount += item.amount;
                item.transactionTypeTr = 'Hesap Fişi';
            }
            if (item.transactionType === 'cashDeskVoucher') {
                this.cvAmount += item.amount;
                item.transactionTypeTr = 'Kasa Fişi';
            }
        });
    });

    const date = new Date();
    const todayStart = new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0);
    const endDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);
    let siAmount2 = 0;
    let colAmount2 = 0;
    let purchaseInvoiceAmount2 = 0;
    let payAmount2 = 0;
    let avAmount2 = 0;
    let cvAmount2 = 0;
    this.atService.getOnDayTransactionsBetweenDates(todayStart, endDate).subscribe(list => {
        list.forEach(item => {
            if (item.transactionType === 'salesInvoice') {
                siAmount2 += getFloat(Math.abs(item.amount));
                item.transactionTypeTr = 'Satış Faturası';
            }
            if (item.transactionType === 'collection') {
                colAmount2 += getFloat(Math.abs(item.amount));
                item.transactionTypeTr = 'Tahsilat';
            }
            if (item.transactionType === 'purchaseInvoice') {
                purchaseInvoiceAmount2 += getFloat(Math.abs(item.amount));
                item.transactionTypeTr = 'Alım Faturası';
            }
            if (item.transactionType === 'payment') {
                payAmount2 += getFloat(Math.abs(item.amount));
                item.transactionTypeTr = 'Ödeme';
            }
            if (item.transactionType === 'accountVoucher') {
                avAmount2 += getFloat(Math.abs(item.amount));
                item.transactionTypeTr = 'Hesap Fişi';
            }
            if (item.transactionType === 'cashDeskVoucher') {
                cvAmount2 += getFloat(Math.abs(item.amount));
                item.transactionTypeTr = 'Kasa Fişi';
            }
        });

        this.BarChart = new Chart('barChart', {
          type: 'bar', // bar, pie, doughnut
          data: {
            labels: ['Satış Faturası', 'Tahsilat', 'Alım Faturası', 'Ödeme', 'Hesap Fişi', 'Kasa Fişi'],
            datasets: [{
              label: '# of Votes',
              data: [siAmount2, colAmount2, purchaseInvoiceAmount2, payAmount2, avAmount2, cvAmount2],
              backgroundColor: [
                  'rgba(255, 99, 132, 0.2)',
                  'rgba(54, 162, 235, 0.2)',
                  'rgba(255, 206, 86, 0.2)',
                  'rgba(75, 192, 192, 0.2)',
                  'rgba(153, 102, 255, 0.2)',
                  'rgba(255, 159, 64, 0.2)'
              ],
              borderColor: [
                  'rgba(255,99,132,1)',
                  'rgba(54, 162, 235, 1)',
                  'rgba(255, 206, 86, 1)',
                  'rgba(75, 192, 192, 1)',
                  'rgba(153, 102, 255, 1)',
                  'rgba(255, 159, 64, 1)'
              ],
              borderWidth: 1
            }]
          },
          options: {
            title: {
                text: 'Aylık Cari Hareketler',
                display: true
            },
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: true
                    }
                }]
            }
          }
      });
    });

    this.populateActivityList();
    this.populateVisitList();
  }

  ngOnDestroy(): void {
  }

  showMonthyPaymentsOnChart(): void {
    const date = new Date();
    const jenStartDate = new Date(date.getFullYear(), 1, 1);
    const jenEndDate = new Date(date.getFullYear(), 2, 0);

  }

  populateActivityList(): void {
    this.crmService.getMainItemsBetweenDates(getTodayStart(), getTodayEnd()).subscribe(list => {
      list.forEach((item: any) => {
        if (item.actionType === 'added') {
          this.actionList.push(item);
        } else if (item.actionType === 'removed') {
          this.actionList.splice(this.actionList.indexOf(item), 1);
        } else if (item.actionType === 'modified') {
          this.actionList[this.actionList.indexOf(item)] = item.data;
        } else {
          // nothing
        }
      });
    });
  }

  populateVisitList(): void {
    this.vService.getMainItemsBetweenDates(getTodayStart(), getTodayEnd()).subscribe(list => {
      list.forEach((data: any) => {
        const item = data.returnData as VisitMainModel;
        if (item.actionType === 'added') {
          this.visitList.push(item);
        } else if (item.actionType === 'removed') {
          this.visitList.splice(this.visitList.indexOf(item), 1);
        } else if (item.actionType === 'modified') {
          this.visitList[this.visitList.indexOf(item)] = item;
        } else {
          // nothing
        }
      });
    });
  }

  showAction(item: any): void {
    this.router.navigate(['crm', { paramItem: CryptoJS.AES.encrypt(JSON.stringify(item), this.encryptSecretKey).toString() }]);
  }

  showVisit(item: any): void {
    this.router.navigate(['visit', { paramItem: CryptoJS.AES.encrypt(JSON.stringify(item), this.encryptSecretKey).toString() }]);
  }

  async showTransaction(item: any): Promise<void> {
    let data;
    if (item.transactionType === 'salesInvoice') {

      data = await this.siService.getItem(item.transactionPrimaryKey);
      if (data) {
        this.router.navigate(['sales-invoice', { paramItem: CryptoJS.AES.encrypt(JSON.stringify(data),
          this.encryptSecretKey).toString() }]);
      }

    } else if  (item.transactionType === 'collection') {

      data = await this.colService.getItem(item.transactionPrimaryKey);
      if (data) {
        this.router.navigate(['collection', { paramItem: CryptoJS.AES.encrypt(JSON.stringify(data),
          this.encryptSecretKey).toString() }]);
        }

    } else if  (item.transactionType === 'purchaseInvoice') {

      data = await this.puService.getItem(item.transactionPrimaryKey);
      if (data) {
        this.router.navigate(['purchaseInvoice', { paramItem: CryptoJS.AES.encrypt(JSON.stringify(data),
          this.encryptSecretKey).toString() }]);
      }

    } else if  (item.transactionType === 'payment') {

      data = await this.pService.getItem(item.transactionPrimaryKey);
      if (data) {
        this.router.navigate(['payment', { paramItem: CryptoJS.AES.encrypt(JSON.stringify(data),
          this.encryptSecretKey).toString() }]);
      }

    } else if  (item.transactionType === 'accountVoucher') {

      data = await this.avService.getItem(item.transactionPrimaryKey);
      if (data) {
        this.router.navigate(['account-voucher', { paramItem: CryptoJS.AES.encrypt(JSON.stringify(data),
          this.encryptSecretKey).toString() }]);
      }

    } else if  (item.transactionType === 'cashdeskVoucher') {

      data = await this.cdService.getItem(item.transactionPrimaryKey);
      if (data) {
        this.router.navigate(['cashdesk-voucher', { paramItem: CryptoJS.AES.encrypt(JSON.stringify(data),
          this.encryptSecretKey).toString() }]);
      }

    } else {

      this.infoService.error('Modül bulunamadı.');

    }
  }
}
