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
  cashDeskList$: Observable<CashDeskModel[]>;
  customerList$: Observable<CustomerModel[]>;
  collection: AngularFirestoreCollection<PaymentModel>;
  selectedRecord: PaymentModel;
  refModel: PaymentModel;
  isRecordHasTransacton = false;

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
    this.mainList = [];
    this.service.getMainItems().subscribe(list => {
      list.forEach((item: any) => {
        if (item.actionType === 'added') {
          this.mainList.push(item);
        } else if (item.actionType === 'removed') {
          this.mainList.splice(this.mainList.indexOf(this.refModel), 1);
        } else if (item.returnData.actionType === 'modified') {
          this.mainList[this.mainList.indexOf(this.refModel)] = item.returnData;
        } else {
          // nothing
        }
      });
    });
  }

  showSelectedRecord(record: any): void {
    this.selectedRecord = record.returnData as PaymentModel;
    this.refModel = record.returnData as PaymentModel;
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
      this.db.collection('tblPayment').doc(newId).set(this.selectedRecord).then(() => {
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

  clearSelectedRecord(): void {
    this.refModel = undefined;
    this.isRecordHasTransacton = false;
    this.selectedRecord = {primaryKey: undefined, customerCode: '', cashDeskPrimaryKey: '', receiptNo: '',
    type: '', description: '', insertDate: Date.now(), userPrimaryKey: this.authServis.getUid()};
  }

}
