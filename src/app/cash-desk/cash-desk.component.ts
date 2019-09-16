import { Component, OnInit, OnDestroy } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { Observable } from 'rxjs/internal/Observable';
import { CashDeskModel } from '../models/cash-desk-model';
import { CashDeskService } from '../services/cash-desk.service';
import { AccountTransactionModel } from '../models/account-transaction-model';
import { AccountTransactionService } from '../services/account-transaction-service';
import { InformationService } from '../services/information.service';
import { AuthenticationService } from '../services/authentication.service';

@Component({
  selector: 'app-cash-desk',
  templateUrl: './cash-desk.component.html',
  styleUrls: ['./cash-desk.component.css']
})
export class CashDeskComponent implements OnInit, OnDestroy {
  mainList: Array<CashDeskModel>;
  collection: AngularFirestoreCollection<CashDeskModel>;
  transactionList$: Observable<AccountTransactionModel[]>;
  selectedRecord: CashDeskModel;
  refModel: CashDeskModel;
  openedPanel: any;

  constructor(public authServis: AuthenticationService, public service: CashDeskService,
              public atService: AccountTransactionService,
              public infoService: InformationService,
              public db: AngularFirestore) { }

  ngOnInit() {
    this.populateList();
    this.selectedRecord = undefined;
  }

  ngOnDestroy(): void { }

  populateList(): void {
    this.mainList = [];
    this.service.getMainItems().subscribe(list => {
      list.forEach((item: any) => {
        if (item.actionType === 'added') {
          this.mainList.push(item);
        } else if (item.actionType === 'removed') {
          this.mainList.splice(this.mainList.indexOf(this.refModel), 1);
        } else if (item.data.actionType === 'modified') {
          this.mainList[this.mainList.indexOf(this.refModel)] = item.data;
        } else {
          // nothing
        }
      });
    });
  }

  showSelectedRecord(record: any): void {
    this.openedPanel = 'mainPanel';
    this.selectedRecord = record.data as CashDeskModel;
    this.refModel = record.data as CashDeskModel;
    console.log(this.selectedRecord);
  }

  btnReturnList_Click(): void {
    if (this.openedPanel === 'mainPanel') {
      this.selectedRecord = undefined;
    } else {
      this.openedPanel = 'mainPanel';
    }
  }

  btnNew_Click(): void {
    this.clearSelectedRecord();
  }

  btnSave_Click(): void {
    if (this.selectedRecord.primaryKey === undefined) {
      this.selectedRecord.primaryKey = '';
      this.service.addItem(this.selectedRecord)
      .then(() => {
        this.infoService.success('Kasa başarıyla kaydedildi.');
        this.selectedRecord = undefined;
      }).catch(err => this.infoService.error(err));
    } else {
      this.service.updateItem(this.selectedRecord)
      .then(() => {
        this.infoService.success('Kasa başarıyla güncellendi.');
        this.selectedRecord = undefined;
      }).catch(err => this.infoService.error(err));
    }
  }

  btnRemove_Click(): void {
    this.service.removeItem(this.selectedRecord)
    .then(() => {
      this.infoService.success('Kasa başarıyla kaldırıldı.');
      this.selectedRecord = undefined;
    }).catch(err => this.infoService.error(err));
  }

  clearSelectedRecord(): void {
    this.openedPanel = 'mainPanel';
    this.refModel = undefined;
    this.selectedRecord = {primaryKey: undefined, name: '', description: '', userPrimaryKey: this.authServis.getUid()};
    console.log(this.selectedRecord);
  }

  onClickShowTransactionReport(): void {
    this.openedPanel = 'transactionReport';
    this.transactionList$ = undefined;
    this.transactionList$ = this.atService.getCashDeskTransactions(this.selectedRecord.primaryKey);
  }

}
