import { Component, OnInit, OnDestroy } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Chart } from 'chart.js';
import { Observable } from 'rxjs';
import { AccountTransactionModel } from '../models/account-transaction-model';
import { AccountTransactionService } from '../services/account-transaction-service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashoardComponent implements OnInit, OnDestroy {
  LineChart: any;
  BarChart: any;
  PieChart: any;
  transactionList$: Observable<AccountTransactionModel[]>;
  purchaseInvoiceAmount: any = 0;
  siAmount: any = 0;
  colAmount: any = 0;
  payAmount: any = 0;
  avAmount: any = 0;
  cvAmount: any = 0;
  transactionList: Array<AccountTransactionModel>;

  constructor(public db: AngularFirestore,
              public atService: AccountTransactionService) { }

  ngOnInit() {
    this.LineChart = new Chart('lineChart', {
      type: 'line',
    data: {
     labels: ['Jan', 'Feb', 'March', 'April', 'May', 'June', 'July', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
     datasets: [{
         label: 'Number of Items Sold in Months',
         data: [9, 7 , 3, 5, 2, 10, 15, 16, 19, 3, 1, 9],
         fill: false,
         lineTension: 0.2,
         borderColor: 'red',
         borderWidth: 1
     }]
    },
    options: {
     title: {
         text: 'Line Chart',
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

    // pie chart:
    this.PieChart = new Chart('pieChart', {
    type: 'pie',
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

  }

  ngOnDestroy(): void {
  }

}
