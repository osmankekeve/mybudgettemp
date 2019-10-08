import { Component, OnInit, OnDestroy } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Chart } from 'chart.js';
import { Observable } from 'rxjs';
import { AccountTransactionModel } from '../models/account-transaction-model';
import { AccountTransactionService } from '../services/account-transaction-service';
import { async } from 'q';
import {LogService} from '../services/log.service';
import {CustomerRelationService} from '../services/crm.service';
import {CustomerRelationModel} from '../models/customer-relation-model';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  LineChart: any;
  BarChart: any;
  PieChart: any;
  transactionList$: Observable<AccountTransactionModel[]>;
  actionList: Array<CustomerRelationModel> = [];
  purchaseInvoiceAmount: any = 0;
  siAmount: any = 0;
  colAmount: any = 0;
  payAmount: any = 0;
  avAmount: any = 0;
  cvAmount: any = 0;
  transactionList: Array<AccountTransactionModel>;

  constructor(public db: AngularFirestore,
              public atService: AccountTransactionService, public crmService: CustomerRelationService) { }

  async ngOnInit() {
    // Bar chart:
    this.BarChart = new Chart('barChart', {
    type: 'bar',
    data: {
    labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
    datasets: [{
     label: '# of Votes',
     data: [9, 7 , 3, 5, 2, 10],
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
     text: 'Bar Chart',
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
    const chartData = [{month: 0, amount: 0}, {month: 0, amount: 0},
        {month: 0, amount: 0}, {month: 0, amount: 0}, {month: 0, amount: 0}, {month: 0, amount: 0},
        {month: 0, amount: 0}, {month: 0, amount: 0}, {month: 0, amount: 0}, {month: 0, amount: 0},
        {month: 0, amount: 0}, {month: 0, amount: 0}];

    // tslint:disable-next-line: prefer-for-of
    for (let i = 1; i <= 12; i++) {
        const startDate = new Date(date.getFullYear(), i, 1);
        const endDate = new Date(date.getFullYear(), i + 1, 0);
        chartData[i - 1].month += i;

        this.atService.getOnDayTransactionsBetweenDatesAsync(startDate, endDate).then(list => {
            list.forEach(item => {
                if (item.transactionType === 'payment') {
                    chartData[i - 1].amount += item.amount;
                }
            });
        });
    }
    console.table('list done');

    this.LineChart = undefined;
    this.LineChart = new Chart('lineChart', {
        type: 'line',
      data: {
       labels: [chartData[0].month.toString(), chartData[1].month.toString(), chartData[2].month.toString(),
       chartData[3].month.toString(), chartData[4].month.toString(), chartData[5].month.toString(), chartData[6].month.toString(),
       chartData[7].month.toString(), chartData[8].month.toString(), chartData[9].month.toString(), chartData[10].month.toString(),
       chartData[11].month.toString()],
       datasets: [{
           label: 'Tutar',
           data: [chartData[0].amount, chartData[1].amount, chartData[2].amount, chartData[3].amount, chartData[4].amount
           , chartData[5].amount, chartData[6].amount, chartData[7].amount, chartData[8].amount, chartData[9].amount
           , chartData[10].amount, chartData[11].amount
            ],
           fill: false,
           lineTension: 0.2,
           borderColor: 'red',
           borderWidth: 1
       }]
      },
      options: {
       title: {
           text: 'Aylık Ödeme Giderleri',
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
    console.table('chart done');
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

}
