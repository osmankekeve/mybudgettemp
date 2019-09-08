import { Component, OnInit, OnDestroy } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { Observable } from 'rxjs/internal/Observable';
import { CollectionModel } from '../models/collection-model';
import { CollectionService } from '../services/collection.service';
import { CustomerModel } from '../models/customer-model';
import { CustomerService } from '../services/customer.service';
import { AccountTransactionModel } from '../models/account-transaction-model';
import { AccountTransactionService } from '../services/account-transaction-service';
import { AuthenticationService } from '../services/authentication.service';
import { CashDeskModel } from '../models/cash-desk-model';
import { CashDeskService } from '../services/cash-desk.service';

@Component({
  selector: 'app-collection',
  templateUrl: './collection.component.html',
  styleUrls: ['./collection.component.css']
})
export class CollectionComponent implements OnInit, OnDestroy {
  mainList$: Observable<CollectionModel[]>;
  customerList$: Observable<CustomerModel[]>;
  cashDeskList$: Observable<CashDeskModel[]>;
  recordTransactionList$: Observable<AccountTransactionModel[]>;
  selectedRecord: CollectionModel;
  selectedRecordSubItems: {
    customerName: string,
    typeTr: string
  };
  isRecordHasTransacton = false;

  constructor(public authServis: AuthenticationService,
              public service: CollectionService,
              public cdService: CashDeskService,
              public atService: AccountTransactionService,
              public cService: CustomerService, public db: AngularFirestore) { }

  ngOnInit() {
    this.populateList();
    this.customerList$ = this.cService.getAllItems();
    this.cashDeskList$ = this.cdService.getAllItems();
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
    this.selectedRecord = record.data as CollectionModel;
    this.selectedRecordSubItems = {
      customerName : record.customerName,
      typeTr : this.selectedRecord.type
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
        console.log('collection insert');
        const trans = {
          primaryKey: '',
          userPrimaryKey: data.userPrimaryKey,
          receiptNo: data.receiptNo,
          transactionPrimaryKey: newId,
          transactionType: 'collection',
          parentPrimaryKey: data.customerCode,
          parentType: 'customer',
          cashDeskPrimaryKey: data.cashDeskPrimaryKey,
          amount: this.selectedRecord.amount,
          amountType: 'credit',
          insertDate: data.insertDate,
        };
        this.db.collection('tblAccountTransaction').add(trans).then(() => {
          console.log('transaction insert');
          this.selectedRecord = undefined;
        }).catch(err => console.error(err));
      }).catch(err => console.error(err));

    } else {
      this.service.updateItem(this.selectedRecord).then(() => {
        console.log('collection has been updated.');
        this.db.collection<AccountTransactionModel>('tblAccountTransaction',
        ref => ref.where('transactionPrimaryKey', '==', data.primaryKey)).get().subscribe(list => {
          list.forEach((item) => {
            const trans = {
              receiptNo: data.receiptNo,
              cashDeskPrimaryKey: data.cashDeskPrimaryKey,
              amount: data.amount,
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
      console.log('collection has been removed.');
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
    this.selectedRecord = {primaryKey: undefined, customerCode: '-1', receiptNo: '', type: '-1', description: '',
      insertDate: Date.now(), userPrimaryKey: this.authServis.getUid()};
  }

}
