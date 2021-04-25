import {Component, OnInit, OnDestroy} from '@angular/core';
import {AngularFirestore} from '@angular/fire/firestore';
import {Chart} from 'chart.js';
import {AccountTransactionService} from '../services/account-transaction.service';
import {CustomerRelationService} from '../services/crm.service';
import {CustomerRelationModel} from '../models/customer-relation-model';
import {Router} from '@angular/router';
import {getFloat, getTodayStart, getTodayEnd, getEncryptionKey, getDateForInput} from '../core/correct-library';
import {VisitMainModel} from '../models/visit-main-model';
import {VisitService} from '../services/visit.service';
import * as CryptoJS from 'crypto-js';
import {InformationService} from '../services/information.service';
import {AccountTransactionMainModel} from '../models/account-transaction-main-model';
import {ToDoService} from '../services/to-do.service';
import {TodoListMainModel} from '../models/to-do-list-main-model';
import {RouterModel} from '../models/router-model';
import {GlobalService} from '../services/global.service';
import { CustomerRelationMainModel } from '../models/customer-relation-main-model';
import { Subscription } from 'rxjs';
import { Utility } from 'src/utilitys.config';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  chartList$: Subscription;
  BarChart: any;
  actionList: Array<CustomerRelationMainModel> = [];
  todoList: Array<TodoListMainModel> = [];
  purchaseInvoiceAmount: any = 0;
  siAmount: any = 0;
  colAmount: any = 0;
  payAmount: any = 0;
  avAmount: any = 0;
  cvAmount: any = 0;
  transactionList: Array<AccountTransactionMainModel> = [];
  visitList: Array<VisitMainModel> = [];
  encryptSecretKey: string = getEncryptionKey();

  constructor(public db: AngularFirestore, public router: Router, public infoService: InformationService, public vService: VisitService,
              public tdService: ToDoService, public globService: GlobalService, public atService: AccountTransactionService,
              public crmService: CustomerRelationService) {
  }

  async ngOnInit() {
    this.transactionList = undefined;
    const date = new Date();
    const monthBeginDate = new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0);
    const monthToday = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);
    this.BarChart = new Chart('barChart', {
        type: 'bar', // bar, pie, doughnut
        data: {
          labels: ['Satış Faturası', 'Tahsilat', 'Alım Faturası', 'Ödeme', 'Hesap Fişi', 'Kasa Fişi'],
          datasets: [{
            label: '# of Votes',
            data: [0, 0, 0, 0, 0, 0],
            backgroundColor: [
              Utility.Chart_Colors_Soft.red,
              Utility.Chart_Colors_Soft.blue,
              Utility.Chart_Colors_Soft.yellow,
              Utility.Chart_Colors_Soft.green,
              Utility.Chart_Colors_Soft.purple,
              Utility.Chart_Colors_Soft.grey
            ],
            borderColor: [
              Utility.Chart_Colors.red,
              Utility.Chart_Colors.blue,
              Utility.Chart_Colors.yellow,
              Utility.Chart_Colors.green,
              Utility.Chart_Colors.purple,
              Utility.Chart_Colors.grey
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
    this.chartList$ = this.atService.getMainItems(monthBeginDate, monthToday, null, null).subscribe(list => {
      if (this.transactionList === undefined) {
        this.transactionList = [];
      }
      list.forEach((data: any) => {
          const item = data.returnData as AccountTransactionMainModel;
          if (item.data.transactionType === 'salesInvoice') {
            if (item.data.transactionSubType === 'salesInvoice'
              || item.data.transactionSubType === 'serviceSalesInvoice'
              || item.data.transactionSubType === 'cancelReturnSalesInvoice') {
                this.BarChart.data.datasets[0].data[0] += getFloat(Math.abs(item.data.amount));
                if (getDateForInput(item.data.insertDate).day === date.getDate()) {
                  this.siAmount += getFloat(Math.abs(item.data.amount));
                  this.transactionList.push(item);
                }
            } else if (item.data.transactionSubType === 'cancelSalesInvoice'
              || item.data.transactionSubType === 'cancelServiceSalesInvoice'
              || item.data.transactionSubType === 'returnSalesInvoice') {
                this.BarChart.data.datasets[0].data[0] -= getFloat(Math.abs(item.data.amount));
                if (getDateForInput(item.data.insertDate).day === date.getDate()) {
                  this.siAmount -= getFloat(Math.abs(item.data.amount));
                  this.transactionList.push(item);
                }
            } else {

            }
          }
          if (item.data.transactionType === 'collection') {
            if (item.data.transactionSubType.startsWith('cancel')) {
              this.BarChart.data.datasets[0].data[1] -= getFloat(Math.abs(item.data.amount));
              if (getDateForInput(item.data.insertDate).day === date.getDate()) {
                this.colAmount -= getFloat(Math.abs(item.data.amount));
                this.transactionList.push(item);
              }
            } else {
              this.BarChart.data.datasets[0].data[1] += getFloat(Math.abs(item.data.amount));
              if (getDateForInput(item.data.insertDate).day === date.getDate()) {
                this.colAmount += getFloat(Math.abs(item.data.amount));
                this.transactionList.push(item);
              }
            }
          }
          if (item.data.transactionType === 'purchaseInvoice') {
            if (item.data.transactionSubType === 'purchaseInvoice'
            || item.data.transactionSubType === 'servicePurchaseInvoice'
            || item.data.transactionSubType === 'cancelReturnPurchaseInvoice') {
              this.BarChart.data.datasets[0].data[2] += getFloat(Math.abs(item.data.amount));
              if (getDateForInput(item.data.insertDate).day === date.getDate()) {
                this.purchaseInvoiceAmount += getFloat(Math.abs(item.data.amount));
                this.transactionList.push(item);
              }
          } else if (item.data.transactionSubType === 'cancelPurchaseInvoice'
            || item.data.transactionSubType === 'cancelServicePurchaseInvoice'
            || item.data.transactionSubType === 'returnPurchaseInvoice') {
              this.BarChart.data.datasets[0].data[2] -= getFloat(Math.abs(item.data.amount));
              if (getDateForInput(item.data.insertDate).day === date.getDate()) {
                this.purchaseInvoiceAmount -= getFloat(Math.abs(item.data.amount));
                this.transactionList.push(item);
              }
          } else {

          }
          }
          if (item.data.transactionType === 'payment') {
            if (item.data.transactionSubType.startsWith('cancel')) {
              this.BarChart.data.datasets[0].data[3] -= getFloat(Math.abs(item.data.amount));
              if (getDateForInput(item.data.insertDate).day === date.getDate()) {
                this.payAmount -= getFloat(Math.abs(item.data.amount));
                this.transactionList.push(item);
              }
            } else {
              this.BarChart.data.datasets[0].data[3] += getFloat(Math.abs(item.data.amount));
              if (getDateForInput(item.data.insertDate).day === date.getDate()) {
                this.payAmount += getFloat(Math.abs(item.data.amount));
                this.transactionList.push(item);
              }
            }
          }
          if (item.data.transactionType === 'accountVoucher') {
            this.BarChart.data.datasets[0].data[4] += getFloat(Math.abs(item.data.amount));
            if (getDateForInput(item.data.insertDate).day === date.getDate()) {
              this.avAmount += getFloat(Math.abs(item.data.amount));
              this.transactionList.push(item);
            }
          }
          if (item.data.transactionType === 'cashDeskVoucher') {
            this.BarChart.data.datasets[0].data[5] += getFloat(Math.abs(item.data.amount));
            if (getDateForInput(item.data.insertDate).day === date.getDate()) {
              this.cvAmount += getFloat(Math.abs(item.data.amount));
              this.transactionList.push(item);
            }
          }
          this.BarChart.update();
      });
    });
    setTimeout(() => {
      if (this.transactionList === undefined) {
        this.transactionList = [];
      }
    }, 1000);

    this.populateActivityList();
    this.populateVisitList();
    this.populateTodoList();
  }

  ngOnDestroy(): void {
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

  async showTransaction(item: AccountTransactionMainModel): Promise<void> {
    const r = new RouterModel();
    r.nextModule = item.data.transactionType;
    r.nextModulePrimaryKey = item.data.transactionPrimaryKey;
    r.previousModule = 'dashboard';
    r.previousModulePrimaryKey = '';
    await this.globService.showTransactionRecord(r);
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
