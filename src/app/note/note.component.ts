import {Component, OnInit, OnDestroy, AfterViewInit} from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { AccountTransactionService } from '../services/account-transaction.service';
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
export class NoteComponent implements OnInit {
  mainList: Array<NoteModel>;
  collection: AngularFirestoreCollection<NoteModel>;
  selectedRecord: NoteModel;
  refModel: NoteModel;
  openedPanel: any;
  searchText: '';
  onTransaction = false;

  constructor(public authService: AuthenticationService, public service: NoteService, public atService: AccountTransactionService,
              public infoService: InformationService, public excelService: ExcelService, public db: AngularFirestore) { }

  ngOnInit() {
    this.populateList();
    this.selectedRecord = undefined;
  }

  populateList(): void {
    this.mainList = undefined;
    this.service.getMainItems().subscribe(list => {
      if (this.mainList === undefined) { this.mainList = []; }
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
    setTimeout (() => {
      if (this.mainList === undefined) {
        this.mainList = [];
      }
    }, 1000);
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

  async btnSave_Click(): Promise<void> {
    if (this.selectedRecord.note === '') {
      this.infoService.error('Lütfen not giriniz.');
    } else {
      this.onTransaction = true;
      if (this.selectedRecord.primaryKey === null) {
        this.selectedRecord.primaryKey = '';
        await this.service.addItem(this.selectedRecord).then(() => {
          this.infoService.success('Hatırlatma başarıyla kaydedildi.');
        }).catch(err => this.infoService.error(err)).finally(() => {
          this.finishRecordProcess();
        });
      } else {
        await this.service.updateItem(this.selectedRecord).then(() => {
          this.infoService.success('Hatırlatma başarıyla güncellendi.');
        }).catch(err => this.infoService.error(err)).finally(() => {
          this.finishRecordProcess();
        });
      }
    }
  }

  async btnRemove_Click(): Promise<void> {
    await this.service.removeItem(this.selectedRecord).then(() => {
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
    this.selectedRecord = this.service.clearMainModel();
  }

  finishRecordProcess(): void {
    this.clearSelectedRecord();
    this.selectedRecord = undefined;
    this.onTransaction = false;
  }

}
