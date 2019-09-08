import { Component, OnInit, OnDestroy } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { Observable } from 'rxjs/internal/Observable';
import { CashDeskModel } from '../models/cash-desk-model';
import { CashDeskService } from '../services/cash-desk.service';
import { AccountTransactionModel } from '../models/account-transaction-model';
import { AccountTransactionService } from '../services/account-transaction-service';

@Component({
  selector: 'app-cash-desk',
  templateUrl: './cash-desk.component.html',
  styleUrls: ['./cash-desk.component.css']
})
export class CashDeskComponent implements OnInit, OnDestroy {
  mainList$: Observable<CashDeskModel[]>;
  collection: AngularFirestoreCollection<CashDeskModel>;
  transactionList$: Observable<AccountTransactionModel[]>;
  selectedRecord: CashDeskModel;
  openedPanel: any;

  constructor(public service: CashDeskService,
              public atService: AccountTransactionService,
              public db: AngularFirestore) { }

  ngOnInit() {
    this.populateList();
    this.selectedRecord = undefined;
  }

  ngOnDestroy(): void {
    this.mainList$.subscribe();
  }

  populateList(): void {
    this.mainList$ = undefined;
    this.mainList$ = this.service.getAllItems();
  }

  showSelectedRecord(record: any): void {
    this.openedPanel = 'mainPanel';
    this.selectedRecord = record as CashDeskModel;
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
      this.service.addItem(this.selectedRecord);
    } else {
      this.service.updateItem(this.selectedRecord);
    }
    this.selectedRecord = undefined;
  }

  btnRemove_Click(): void {
    this.service.removeItem(this.selectedRecord);
    this.selectedRecord = undefined;
  }

  clearSelectedRecord(): void {
    this.selectedRecord = {primaryKey: undefined, name: '', description: '', userPrimaryKey: ''};
  }

  onClickShowTransactionReport(): void {
    this.openedPanel = 'transactionReport';
    this.transactionList$ = undefined;
    this.transactionList$ = this.atService.getCashDeskTransactions(this.selectedRecord.primaryKey);
  }

}
