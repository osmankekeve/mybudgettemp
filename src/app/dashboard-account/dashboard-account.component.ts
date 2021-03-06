import {Component, OnInit, OnDestroy} from '@angular/core';
import {AngularFirestore} from '@angular/fire/firestore';
import {Router} from '@angular/router';
import {getFloat, getEncryptionKey, getDateForInput} from '../core/correct-library';
import {InformationService} from '../services/information.service';
import { AccountTransactionMainModel } from '../models/account-transaction-main-model';
import * as Chart from 'chart.js';
import { AccountTransactionService } from '../services/account-transaction.service';
import { Subscription } from 'rxjs';
import { Utility } from 'src/utilitys.config';

@Component({
  selector: 'app-dashboard-account',
  templateUrl: './dashboard-account.component.html',
  styleUrls: ['./dashboard-account.component.css']
})
export class DashboardAccountComponent implements OnInit, OnDestroy {
  chartList$: Subscription;
  BarChart: any;
  LineChart: any;
  encryptSecretKey: string = getEncryptionKey();
  totalValues = {
    cvAmount: 0,
    avAmount: 0,
  };

  constructor(public db: AngularFirestore, public router: Router, public infoService: InformationService, public atService: AccountTransactionService) {
  }

  async ngOnInit() {
    const date = new Date();
    const beginOfYear = new Date(date.getFullYear(), 0, 1, 0, 0, 0);
    const todayStart = new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0);
    const endDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);

    this.BarChart = new Chart('barChart', {
        type: 'bar', // bar, pie, doughnut
        data: {
          labels: ['Cari Fiş', 'Kasa Fişi'],
          datasets: [
            {
            label: 'Mevcut Ay',
            data: [0, 0],
            backgroundColor: [Utility.Chart_Colors_Soft.red, Utility.Chart_Colors_Soft.yellow],
            borderColor: [Utility.Chart_Colors.red, Utility.Chart_Colors.yellow],
            borderWidth: 1,
          }
        ]
        },
        options: {
          title: {
            text: 'Aylık Cari Hareketler',
            display: true
          },
          scales: {
            yAxes: [{
              ticks: {
                beginAtZero: true,
                callback: (value, index, values) => {
                  if (Number(value) >= 1000) {
                    return '₺' + Number(value).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                  } else {
                    return '₺' + Number(value).toFixed(2);
                  }
                }
              }
            }]
          },
          tooltips: {
            callbacks: {
              label(tooltipItem, data) {
                return '₺' + Number(tooltipItem.yLabel).toFixed(2).replace(/./g, (c, i, a) => {
                  return i > 0 && c !== '.' && (a.length - i) % 3 === 0 ? ',' + c : c;
                });
              }
            }
          }
        }
    });
    this.LineChart = new Chart('lineChart', {
      type: 'line', // bar, pie, doughnut
      data: {
        labels: ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'],
        datasets: [
          {
          label: 'Cari Fiş',
          data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          borderWidth: 1,
          fill: false,
          borderColor: Utility.Chart_Colors.red,
          backgroundColor: Utility.Chart_Colors.red,
          pointBackgroundColor: Utility.Chart_Colors.red,
          pointBorderColor: Utility.Chart_Colors.red,
          pointHoverBackgroundColor: Utility.Chart_Colors.red,
          pointHoverBorderColor: Utility.Chart_Colors.red
        },
        {
        label: 'Kasa Fişi',
        data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        borderWidth: 1,
        fill: false,
        borderColor: Utility.Chart_Colors.yellow,
        backgroundColor: Utility.Chart_Colors.yellow,
        pointBackgroundColor: Utility.Chart_Colors.yellow,
        pointBorderColor: Utility.Chart_Colors.yellow,
        pointHoverBackgroundColor: Utility.Chart_Colors.yellow,
        pointHoverBorderColor: Utility.Chart_Colors.yellow
      }
      ]
      },
      options: {
        title: {
          text: 'Yıllık Cari Hareketler',
          display: true
        },
        scales: {
          yAxes: [{
            ticks: {
              beginAtZero: true,
              callback: (value, index, values) => {
                if (Number(value) >= 1000) {
                  return '₺' + Number(value).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                } else {
                  return '₺' + Number(value).toFixed(2);
                }
              }
            }
          }]
        },
        tooltips: {
          callbacks: {
            label(tooltipItem, data) {
              return '₺' + Number(tooltipItem.yLabel).toFixed(2).replace(/./g, (c, i, a) => {
                return i > 0 && c !== '.' && (a.length - i) % 3 === 0 ? ',' + c : c;
              });
            }
          }
        }
      }
    });
    this.chartList$ = this.atService.getMainItems(beginOfYear, endDate, null, null).subscribe(list => {
      list.forEach((data: any) => {
        const item = data.returnData as AccountTransactionMainModel;
        if (item.data.transactionType === 'accountVoucher') {
          this.LineChart.data.datasets[0].data[getDateForInput(item.data.insertDate).month - 1] += getFloat(Math.abs(item.data.amount));
          if (getDateForInput(item.data.insertDate).month - 1 === date.getMonth()) {
            this.BarChart.data.datasets[0].data[0] += getFloat(Math.abs(item.data.amount));
            this.totalValues.avAmount += getFloat(Math.abs(item.data.amount));
          }
        }
        if (item.data.transactionType === 'cashDeskVoucher') {
          this.LineChart.data.datasets[1].data[getDateForInput(item.data.insertDate).month - 1] += getFloat(Math.abs(item.data.amount));
          if (getDateForInput(item.data.insertDate).month - 1 === date.getMonth()) {
            this.BarChart.data.datasets[0].data[1] += getFloat(Math.abs(item.data.amount));
            this.totalValues.cvAmount += getFloat(Math.abs(item.data.amount));
          }
        }
        this.LineChart.update();
        this.BarChart.update();
      });
    });
  }

  ngOnDestroy(): void {
    if (this.chartList$ !== undefined) {
      this.chartList$.unsubscribe();
    }
  }
}
