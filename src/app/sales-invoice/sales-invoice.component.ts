import { Component, OnInit, OnDestroy } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Observable } from 'rxjs/internal/Observable';
import { SalesInvoiceModel } from '../models/sales-invoice-model';
import { SalesInvoiceService } from '../services/sales-invoice.service';
import { CustomerModel } from '../models/customer-model';
import { AuthenticationService } from '../services/authentication.service';
import { CustomerService } from '../services/customer.service';
import { AccountTransactionService } from '../services/account-transaction-service';
import { AccountTransactionModel } from '../models/account-transaction-model';

@Component({
  selector: 'app-sales-invoice',
  templateUrl: './sales-invoice.component.html',
  styleUrls: ['./sales-invoice.component.css']
})
export class SalesInvoiceComponent implements OnInit, OnDestroy {
  mainList$: Observable<SalesInvoiceModel[]>;
  customerList$: Observable<CustomerModel[]>;
  selectedRecord: SalesInvoiceModel;
  selectedRecordSubItems: {
    customerName: string,
    invoiceType: string
  };
  isRecordHasTransacton = false;

  constructor(public authServis: AuthenticationService,
              public service: SalesInvoiceService,
              public cService: CustomerService,
              public atService: AccountTransactionService,
              public db: AngularFirestore) { }

  ngOnInit() {
    this.populateList();
    this.customerList$ = this.cService.getAllItems();
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
    this.selectedRecordSubItems = {
      customerName : record.customerName,
      invoiceType : this.selectedRecord.type === 'sales' ?  'Sales Invoice' : 'Return Invoice'
    };
    this.atService.getRecordTransactionItems(this.selectedRecord.primaryKey)
    .subscribe(list => {
      if (list.length > 0) {
        this.isRecordHasTransacton = true;

      } else {
        this.isRecordHasTransacton = false;
      }
    });
  }

  btnReturnList_Click(): void {
    this.selectedRecord = undefined;
  }

  btnNew_Click(): void {
    this.clearSelectedRecord();
    console.log(this.selectedRecord);
  }

  btnSave_Click(): void {
    const data = this.selectedRecord;
    if (this.selectedRecord.primaryKey === undefined) {
      const newId = this.db.createId();
      this.selectedRecord.primaryKey = '';

      this.service.setItem(this.selectedRecord, newId).then(() => {
        console.log('invoice insert');
        const trans = {
          primaryKey: '',
          userPrimaryKey: data.userPrimaryKey,
          receiptNo: data.receiptNo,
          transactionPrimaryKey: newId,
          transactionType: 'salesInvoice',
          parentPrimaryKey: data.customerCode,
          parentType: 'customer',
          cashDeskPrimaryKey: '-1',
          amount: this.selectedRecord.type === 'sales' ? data.totalPriceWithTax * -1 : data.totalPriceWithTax,
          amountType: this.selectedRecord.type === 'sales' ? 'debit' : 'credit',
          insertDate: data.insertDate,
        };
        this.db.collection('tblAccountTransaction').add(trans).then(() => {
          console.log('transaction insert');
          this.selectedRecord = undefined;
        }).catch(err => console.error(err));
      }).catch(err => console.error(err));

    } else {
      this.service.updateItem(this.selectedRecord).then(() => {
        console.log('purchase invoice has been updated.');
        this.db.collection<AccountTransactionModel>('tblAccountTransaction',
        ref => ref.where('transactionPrimaryKey', '==', data.primaryKey)).get().subscribe(list => {
          list.forEach((item) => {
            const trans = {
              receiptNo: data.receiptNo,
              amount: this.selectedRecord.type === 'sales' ? data.totalPriceWithTax * -1 : data.totalPriceWithTax,
            };
            this.db.collection('tblAccountTransaction').doc(item.id).update(trans).then(() => {
              this.selectedRecord = undefined;
              console.log('transaction has been updated.');
            }).catch(err => console.error(err));
          });
        });
      }).catch(err => console.error(err));
    }
  }

  btnRemove_Click(): void {
    this.service.removeItem(this.selectedRecord).then(() => {
      console.log('invoice has been removed.');
      this.db.collection<AccountTransactionModel>('tblAccountTransaction',
        ref => ref.where('transactionPrimaryKey', '==', this.selectedRecord.primaryKey)).get().subscribe(list => {
          list.forEach((item) => {
            this.db.collection('tblAccountTransaction').doc(item.id).delete().then(() => {
              this.selectedRecord = undefined;
              console.log('transaction has been removed.');
            }).catch(err => console.error(err));
          });
        });
    }).catch(err => console.error(err));
  }

  clearSelectedRecord(): void {
    this.isRecordHasTransacton = false;
    this.selectedRecord = {primaryKey: undefined, customerCode: '-1', receiptNo: '', type: '',
    description: '', insertDate: Date.now(), userPrimaryKey: this.authServis.getUid()};
  }

}
