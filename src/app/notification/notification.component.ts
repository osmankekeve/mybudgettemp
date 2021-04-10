import { Component, OnInit, OnDestroy } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { InformationService } from '../services/information.service';
import { AccountTransactionModel } from '../models/account-transaction-model';
import { LogModel } from '../models/log-model';
import { LogService } from '../services/log.service';
import { getFirstDayOfMonthForInput, getTodayForInput, isNullOrEmpty } from '../core/correct-library';
import { MainFilterComponent } from '../partials/main-filter/main-filter.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';
@Component({
  selector: 'app-notification',
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.css']
})
export class NotificationComponent implements OnInit, OnDestroy {
  mainList$: Subscription;
  mainList: Array<LogModel>;
  refModel: LogModel;
  isMainFilterOpened = false;
  filter = {
    filterBeginDate: getFirstDayOfMonthForInput(),
    filterFinishDate: getTodayForInput(),
  };
  searchText: '';

  constructor(public infoService: InformationService, protected modalService: NgbModal,
              public service: LogService,
              public db: AngularFirestore) { }

  ngOnInit() {
    this.populateList();
  }

  ngOnDestroy() {
    if (this.mainList$ !== undefined) {
      this.mainList$.unsubscribe();
    }
  }

  populateList(): void {
    this.mainList = undefined;
    const beginDate = new Date(this.filter.filterBeginDate.year, this.filter.filterBeginDate.month - 1, this.filter.filterBeginDate.day, 0, 0, 0);
    const finishDate = new Date(this.filter.filterFinishDate.year, this.filter.filterFinishDate.month - 1, this.filter.filterFinishDate.day + 1, 0, 0, 0);
    this.mainList$ = this.service.getNotifications(beginDate, finishDate).subscribe(list => {
      this.mainList = [];
      list.forEach((item: any) => {
        if (item.actionType === 'added') {
          this.mainList.push(item);
        } else if (item.actionType === 'removed') {
          this.mainList.splice(this.mainList.indexOf(this.refModel), 1);
        } else if (item.actionType === 'modified') {
          this.mainList[this.mainList.indexOf(this.refModel)] = item.data;
        } else {
          // nothing
        }
      });
    });
    setTimeout (() => {
      if (this.mainList === undefined) {
        this.mainList = [];
      }
    }, 1000);
  }

  async btnShowMainFiler_Click(): Promise<void> {
    try {
      const modalRef = this.modalService.open(MainFilterComponent, {size: 'md'});
      modalRef.result.then((result: any) => {
        if (result) {
          this.filter.filterBeginDate = result.filterBeginDate;
          this.filter.filterFinishDate = result.filterFinishDate;
          this.ngOnDestroy();
          this.populateList();
        }
      }, () => {});
    } catch (error) {
      await this.infoService.error(error);
    }
  }
}
