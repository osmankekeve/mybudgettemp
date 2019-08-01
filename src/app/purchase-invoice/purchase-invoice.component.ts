import { Component, OnInit } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { Observable } from 'rxjs/internal/Observable';
import { PurchaseInvoiceService } from '../services/purchase-invoice.service';
import { PurchaseInvoiceModel } from '../models/purchase-invoice-model';

@Component({
  selector: 'app-purchase-invoice',
  templateUrl: './purchase-invoice.component.html',
  styleUrls: ['./purchase-invoice.component.css']
})
export class PurchaseInvoiceComponent implements OnInit {
  mainList$: Observable<PurchaseInvoiceModel[]>;
  collection : AngularFirestoreCollection<PurchaseInvoiceModel>;
  selectedRecord : PurchaseInvoiceModel;

  constructor(public service: PurchaseInvoiceService, public db :AngularFirestore) { }

  ngOnInit() {
    this.populateList();
    this.selectedRecord = undefined;
  }

  ngOnDestroy(): void {
    this.mainList$.subscribe();
  }

  populateList() : void {
    this.mainList$ = undefined;
    this.mainList$ = this.service.getItems();
    this.service.getItems().forEach(value => {
      console.log(value);
    });


  }

  showSelectedRecord(_record: any): void {
    this.selectedRecord = _record.data as PurchaseInvoiceModel;
    console.log(_record);
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
    this.selectedRecord = {primaryKey:undefined, customerCode:'', receiptNo:'', type:'', description:'', totalPrice:0, totalPriceWithTax:0};
  }

}
