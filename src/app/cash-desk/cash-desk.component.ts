import { Component, OnInit } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { Observable } from 'rxjs/internal/Observable';
import { PurchaseInvoiceService } from '../services/purchase-invoice.service';
import { PurchaseInvoiceModel } from '../models/purchase-invoice-model';
import { SalesInvoiceModel } from '../models/sales-invoice-model';
import { SalesInvoiceService } from '../services/sales-invoice.service';
import { CashDeskModel } from '../models/cash-desk-model';
import { CashDeskService } from '../services/cash-desk.service';

@Component({
  selector: 'app-cash-desk',
  templateUrl: './cash-desk.component.html',
  styleUrls: ['./cash-desk.component.css']
})
export class CashDeskComponent implements OnInit {
  mainList$: Observable<CashDeskModel[]>;
  collection : AngularFirestoreCollection<CashDeskModel>;
  selectedRecord : CashDeskModel;

  constructor(public service: CashDeskService, public db :AngularFirestore) { }

  ngOnInit() {
    this.populateList();
    this.selectedRecord = undefined;
  }

  ngOnDestroy(): void {
    this.mainList$.subscribe();
  }

  populateList() : void {
    this.mainList$ = undefined;
    this.mainList$ = this.service.getAllItems();
  }

  showSelectedRecord(_record: any): void {
    this.selectedRecord = _record as CashDeskModel;
    console.log(this.selectedRecord);
  }

  btnReturnList_Click(): void {
    this.selectedRecord = undefined;
  }

  btnNew_Click(): void {
    this.clearSelectedRecord();
  }

  btnSave_Click(): void {
    if (this.selectedRecord.primaryKey == undefined) {
      this.selectedRecord.primaryKey ="";
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
    this.selectedRecord = {primaryKey:undefined, name:'', description:'', userPrimaryKey:''};
  }

}
