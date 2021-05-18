import { ExcelConfig } from 'src/excel.config';
import {Component, OnInit, OnDestroy} from '@angular/core';
import {AngularFirestore} from '@angular/fire/firestore';
import {Router} from '@angular/router';
import {getFloat, getEncryptionKey, getDateForInput} from '../core/correct-library';
import {InformationService} from '../services/information.service';
import { AccountTransactionMainModel } from '../models/account-transaction-main-model';
import * as Chart from 'chart.js';
import { AccountTransactionService } from '../services/account-transaction.service';
import { PurchaseOrderService } from '../services/purchase-order.service';
import { Subscription } from 'rxjs';
import { PurchaseOrderMainModel } from '../models/purchase-order-main-model';

@Component({
  selector: 'app-dashboard-purchase',
  templateUrl: './dashboard-purchase.component.html',
  styleUrls: ['./dashboard-purchase.component.css']
})
export class DashboardPurchaseComponent implements OnInit, OnDestroy {
  mainList$: Subscription;
  mainList: Array<PurchaseOrderMainModel>;
  chartList$: Subscription;
  BarChart: any;
  LineChart: any;
  encryptSecretKey: string = getEncryptionKey();
  totalValues = {
    purchaseOfferAmount: 0,
    purchaseOrderAmount: 0,
    purchaseInvoiceAmount: 0,
    paymentAmount: 0,
  };

  constructor(protected db: AngularFirestore, protected router: Router, protected infoService: InformationService, protected atService: AccountTransactionService,
              protected service: PurchaseOrderService) {
  }

  async ngOnInit() {

    const date = new Date();
    const beginOfYear = new Date(date.getFullYear(), 0, 1, 0, 0, 0);
    const startDate = new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0);
    const endDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);

    const status = ['waitingForApprove', 'approved', 'portion', 'done'];
    this.mainList$ = this.service.getMainItemsBetweenDates(startDate, endDate, status).subscribe(list => {
      if (this.mainList === undefined) {
        this.mainList = [];
      }
      list.forEach((data: any) => {
        const item = data.returnData as PurchaseOrderMainModel;
        if (item.actionType === 'added') {
          this.mainList.push(item);
          this.totalValues.purchaseOfferAmount += getFloat(Math.abs(item.data.totalPriceWithTax));
          if (item.data.status === 'approved' || item.data.status === 'done' || item.data.status === 'portion') {
            this.totalValues.purchaseOrderAmount += getFloat(Math.abs(item.data.totalPriceWithTax));
          }
        }
        if (item.actionType === 'removed') {
          for (let i = 0; i < this.mainList.length; i++) {
            if (item.data.primaryKey === this.mainList[i].data.primaryKey) {
              this.mainList.splice(i, 1);
              if (item.data.status === 'approved' || item.data.status === 'done' || item.data.status === 'portion') {
                this.totalValues.purchaseOrderAmount -= getFloat(Math.abs(item.data.totalPriceWithTax));
              }
              this.totalValues.purchaseOfferAmount -= getFloat(Math.abs(item.data.totalPriceWithTax));
              break;
            }
          }
        }
        if (item.actionType === 'modified') {
          for (let i = 0; i < this.mainList.length; i++) {
            if (item.data.primaryKey === this.mainList[i].data.primaryKey) {
              this.mainList[i] = item;
              if (item.data.status === 'approved' || item.data.status === 'done' || item.data.status === 'portion') {
                this.totalValues.purchaseOrderAmount -= getFloat(Math.abs(this.mainList[i].data.totalPriceWithTax));
                this.totalValues.purchaseOrderAmount += getFloat(Math.abs(item.data.totalPriceWithTax));
              }
              this.totalValues.purchaseOfferAmount -= getFloat(Math.abs(this.mainList[i].data.totalPriceWithTax));
              this.totalValues.purchaseOfferAmount += getFloat(Math.abs(item.data.totalPriceWithTax));
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

    this.BarChart = new Chart('barChart', {
        type: 'bar', // bar, pie, doughnut
        data: {
          labels: ['Alım Faturası', 'Ödeme'],
          datasets: [
            {
            label: 'Mevcut Ay',
            data: [0, 0],
            backgroundColor: [ExcelConfig.Chart_Colors_Soft.red, ExcelConfig.Chart_Colors_Soft.yellow],
            borderColor: [ExcelConfig.Chart_Colors.red, ExcelConfig.Chart_Colors.yellow],
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
          label: 'Alım Faturası',
          data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          borderWidth: 1,
          fill: false,
          borderColor: ExcelConfig.Chart_Colors.red,
          backgroundColor: ExcelConfig.Chart_Colors.red,
          pointBackgroundColor: ExcelConfig.Chart_Colors.red,
          pointBorderColor: ExcelConfig.Chart_Colors.red,
          pointHoverBackgroundColor: ExcelConfig.Chart_Colors.red,
          pointHoverBorderColor: ExcelConfig.Chart_Colors.red
        },
        {
        label: 'Ödeme',
        data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        borderWidth: 1,
        fill: false,
        borderColor: ExcelConfig.Chart_Colors.yellow,
        backgroundColor: ExcelConfig.Chart_Colors.yellow,
        pointBackgroundColor: ExcelConfig.Chart_Colors.yellow,
        pointBorderColor: ExcelConfig.Chart_Colors.yellow,
        pointHoverBackgroundColor: ExcelConfig.Chart_Colors.yellow,
        pointHoverBorderColor: ExcelConfig.Chart_Colors.yellow
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
        if (item.data.transactionType === 'purchaseInvoice') {
          if (item.data.transactionSubType === 'purchaseInvoice'
          || item.data.transactionSubType === 'servicePurchaseInvoice'
          || item.data.transactionSubType === 'cancelReturnPurchaseInvoice') {
            this.LineChart.data.datasets[0].data[getDateForInput(item.data.insertDate).month - 1] += getFloat(Math.abs(item.data.amount));
            if (getDateForInput(item.data.insertDate).month - 1 === date.getMonth()) {
              this.BarChart.data.datasets[0].data[0] += getFloat(Math.abs(item.data.amount));
              this.totalValues.purchaseInvoiceAmount += getFloat(Math.abs(item.data.amount));
            }
        } else if (item.data.transactionSubType === 'cancelPurchaseInvoice'
          || item.data.transactionSubType === 'cancelServicePurchaseInvoice'
          || item.data.transactionSubType === 'returnPurchaseInvoice') {
            this.LineChart.data.datasets[0].data[getDateForInput(item.data.insertDate).month - 1] -= getFloat(Math.abs(item.data.amount));
            this.BarChart.data.datasets[0].data[0] -= getFloat(Math.abs(item.data.amount));
            this.totalValues.purchaseInvoiceAmount -= getFloat(Math.abs(item.data.amount));
        } else {

        }
        }
        if (item.data.transactionType === 'payment') {
          if (item.data.transactionSubType.startsWith('cancel')) {
            this.LineChart.data.datasets[1].data[getDateForInput(item.data.insertDate).month - 1] -= getFloat(Math.abs(item.data.amount));
            if (getDateForInput(item.data.insertDate).month - 1 === date.getMonth()) {
              this.BarChart.data.datasets[0].data[1] -= getFloat(Math.abs(item.data.amount));
              this.totalValues.paymentAmount -= getFloat(Math.abs(item.data.amount));
            }
          } else {
            this.LineChart.data.datasets[1].data[getDateForInput(item.data.insertDate).month - 1] += getFloat(Math.abs(item.data.amount));
            if (getDateForInput(item.data.insertDate).month - 1 === date.getMonth()) {
              this.BarChart.data.datasets[0].data[1] += getFloat(Math.abs(item.data.amount));
              this.totalValues.paymentAmount += getFloat(Math.abs(item.data.amount));
            }
          }
        }
        this.LineChart.update();
        this.BarChart.update();
      });
    });
  }

  ngOnDestroy(): void {
    if (this.mainList$ !== undefined) {
      this.mainList$.unsubscribe();
    }
    if (this.chartList$ !== undefined) {
      this.chartList$.unsubscribe();
    }
  }
}
