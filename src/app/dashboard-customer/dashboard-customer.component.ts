import {Component, OnInit, OnDestroy} from '@angular/core';
import {AngularFirestore} from '@angular/fire/firestore';
import {AccountTransactionService} from '../services/account-transaction.service';
import {CustomerRelationService} from '../services/crm.service';
import {CustomerRelationModel} from '../models/customer-relation-model';
import {Router} from '@angular/router';
import {getFloat, getTodayStart, getTodayEnd, getEncryptionKey} from '../core/correct-library';
import {VisitMainModel} from '../models/visit-main-model';
import {VisitService} from '../services/visit.service';
import * as CryptoJS from 'crypto-js';
import {InformationService} from '../services/information.service';
import {ToDoService} from '../services/to-do.service';
import {TodoListMainModel} from '../models/to-do-list-main-model';
import {GlobalService} from '../services/global.service';
import { CustomerRelationMainModel } from '../models/customer-relation-main-model';

@Component({
  selector: 'app-dashboard-customer',
  templateUrl: './dashboard-customer.component.html',
  styleUrls: ['./dashboard-customer.component.css']
})
export class DashboardCustomerComponent implements OnInit, OnDestroy {
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
  }

  ngOnDestroy(): void {
  }

  populateActivityList(): void {
    this.actionList = undefined;
    this.crmService.getMainItemsBetweenDates(getTodayStart(), getTodayEnd()).subscribe(list => {
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
    this.vService.getMainItemsBetweenDates(getTodayStart(), getTodayEnd()).subscribe(list => {
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
    this.tdService.getMainItemsTimeBetweenDates(undefined, undefined, '1').subscribe(list => {
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
