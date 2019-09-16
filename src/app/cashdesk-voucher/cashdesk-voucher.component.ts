import { Component, OnInit, OnDestroy } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Observable } from 'rxjs/internal/Observable';
import { CustomerService } from '../services/customer.service';
import { AccountTransactionModel } from '../models/account-transaction-model';
import { AccountTransactionService } from '../services/account-transaction-service';
import { AuthenticationService } from '../services/authentication.service';
import { CashDeskModel } from '../models/cash-desk-model';
import { CashDeskService } from '../services/cash-desk.service';
import { InformationService } from '../services/information.service';
import { CashdeskVoucherModel } from '../models/cashdesk-voucher-model';
import { CashdeskVoucherService } from '../services/cashdesk-voucher.service';

@Component({
  selector: 'app-cashdesk-voucher',
  templateUrl: './cashdesk-voucher.component.html',
  styleUrls: ['./cashdesk-voucher.component.css']
})
export class CashdeskVoucherComponent implements OnInit, OnDestroy {
  mainList: Array<CashdeskVoucherModel>;
  cashDeskList$: Observable<CashDeskModel[]>;
  recordTransactionList$: Observable<AccountTransactionModel[]>;
  selectedRecord: CashdeskVoucherModel;
  refModel: CashdeskVoucherModel;
  isRecordHasTransacton = false;

  constructor(public authServis: AuthenticationService,
              public service: CashdeskVoucherService,
              public cdService: CashDeskService,
              public atService: AccountTransactionService,
              public infoService: InformationService,
              public cService: CustomerService, public db: AngularFirestore) { }

  ngOnInit() {
    this.populateList();
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
    this.selectedRecord = record.data as CashdeskVoucherModel;
    this.refModel = record.data as CashdeskVoucherModel;
    if (this.selectedRecord.type === 'open') { this.selectedRecord.secondCashDeskPrimaryKey = '-1'; }
    console.log(record);
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
          this.db.collection('tblAccountTransaction').add({
            primaryKey: '',
            userPrimaryKey: this.selectedRecord.userPrimaryKey,
            parentPrimaryKey: this.selectedRecord.firstCashDeskPrimaryKey,
            parentType: 'cashDesk',
            transactionPrimaryKey: newId,
            transactionType: 'cashDeskVoucher',
            amountType: this.selectedRecord.transactionType,
            amount: this.selectedRecord.transactionType === 'credit' ? this.selectedRecord.amount : this.selectedRecord.amount * -1,
            cashDeskPrimaryKey: this.selectedRecord.type === 'open' ? '-1' : this.selectedRecord.secondCashDeskPrimaryKey,
            receiptNo: this.selectedRecord.receiptNo,
            insertDate: this.selectedRecord.insertDate
          }).then(() => {
            if (this.selectedRecord.type === 'transfer') {
              this.db.collection('tblAccountTransaction').add({
                primaryKey: '',
                userPrimaryKey: this.selectedRecord.userPrimaryKey,
                parentPrimaryKey: this.selectedRecord.secondCashDeskPrimaryKey,
                parentType: 'cashDesk',
                transactionPrimaryKey: newId,
                transactionType: 'cashDeskVoucher',
                amountType: this.selectedRecord.transactionType,
                amount: this.selectedRecord.transactionType === 'debit' ? this.selectedRecord.amount : this.selectedRecord.amount * -1,
                cashDeskPrimaryKey: this.selectedRecord.firstCashDeskPrimaryKey,
                receiptNo: this.selectedRecord.receiptNo,
                insertDate: this.selectedRecord.insertDate
              }).then(() => {
                this.infoService.success('Fiş başarıyla kaydedildi.');
                this.selectedRecord = undefined;
              }).catch(err => this.infoService.error(err));
            } else {
              this.infoService.success('Fiş başarıyla kaydedildi.');
              this.selectedRecord = undefined;
            }
          }).catch(err => this.infoService.error(err));
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
    this.selectedRecord = {primaryKey: undefined, firstCashDeskPrimaryKey: '-1', secondCashDeskPrimaryKey: '',
    receiptNo: '', type: '-1', description: '', insertDate: Date.now(), userPrimaryKey: this.authServis.getUid()};
  }

  onChangeVoucherType(record: any): void {
    if (record === 'open') { this.selectedRecord.secondCashDeskPrimaryKey = '-1'; }
  }
}
