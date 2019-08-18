import { Component, OnInit, OnDestroy } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { Observable } from 'rxjs/internal/Observable';
import { SalesInvoiceModel } from '../models/sales-invoice-model';
import { SalesInvoiceService } from '../services/sales-invoice.service';

@Component({
  selector: 'app-sales-invoice',
  templateUrl: './sales-invoice.component.html',
  styleUrls: ['./sales-invoice.component.css']
})
export class SalesInvoiceComponent implements OnInit, OnDestroy {
  mainList$: Observable<SalesInvoiceModel[]>;
  collection: AngularFirestoreCollection<SalesInvoiceModel>;
  selectedRecord: SalesInvoiceModel;
  selectedRecordSubItems: {
    customerName: string,
    invoiceType: string
  };

  constructor(public service: SalesInvoiceService, public db: AngularFirestore) { }

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
    this.selectedRecord = record.data as SalesInvoiceModel;
    this.selectedRecord.totalPrice = Math.abs(this.selectedRecord.totalPrice);
    this.selectedRecord.totalPriceWithTax = Math.abs(this.selectedRecord.totalPriceWithTax);
    this.selectedRecordSubItems = {
      customerName : record.customerName,
      invoiceType : this.selectedRecord.type === 'sales' ?  'Sales Invoice' : 'Return Invoice'
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
