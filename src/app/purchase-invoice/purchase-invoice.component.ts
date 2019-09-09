import { Component, OnInit, OnDestroy } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { Observable } from 'rxjs/internal/Observable';
import { PurchaseInvoiceService } from '../services/purchase-invoice.service';
import { PurchaseInvoiceModel } from '../models/purchase-invoice-model';
import { CustomerModel } from '../models/customer-model';
import { CustomerService } from '../services/customer.service';
import { AuthenticationService } from '../services/authentication.service';
import { AccountTransactionModel } from '../models/account-transaction-model';
import { AccountTransactionService } from '../services/account-transaction-service';
import { InformationService } from '../services/information.service';

@Component({
  selector: 'app-purchase-invoice',
  templateUrl: './purchase-invoice.component.html',
  styleUrls: ['./purchase-invoice.component.css']
})
export class PurchaseInvoiceComponent implements OnInit, OnDestroy {
  mainList$: Observable<PurchaseInvoiceModel[]>;
  customerList$: Observable<CustomerModel[]>;
  selectedRecord: PurchaseInvoiceModel;
  selectedRecordSubItems: {
    customerName: string,
    invoiceType: string
  };
  isRecordHasTransacton = false;

  constructor(public authServis: AuthenticationService,
              public service: PurchaseInvoiceService,
              public cService: CustomerService,
              public atService: AccountTransactionService,
              public infoService: InformationService,
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
    this.selectedRecord = record.data as PurchaseInvoiceModel;
    this.selectedRecord.totalPrice = Math.abs(this.selectedRecord.totalPrice);
    this.selectedRecord.totalPriceWithTax = Math.abs(this.selectedRecord.totalPriceWithTax);
    this.selectedRecordSubItems = {
      customerName : record.customerName,
      invoiceType : this.selectedRecord.type === 'purchase' ?  'Purchase Invoice' : 'Return Invoice'
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
  }

  btnSave_Click(): void {
    const data = this.selectedRecord;
    if (this.selectedRecord.primaryKey === undefined) {
      const newId = this.db.createId();
      this.selectedRecord.primaryKey = '';
      this.service.setItem(this.selectedRecord, newId).then(() => {
        const trans = {
          primaryKey: '',
          userPrimaryKey: data.userPrimaryKey,
          receiptNo: data.receiptNo,
          transactionPrimaryKey: newId,
          transactionType: 'purchaseInvoice',
          parentPrimaryKey: data.customerCode,
          parentType: 'customer',
          cashDeskPrimaryKey: '-1',
          amount: this.selectedRecord.type === 'purchase' ? data.totalPriceWithTax : data.totalPriceWithTax * -1,
          amountType: this.selectedRecord.type === 'purchase' ? 'credit' : 'debit',
          insertDate: data.insertDate,
        };
        this.db.collection('tblAccountTransaction').add(trans).then(() => {
          this.infoService.success('Fatura başarıyla kaydedildi.');
          this.selectedRecord = undefined;
        }).catch(err => this.infoService.error(err));
      }).catch(err => this.infoService.error(err));

    } else {
      this.service.updateItem(this.selectedRecord).then(() => {
        this.db.collection<AccountTransactionModel>('tblAccountTransaction',
        ref => ref.where('transactionPrimaryKey', '==', data.primaryKey)).get().subscribe(list => {
          list.forEach((item) => {
            const trans = {
              receiptNo: data.receiptNo,
              amount: this.selectedRecord.type === 'purchase' ? data.totalPriceWithTax : data.totalPriceWithTax * -1,
            };
            this.db.collection('tblAccountTransaction').doc(item.id).update(trans).then(() => {
              this.infoService.success('Fatura başarıyla güncellendi.');
              this.selectedRecord = undefined;
            }).catch(err => this.infoService.error(err));
          });
        });
      }).catch(err => this.infoService.error(err));
    }
  }

  btnRemove_Click(): void {
    this.service.removeItem(this.selectedRecord).then(() => {
      this.db.collection<AccountTransactionModel>('tblAccountTransaction',
        ref => ref.where('transactionPrimaryKey', '==', this.selectedRecord.primaryKey)).get().subscribe(list => {
          list.forEach((item) => {
            this.db.collection('tblAccountTransaction').doc(item.id).delete().then(() => {
              this.infoService.success('Fatura başarıyla kaldırıldı.');
              this.selectedRecord = undefined;
            }).catch(err => this.infoService.error(err));
          });
        });
    }).catch(err => this.infoService.error(err));
  }

  clearSelectedRecord(): void {
    this.isRecordHasTransacton = false;
    this.selectedRecord = {primaryKey: undefined, customerCode: '', receiptNo: '', type: '-1',
    description: '', insertDate: Date.now(), userPrimaryKey: this.authServis.getUid()};
  }

}
