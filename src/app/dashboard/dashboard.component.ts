import { Component, OnInit, OnDestroy } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Chart } from 'chart.js';
import { Observable } from 'rxjs';
import { AccountTransactionModel } from '../models/account-transaction-model';
import { AccountTransactionService } from '../services/account-transaction-service';
import { CustomerRelationService } from '../services/crm.service';
import { CustomerRelationModel } from '../models/customer-relation-model';
import { Router } from '@angular/router';
import { getFloat } from '../core/correct-library';

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

  constructor(public db: AngularFirestore, public router: Router,
              public atService: AccountTransactionService, public crmService: CustomerRelationService) {  }

  async ngOnInit() {

    this.atService.getOnDayTransactions().subscribe(list => {
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
  }

  ngOnDestroy(): void {
  }

  showMonthyPaymentsOnChart(): void {
    const date = new Date();
    const jenStartDate = new Date(date.getFullYear(), 1, 1);
    const jenEndDate = new Date(date.getFullYear(), 2, 0);

  }

  populateActivityList(): void {
    const date = new Date();
    const todayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
    const endDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);
    this.crmService.getMainItemsBetweenDates(todayStart, endDate).subscribe(list => {
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

  showAction(item: any): void {
    this.router.navigate(['crm', {primaryKey: item}]);
  }

}
