import {Component, OnInit, OnDestroy} from '@angular/core';
import {AngularFirestore} from '@angular/fire/firestore';
import {Router} from '@angular/router';
import {getFloat, getTodayStart, getTodayEnd, getEncryptionKey} from '../core/correct-library';
import {VisitMainModel} from '../models/visit-main-model';
import * as CryptoJS from 'crypto-js';
import {InformationService} from '../services/information.service';
import {TodoListMainModel} from '../models/to-do-list-main-model';
import { CustomerRelationMainModel } from '../models/customer-relation-main-model';
import { AccountTransactionService } from '../services/account-transaction.service';
import { AccountTransactionMainModel } from '../models/account-transaction-main-model';
import * as Chart from 'chart.js';

@Component({
  selector: 'app-dashboard-sales',
  templateUrl: './dashboard-sales.component.html',
  styleUrls: ['./dashboard-sales.component.css']
})
export class DashboardSalesComponent implements OnInit, OnDestroy {
  BarChart: any;
  encryptSecretKey: string = getEncryptionKey();
  siAmount: any = 0;
  colAmount: any = 0;
  avAmount: any = 0;

  constructor(public db: AngularFirestore, public router: Router, public infoService: InformationService, public atService: AccountTransactionService) {
  }

  async ngOnInit() {

    const date = new Date();
    const todayStart = new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0);
    const endDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);
    Promise.all([this.atService.getOnDayTransactionsBetweenDates2(todayStart, endDate)])
      .then((values: any) => {
        if (values[0] !== null) {
          const returnData = values[0] as Array<AccountTransactionMainModel>;
          returnData.forEach(item => {
            if (item.data.transactionType === 'salesInvoice') {
              if (item.data.transactionSubType === 'salesInvoice'
                || item.data.transactionSubType === 'serviceSalesInvoice'
                || item.data.transactionSubType === 'cancelReturnSalesInvoice') {
                this.siAmount += getFloat(Math.abs(item.data.amount));
              } else if (item.data.transactionSubType === 'cancelSalesInvoice'
                || item.data.transactionSubType === 'cancelServiceSalesInvoice'
                || item.data.transactionSubType === 'returnSalesInvoice') {
                  this.siAmount -= getFloat(Math.abs(item.data.amount));
              } else {

              }
            }
            if (item.data.transactionType === 'collection') {
              if (item.data.transactionSubType.startsWith('cancel')) {
                this.colAmount -= getFloat(Math.abs(item.data.amount));
              } else {
                this.colAmount += getFloat(Math.abs(item.data.amount));
              }
            }
            if (item.data.transactionType === 'accountVoucher') {
              this.avAmount += getFloat(Math.abs(item.data.amount));
            }
          });
        }
      })
      .finally(() => {
        this.BarChart = new Chart('barChart', {
          type: 'bar', // bar, pie, doughnut
          data: {
            labels: ['Satış Faturası', 'Tahsilat', 'Hesap Fişi'],
            datasets: [{
              label: '# of Votes',
              data: [this.siAmount, this.colAmount, this.avAmount],
              backgroundColor: [
                'rgba(255, 99, 132, 0.2)',
                'rgba(54, 162, 235, 0.2)',
                'rgba(255, 206, 86, 0.2)'
              ],
              borderColor: [
                'rgba(255,99,132,1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)'
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
            },
          }
        });
      });
  }

  ngOnDestroy(): void {
  }
}
