import { Component, OnInit, OnDestroy } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { Observable } from 'rxjs/internal/Observable';
import { PaymentModel } from '../models/payment-model';
import { PaymentService } from '../services/payment.service';
import { CashDeskModel } from '../models/cash-desk-model';
import { CashDeskService } from '../services/cash-desk.service';
import { CustomerModel } from '../models/customer-model';
import { CustomerService } from '../services/customer.service';
import { AuthenticationService } from '../services/authentication.service';
import { AccountTransactionService } from '../services/account-transaction-service';
import { AccountTransactionModel } from '../models/account-transaction-model';
import { InformationService } from '../services/information.service';
import { PaymentMainModel } from '../models/payment-main-model';

@Component({
  selector: 'app-payment',
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.css']
})
export class PaymentComponent implements OnInit, OnDestroy {
  mainList: Array<PaymentModel>;
  mainList1: Array<PaymentModel>;
  mainList2: Array<PaymentModel>;
  mainList3: Array<PaymentModel>;
  mainList4: Array<PaymentModel>;
  cashDeskList$: Observable<CashDeskModel[]>;
  customerList$: Observable<CustomerModel[]>;
  collection: AngularFirestoreCollection<PaymentModel>;
  selectedRecord: PaymentModel;
  refModel: PaymentModel;
  isRecordHasTransacton = false;
  isShowAllRecords = false;

  constructor(public authServis: AuthenticationService,
              public service: PaymentService,
              public cdService: CashDeskService,
              public cService: CustomerService,
              public db: AngularFirestore,
              public infoService: InformationService,
              public atService: AccountTransactionService) { }

  ngOnInit() {
    this.populateList();
    this.selectedRecord = undefined;
    this.customerList$ = this.cService.getAllItems();
    this.cashDeskList$ = this.cdService.getAllItems();
  }

  ngOnDestroy(): void { }

  populateList(): void {
    const date = new Date();
    const start1 = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
    const end1 = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1, 0, 0, 0);
    const start2 = new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1, 0, 0, 0);
    const end2 = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
    const start3 = new Date(date.getFullYear(), date.getMonth(), date.getDate() - 2, 0, 0, 0);
    const end3 = new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1, 0, 0, 0);
    const start4 = new Date(date.getFullYear(), date.getMonth(), date.getDate() - 3, 0, 0, 0);
    const end4 = new Date(date.getFullYear(), date.getMonth(), date.getDate() - 2, 0, 0, 0);

    this.mainList1 = [];
    this.mainList2 = [];
    this.mainList3 = [];
    this.mainList4 = [];
    this.service.getMainItemsBetweenDates(start4, end1).subscribe(list => {
      list.forEach((item: any) => {
        if (item.actionType === 'added') {
          if (item.data.insertDate > start1.getTime() && item.data.insertDate < end1.getTime()) { this.mainList1.push(item); }
          if (item.data.insertDate > start2.getTime() && item.data.insertDate < end2.getTime()) { this.mainList2.push(item); }
          if (item.data.insertDate > start3.getTime() && item.data.insertDate < end3.getTime()) { this.mainList3.push(item); }
          if (item.data.insertDate > start4.getTime() && item.data.insertDate < end4.getTime()) { this.mainList4.push(item); }
        } else if (item.actionType === 'removed') {
          if (item.data.insertDate > start1.getTime() && item.data.insertDate < end1.getTime()) {
            this.mainList1.splice(this.mainList1.indexOf(this.refModel), 1);
          }
          if (item.data.insertDate > start2.getTime() && item.data.insertDate < end2.getTime()) {
            this.mainList2.splice(this.mainList2.indexOf(this.refModel), 1);
           }
          if (item.data.insertDate > start3.getTime() && item.data.insertDate < end3.getTime()) {
            this.mainList3.splice(this.mainList3.indexOf(this.refModel), 1);
          }
          if (item.data.insertDate > start4.getTime() && item.data.insertDate < end4.getTime()) {
            this.mainList4.splice(this.mainList4.indexOf(this.refModel), 1);
          }
        } else if (item.actionType === 'modified') {
          if (item.data.insertDate > start1.getTime() && item.data.insertDate < end1.getTime()) {
            this.mainList1[this.mainList1.indexOf(this.refModel)] = item.data;
          }
          if (item.data.insertDate > start2.getTime() && item.data.insertDate < end2.getTime()) {
            this.mainList2[this.mainList2.indexOf(this.refModel)] = item.data;
           }
          if (item.data.insertDate > start3.getTime() && item.data.insertDate < end3.getTime()) {
            this.mainList3[this.mainList3.indexOf(this.refModel)] = item.data;
          }
          if (item.data.insertDate > start4.getTime() && item.data.insertDate < end4.getTime()) {
            this.mainList4[this.mainList4.indexOf(this.refModel)] = item.data;
          }
        } else {
          // nothing
        }
      });
    });
  }

  populateAllRecords(): void {
    this.mainList = [];
    this.service.getMainItems().subscribe(list => {
      list.forEach((item: any) => {
        if (item.actionType === 'added') {
          this.mainList.push(item);
        } else if (item.actionType === 'removed') {
          this.mainList.splice(this.mainList.indexOf(this.refModel), 1);
        } else if (item.actionType === 'modified') {
          this.mainList[this.mainList.indexOf(this.refModel)] = item.data;
        } else {
          // nothing
        }
      });
    });
  }

  showSelectedRecord(record: any): void {
    this.selectedRecord = record.data as PaymentModel;
    this.refModel = record.data as PaymentModel;
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
    if (data.amount <= 0) {
      this.infoService.error('Tutar sıfırdan büyük olmalıdır.');
    } else {
      if (this.selectedRecord.primaryKey === undefined) {
        const newId = this.db.createId();
        this.selectedRecord.primaryKey = '';

        this.service.setItem(this.selectedRecord, newId).then(() => {
          const trans = {
            primaryKey: '',
            userPrimaryKey: data.userPrimaryKey,
            receiptNo: data.receiptNo,
            transactionPrimaryKey: newId,
            transactionType: 'payment',
            parentPrimaryKey: data.customerCode,
            parentType: 'customer',
            cashDeskPrimaryKey: data.cashDeskPrimaryKey,
            amount: data.amount * -1,
            amountType: 'debit',
            insertDate: data.insertDate,
          };
          this.db.collection('tblAccountTransaction').add(trans).then(() => {
            this.infoService.success('Ödeme başarıyla kaydedildi.');
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
                cashDeskPrimaryKey: data.cashDeskPrimaryKey,
                amount: data.amount * -1,
              };
              this.db.collection('tblAccountTransaction').doc(item.id).update(trans).then(() => {
                this.infoService.success('Ödeme başarıyla güncellendi.');
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
              this.infoService.success('Ödeme başarıyla kaldırıldı.');
              this.selectedRecord = undefined;
            }).catch(err => this.infoService.error(err));
          });
        });
    }).catch(err => this.infoService.error(err));
  }

  btnAllRecords_Click(): void {
    if (this.isShowAllRecords) {
      this.isShowAllRecords = false;
    } else {
      this.isShowAllRecords = true;
      this.populateAllRecords();
    }
  }

  clearSelectedRecord(): void {
    this.refModel = undefined;
    this.isRecordHasTransacton = false;
    this.selectedRecord = {primaryKey: undefined, customerCode: '', cashDeskPrimaryKey: '', receiptNo: '',
    type: '', description: '', insertDate: Date.now(), userPrimaryKey: this.authServis.getUid()};
  }

}
