import { ExcelConfig } from 'src/excel.config';
import {Component, OnInit, OnDestroy} from '@angular/core';
import {AngularFirestore} from '@angular/fire/firestore';
import {AccountTransactionService} from '../services/account-transaction.service';
import {CustomerRelationService} from '../services/crm.service';
import {Router} from '@angular/router';
import {getTodayStart, getTodayEnd, getEncryptionKey, getDateForInput} from '../core/correct-library';
import {VisitMainModel} from '../models/visit-main-model';
import {VisitService} from '../services/visit.service';
import * as CryptoJS from 'crypto-js';
import {InformationService} from '../services/information.service';
import {ToDoService} from '../services/to-do.service';
import {TodoListMainModel} from '../models/to-do-list-main-model';
import {GlobalService} from '../services/global.service';
import { CustomerRelationMainModel } from '../models/customer-relation-main-model';
import { Subscription } from 'rxjs';
import * as Chart from 'chart.js';
import { AccountTransactionMainModel } from '../models/account-transaction-main-model';

@Component({
  selector: 'app-dashboard-customer',
  templateUrl: './dashboard-customer.component.html',
  styleUrls: ['./dashboard-customer.component.css']
})
export class DashboardCustomerComponent implements OnInit, OnDestroy {
  LineChart: any;
  chartList$: Subscription;
  actionList: Array<CustomerRelationMainModel> = [];
  todoList: Array<TodoListMainModel> = [];
  visitList: Array<VisitMainModel> = [];
  encryptSecretKey: string = getEncryptionKey();

  constructor(public db: AngularFirestore, public router: Router, public infoService: InformationService, public vService: VisitService,
              public tdService: ToDoService, public globService: GlobalService, public atService: AccountTransactionService,
              public crmService: CustomerRelationService) {
  }

  async ngOnInit() {
    this.populateActivityList();
    this.populateVisitList();
    this.populateTodoList();

    const date = new Date();
    const beginOfYear = new Date(date.getFullYear(), 0, 1, 0, 0, 0);
    const monthToday = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);

    this.LineChart = new Chart('lineChart', {
      type: 'line', // bar, pie, doughnut
      data: {
        labels: ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'],
        datasets: [
          {
            label: 'Satış Faturası',
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
          label: 'Tahsilat',
          data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          borderWidth: 1,
          fill: false,
          borderColor: ExcelConfig.Chart_Colors.yellow,
          backgroundColor: ExcelConfig.Chart_Colors.yellow,
          pointBackgroundColor: ExcelConfig.Chart_Colors.yellow,
          pointBorderColor: ExcelConfig.Chart_Colors.yellow,
          pointHoverBackgroundColor: ExcelConfig.Chart_Colors.yellow,
          pointHoverBorderColor: ExcelConfig.Chart_Colors.yellow
          },
          {
            label: 'Alım Faturası',
            data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            borderWidth: 1,
            fill: false,
            borderColor: ExcelConfig.Chart_Colors.blue,
            backgroundColor: ExcelConfig.Chart_Colors.blue,
            pointBackgroundColor: ExcelConfig.Chart_Colors.blue,
            pointBorderColor: ExcelConfig.Chart_Colors.blue,
            pointHoverBackgroundColor: ExcelConfig.Chart_Colors.blue,
            pointHoverBorderColor: ExcelConfig.Chart_Colors.blue
          },
          {
            label: 'Ödeme',
            data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            borderWidth: 1,
            fill: false,
            borderColor: ExcelConfig.Chart_Colors.purple,
            backgroundColor: ExcelConfig.Chart_Colors.purple,
            pointBackgroundColor: ExcelConfig.Chart_Colors.purple,
            pointBorderColor: ExcelConfig.Chart_Colors.purple,
            pointHoverBackgroundColor: ExcelConfig.Chart_Colors.purple,
            pointHoverBorderColor: ExcelConfig.Chart_Colors.purple
          }
      ]
      },
      options: {
        title: {
          text: 'Ay Bazlı Müşteri Sayıları',
          display: true
        },
        scales: {
          yAxes: [{
            ticks: {
              beginAtZero: true,
              callback: (value, index, values) => {
                return Number(value);
              }
            }
          }]
        },
        tooltips: {
          callbacks: {
            label(tooltipItem, data) {
              return Number(tooltipItem.yLabel).toString() + ' ' + 'Adet Kayıt';
            }
          }
        }
      }
    });
    this.chartList$ = this.atService.getMainItems(beginOfYear, monthToday, null, null).subscribe(list => {
      list.forEach((data: any) => {
            const item = data.returnData as AccountTransactionMainModel;
            if (item.data.transactionType === 'salesInvoice') {
              if (item.data.transactionSubType === 'salesInvoice' || item.data.transactionSubType === 'serviceSalesInvoice') {
                  this.LineChart.data.datasets[0].data[getDateForInput(item.data.insertDate).month - 1] += 1;
              }
            }
            if (item.data.transactionType === 'collection') {
              if (!item.data.transactionSubType.startsWith('cancel')) {
                this.LineChart.data.datasets[1].data[getDateForInput(item.data.insertDate).month - 1] += 1;
              }
            }
            if (item.data.transactionType === 'purchaseInvoice') {
              if (item.data.transactionSubType === 'purchaseInvoice'
              || item.data.transactionSubType === 'servicePurchaseInvoice') {
                this.LineChart.data.datasets[2].data[getDateForInput(item.data.insertDate).month - 1] += 1;
            }
            }
            if (item.data.transactionType === 'payment') {
              if (!item.data.transactionSubType.startsWith('cancel')) {
                this.LineChart.data.datasets[3].data[getDateForInput(item.data.insertDate).month - 1] += 1;
              }
            }
            this.LineChart.update();
      });
    });
  }

  ngOnDestroy(): void {
    if (this.chartList$ !== undefined) {
      this.chartList$.unsubscribe();
    }
  }

  populateActivityList(): void {
    this.actionList = undefined;
    this.crmService.getMainItemsBetweenDates(getTodayStart(), getTodayEnd()).toPromise().then(list => {
      this.actionList = [];
      list.forEach((item: any) => {
        const data = item.returnData;
        console.log(data);
        if (data.actionType === 'added') {
          this.actionList.push(data);
        } else if (data.actionType === 'removed') {
          this.actionList.splice(this.actionList.indexOf(data), 1);
        } else if (data.actionType === 'modified') {
          this.actionList[this.actionList.indexOf(data)] = data;
        } else {
          // nothing
        }
      });
    });
    setTimeout(() => {
      if (this.actionList === undefined) {
        this.actionList = [];
      }
    }, 1000);
  }

  populateVisitList(): void {
    this.visitList = undefined;
    this.vService.getMainItemsBetweenDates(getTodayStart(), getTodayEnd()).toPromise().then(list => {
      this.visitList = [];
      list.forEach((data: any) => {
        const item = data.returnData as VisitMainModel;
        if (item.actionType === 'added') {
          this.visitList.push(item);
        }
        if (item.actionType === 'removed') {
          this.visitList.splice(this.visitList.indexOf(item), 1);
        }
        if (item.actionType === 'modified') {
          this.visitList[this.visitList.indexOf(item)] = item;
        }
      });
    });
    setTimeout(() => {
      if (this.visitList === undefined) {
        this.visitList = [];
      }
    }, 1000);
  }

  populateTodoList(): void {
    this.todoList = undefined;
    this.tdService.getMainItemsTimeBetweenDates(undefined, undefined, '1').toPromise().then(list => {
      if (this.todoList === undefined) {
        this.todoList = [];
      }
      list.forEach((data: any) => {
        const item = data.returnData as TodoListMainModel;
        if (item.actionType === 'added') {
          this.todoList.push(item);
        }
        if (item.actionType === 'removed') {
          for (let i = 0; i < this.todoList.length; i++) {
            if (this.todoList[i].data.primaryKey === item.data.primaryKey) {
              this.todoList.splice(i, 1);
              break;
            }
          }
        }
        if (item.actionType === 'modified') {
          for (let i = 0; i < this.todoList.length; i++) {
            if (this.todoList[i].data.primaryKey === item.data.primaryKey) {
              if (item.data.isActive === false) {
                this.todoList.splice(i, 1);
              } else {
                this.todoList[i] = item;
                break;
              }
            }
          }
        }
      });
    });
    setTimeout(() => {
      if (this.todoList === undefined) {
        this.todoList = [];
      }
    }, 5000);
  }

  showAction(item: any): void {
    this.router.navigate(['crm', {paramItem: CryptoJS.AES.encrypt(JSON.stringify(item), this.encryptSecretKey).toString()}]);
  }

  showVisit(item: any): void {
    this.router.navigate(['visit', {paramItem: CryptoJS.AES.encrypt(JSON.stringify(item), this.encryptSecretKey).toString()}]);
  }

  btnRemoveTodo_Click(item: TodoListMainModel): void {
    try {
      this.tdService.removeItem(item).catch(err => this.infoService.error(err));
    } catch (e) {
      this.infoService.error(e);
    }
  }

  btnArchiveTodo_Click(item: TodoListMainModel): void {
    try {
      item.data.isActive = false;
      this.tdService.updateItem(item).catch(err => this.infoService.error(err));
    } catch (e) {
      this.infoService.error(e);
    }
  }
}

