import { Component, OnInit, OnDestroy } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { Observable } from 'rxjs/internal/Observable';
import { AccountTransactionModel } from '../models/account-transaction-model';
import { AccountTransactionService } from '../services/account-transaction-service';
import { InformationService } from '../services/information.service';
import { AuthenticationService } from '../services/authentication.service';
import { NoteModel } from '../models/note-model';
import { NoteService } from '../services/note.service';
import { ExcelService } from '../services/excel-service';

@Component({
  selector: 'app-note',
  templateUrl: './note.component.html',
  styleUrls: ['./note.component.css']
})
export class NoteComponent implements OnInit, OnDestroy {
  mainList: Array<NoteModel>;
  collection: AngularFirestoreCollection<NoteModel>;
  transactionList$: Observable<AccountTransactionModel[]>;
  selectedRecord: NoteModel;
  refModel: NoteModel;
  openedPanel: any;

  constructor(public authServis: AuthenticationService, public service: NoteService,
              public atService: AccountTransactionService,
              public infoService: InformationService,
              public excelService: ExcelService,
              public db: AngularFirestore) { }

  ngOnInit() {
    this.populateList();
    this.selectedRecord = undefined;
  }

  ngOnDestroy(): void { }

  populateList(): void {
    this.mainList = [];
    this.service.getMainItems().subscribe(list => {
      console.log(list);
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
    this.openedPanel = 'mainPanel';
    this.selectedRecord = record.data as NoteModel;
    this.refModel = record.data as NoteModel;
  }

  btnReturnList_Click(): void {
    if (this.openedPanel === 'mainPanel') {
      this.selectedRecord = undefined;
    } else {
      this.openedPanel = 'mainPanel';
    }
  }

  btnNew_Click(): void {
    this.clearSelectedRecord();
  }

  btnSave_Click(): void {
    if (this.selectedRecord.primaryKey === undefined) {
      this.selectedRecord.primaryKey = '';
      this.service.addItem(this.selectedRecord)
      .then(() => {
        this.infoService.success('Hatırlatma başarıyla kaydedildi.');
        this.selectedRecord = undefined;
      }).catch(err => this.infoService.error(err));
    } else {
      this.service.updateItem(this.selectedRecord)
      .then(() => {
        this.infoService.success('Hatırlatma başarıyla güncellendi.');
        this.selectedRecord = undefined;
      }).catch(err => this.infoService.error(err));
    }
  }

  btnRemove_Click(): void {
    this.service.removeItem(this.selectedRecord)
    .then(() => {
      this.infoService.success('Hatırlatma başarıyla kaldırıldı.');
      this.selectedRecord = undefined;
    }).catch(err => this.infoService.error(err));
  }

  btnExportToExcel_Click(): void {
    if (this.mainList.length > 0) {
      this.excelService.exportToExcel(this.mainList, 'note');
    } else {
      this.infoService.error('Aktarılacak kayıt bulunamadı.');
    }
  }

  clearSelectedRecord(): void {
    this.openedPanel = 'mainPanel';
    this.refModel = undefined;
    this.selectedRecord = {primaryKey: undefined, userPrimaryKey: this.authServis.getUid(), insertDate: Date.now()};
  }

}
