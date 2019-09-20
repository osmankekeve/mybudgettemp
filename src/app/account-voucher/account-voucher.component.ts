import { Component, OnInit, OnDestroy } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Observable } from 'rxjs/internal/Observable';
import { CustomerModel } from '../models/customer-model';
import { CustomerService } from '../services/customer.service';
import { AccountTransactionModel } from '../models/account-transaction-model';
import { AccountTransactionService } from '../services/account-transaction-service';
import { AuthenticationService } from '../services/authentication.service';
import { CashDeskModel } from '../models/cash-desk-model';
import { CashDeskService } from '../services/cash-desk.service';
import { InformationService } from '../services/information.service';
import { AccountVoucherModel } from '../models/account-voucher-model';
import { AccountVoucherService } from '../services/account-voucher.service';

@Component({
  selector: 'app-account-voucher',
  templateUrl: './account-voucher.component.html',
  styleUrls: ['./account-voucher.component.css']
})
export class AccountVoucherComponent implements OnInit, OnDestroy {
  mainList: Array<AccountVoucherModel>;
  filteredMainList: Array<AccountVoucherModel>;
  customerList$: Observable<CustomerModel[]>;
  cashDeskList$: Observable<CashDeskModel[]>;
  recordTransactionList$: Observable<AccountTransactionModel[]>;
  selectedRecord: AccountVoucherModel;
  refModel: AccountVoucherModel;
  selectedRecordSubItems: {
    customerName: string,
    typeTr: string
  };
  isRecordHasTransacton = false;

  constructor(public authServis: AuthenticationService,
              public service: AccountVoucherService,
              public cdService: CashDeskService,
              public atService: AccountTransactionService,
              public infoService: InformationService,
              public cService: CustomerService, public db: AngularFirestore) { }

  ngOnInit() {
    this.populateList();
    this.customerList$ = this.cService.getAllItems();
    this.cashDeskList$ = this.cdService.getAllItems();
    this.selectedRecord = undefined;
  }

  ngOnDestroy(): void {
  }

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
    this.selectedRecord = record.data as AccountVoucherModel;
    this.refModel = record.data as AccountVoucherModel;
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
    if (this.selectedRecord.amount <= 0) {
      this.infoService.error('Tutar sıfırdan büyük olmalıdır.');
    } else {
      if (this.selectedRecord.primaryKey === undefined) {
        const newId = this.db.createId();
        this.selectedRecord.primaryKey = '';

        this.service.setItem(this.selectedRecord, newId).then(() => {
          const trans = {
            primaryKey: '',
            userPrimaryKey: this.selectedRecord.userPrimaryKey,
            receiptNo: this.selectedRecord.receiptNo,
            transactionPrimaryKey: newId,
            transactionType: 'accountVoucher',
            parentPrimaryKey: this.selectedRecord.customerCode,
            parentType: 'customer',
            cashDeskPrimaryKey: this.selectedRecord.cashDeskPrimaryKey,
            amount: this.selectedRecord.type === 'creditVoucher' ? this.selectedRecord.amount : this.selectedRecord.amount * -1,
            amountType: this.selectedRecord.type === 'creditVoucher' ? 'credit' : 'debit',
            insertDate: this.selectedRecord.insertDate,
          };
          this.db.collection('tblAccountTransaction').add(trans).then(() => {
            this.infoService.success('Fiş başarıyla kaydedildi.');
            this.selectedRecord = undefined;
          }).catch(err => this.infoService.error(err));
        }).catch(err => this.infoService.error(err));

      } else {
        this.service.updateItem(this.selectedRecord).then(() => {
          this.db.collection<AccountTransactionModel>('tblAccountTransaction',
          ref => ref.where('transactionPrimaryKey', '==', this.selectedRecord.primaryKey)).get().subscribe(list => {
            list.forEach((item) => {
              this.db.collection('tblAccountTransaction').doc(item.id).update({
                receiptNo: this.selectedRecord.receiptNo,
                cashDeskPrimaryKey: this.selectedRecord.cashDeskPrimaryKey,
                amount: this.selectedRecord.type === 'creditVoucher' ? this.selectedRecord.amount : this.selectedRecord.amount * -1,
              }).then(() => {
                this.infoService.success('Fiş başarıyla güncellendi.');
                this.selectedRecord = undefined;
              }).catch(err => this.infoService.error(err));

            });
          });
        }).catch(err => this.infoService.error(err));
      }
    }
  }

  btnRemove_Click(): void {
    this.service.removeItem(this.selectedRecord).then(() => {
      this.db.collection<AccountTransactionModel>('tblAccountTransaction',
        ref => ref.where('transactionPrimaryKey', '==', this.selectedRecord.primaryKey)).get().subscribe(list => {
          list.forEach((item) => {
            this.db.collection('tblAccountTransaction').doc(item.id).delete().then(() => {
              this.infoService.success('Fiş başarıyla kaldırıldı.');
              this.selectedRecord = undefined;
            }).catch(err => this.infoService.error(err));
          });
        });
    }).catch(err => this.infoService.error(err));
  }

  clearSelectedRecord(): void {
    this.isRecordHasTransacton = false;
    this.refModel = undefined;
    this.selectedRecord = {primaryKey: undefined, customerCode: '-1', receiptNo: '', type: '-1', description: '',
      insertDate: Date.now(), userPrimaryKey: this.authServis.getUid()};
  }

}
