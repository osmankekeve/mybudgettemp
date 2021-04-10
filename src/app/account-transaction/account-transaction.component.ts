import { Component, OnInit, OnDestroy } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { InformationService } from '../services/information.service';
import { getFirstDayOfMonthForInput, getFloat, getTodayForInput, isNullOrEmpty, moneyFormat } from '../core/correct-library';
import { AccountTransactionService } from '../services/account-transaction.service';
import {AccountTransactionMainModel} from '../models/account-transaction-main-model';
import { MainFilterComponent } from '../partials/main-filter/main-filter.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
@Component({
  selector: 'app-account-transaction',
  templateUrl: './account-transaction.component.html',
  styleUrls: ['./account-transaction.component.css']
})
export class AccountTransactionComponent implements OnInit, OnDestroy {
  mainList: Array<AccountTransactionMainModel>;
  selectedRecord: AccountTransactionMainModel;
  searchText: '';
  jsonData: any;
  onTransaction = false;
  filter = {
    filterBeginDate: getFirstDayOfMonthForInput(),
    filterFinishDate: getTodayForInput(),
  };

  constructor(public infoService: InformationService, public service: AccountTransactionService, public db: AngularFirestore, protected modalService: NgbModal) { }

  ngOnInit() {
    this.populateList();
  }

  ngOnDestroy(): void {

  }

  populateList(): void {
    this.mainList = undefined;
    const beginDate = new Date(this.filter.filterBeginDate.year, this.filter.filterBeginDate.month - 1, this.filter.filterBeginDate.day, 0, 0, 0);
    const finishDate = new Date(this.filter.filterFinishDate.year, this.filter.filterFinishDate.month - 1, this.filter.filterFinishDate.day + 1, 0, 0, 0);
    this.service.getMainItems(beginDate, finishDate, null, null).subscribe(list => {
      if (this.mainList === undefined) {
        this.mainList = [];
      }
      list.forEach((data: any) => {
        const item = data.returnData as AccountTransactionMainModel;
        if (item.actionType === 'added') {
          this.mainList.push(item);
        }
        if (item.actionType === 'removed') {
          for (let i = 0; i < this.mainList.length; i++) {
            if (item.data.primaryKey === this.mainList[i].data.primaryKey) {
              this.mainList.splice(i, 1);
            }
          }
        }
        if (item.actionType === 'modified') {
          for (let i = 0; i < this.mainList.length; i++) {
            if (item.data.primaryKey === this.mainList[i].data.primaryKey) {
              this.mainList[i] = item;
            }
          }
        }
      });
    });
    setTimeout (() => {
      if (this.mainList === undefined) {
        this.mainList = [];
      }
    }, 1000);
  }

  showSelectedRecord(record: any): void {
    this.selectedRecord = record as AccountTransactionMainModel;
    this.jsonData = JSON.stringify(this.selectedRecord, null, 2);
  }

  async btnRemove_Click(): Promise<void> {
    try {
      await this.service.removeItem(this.selectedRecord.data, null)
        .then(() => {
          this.infoService.success('Hesap hareketi başarıyla kaldırıldı.');
          this.selectedRecord = undefined;
        })
        .catch(error => this.finishProcessAndError(error));
    } catch (error) {
      this.finishProcessAndError(error);
    }
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

  btnReturnList_Click(): void {
    this.selectedRecord = undefined;
  }

  finishProcessAndError(error: any): void {
    // error.message sistem hatası
    // error kontrol hatası
    this.onTransaction = false;
    this.infoService.error(error.message !== undefined ? error.message : error);
  }

  async btnSave_Click(): Promise<void> {
    try {
      await this.service.updateItem(this.selectedRecord.data)
      .then(() => {
        this.infoService.success('Kayıt başarıyla güncellendi.');
      })
      .catch((error) => {
        this.infoService.error(error);
      });
    } catch (error) {
      this.infoService.error(error);
    }
  }

  format_amount($event): void {
    this.selectedRecord.data.amount = getFloat(moneyFormat($event.target.value));
  }

  focus_amount(): void {
    if (this.selectedRecord.data.amount === 0) {
      this.selectedRecord.data.amount = null;
    }
  }
}
