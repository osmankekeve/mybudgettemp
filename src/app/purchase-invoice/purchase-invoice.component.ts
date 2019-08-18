import { Component, OnInit, OnDestroy } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { Observable } from 'rxjs/internal/Observable';
import { PurchaseInvoiceService } from '../services/purchase-invoice.service';
import { PurchaseInvoiceModel } from '../models/purchase-invoice-model';

@Component({
  selector: 'app-purchase-invoice',
  templateUrl: './purchase-invoice.component.html',
  styleUrls: ['./purchase-invoice.component.css']
})
export class PurchaseInvoiceComponent implements OnInit, OnDestroy {
  mainList$: Observable<PurchaseInvoiceModel[]>;
  collection: AngularFirestoreCollection<PurchaseInvoiceModel>;
  selectedRecord: PurchaseInvoiceModel;
  selectedRecordSubItems: {
    customerName: string,
    invoiceType: string
  };
  mainListLength = 0;

  constructor(public service: PurchaseInvoiceService, public db: AngularFirestore) { }

  ngOnInit() {
    this.populateList();
    this.selectedRecord = undefined;
  }

  ngOnDestroy(): void {
    this.mainList$.subscribe();
  }

  populateList(): void {
    this.mainList$ = undefined;
    this.mainList$ = this.service.getItems();
  }

  showSelectedRecord(record: any): void {
    this.selectedRecord = record.data as PurchaseInvoiceModel;
    this.selectedRecord.totalPrice = Math.abs(this.selectedRecord.totalPrice);
    this.selectedRecord.totalPriceWithTax = Math.abs(this.selectedRecord.totalPriceWithTax);
    this.selectedRecordSubItems = {
      customerName : record.customerName,
      invoiceType : this.selectedRecord.type === 'purchase' ?  'Purchase Invoice' : 'Return Invoice'
    };
  }

  btnReturnList_Click(): void {
    this.selectedRecord = undefined;
  }

  btnNew_Click(): void {
    this.clearSelectedRecord();
  }

  btnSave_Click(): void {
    this.selectedRecord.totalPrice = this.selectedRecord.totalPrice * -1;
    this.selectedRecord.totalPriceWithTax = this.selectedRecord.totalPriceWithTax * -1;
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
    this.selectedRecord = {primaryKey: undefined, customerCode: '', receiptNo: '', type: '',
    description: '', totalPrice: 0, totalPriceWithTax: 0};
  }

}
