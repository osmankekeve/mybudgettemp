import { Component, OnInit, OnDestroy } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { InformationService } from '../services/information.service';
import { AuthenticationService } from '../services/authentication.service';
import { ProfileModel } from '../models/profile-model';
import { ProfileService } from '../services/profile.service';
import { getDateForInput, getInputDataForInsert, getTodayForInput } from '../core/correct-library';
import { ProfileMainModel } from '../models/profile-main-model';

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.css']
})
export class UserComponent implements OnInit, OnDestroy {
  mainList: Array<ProfileMainModel> = [];
  selectedRecord: ProfileMainModel;
  refModel: ProfileMainModel;
  birthDate: any;

  constructor(public authServis: AuthenticationService,
              public infoService: InformationService,
              public service: ProfileService,
              public db: AngularFirestore) { }

  async ngOnInit() {
    this.populateList();
    this.selectedRecord = undefined;
  }

  ngOnDestroy(): void { }

  populateList(): void {
    this.mainList = [];
    this.service.getMainItems().subscribe(list => {
      list.forEach((data: any) => {
        const item = data.returnData as ProfileMainModel;
        if (item.actionType === 'added') {
          this.mainList.push(item);
        } else if (item.actionType === 'removed') {
          this.mainList.splice(this.mainList.indexOf(this.refModel), 1);
        } else if (item.actionType === 'modified') {
          this.mainList[this.mainList.indexOf(this.refModel)] = item;
        } else {
          // nothing
        }
      });
    });
  }

  showSelectedRecord(record: any): void {
    this.selectedRecord = record as ProfileMainModel;
    this.refModel = record as ProfileMainModel;
    this.birthDate = getDateForInput(this.selectedRecord.data.birthDate);
  }

  btnReturnList_Click(): void {
    this.selectedRecord = undefined;
  }

  btnSave_Click(): void {
    if (this.selectedRecord.data.primaryKey === null) {
      this.selectedRecord.data.primaryKey = '';
      this.selectedRecord.data.birthDate = getInputDataForInsert(this.birthDate);
      this.service.addItem(this.selectedRecord)
      .then(() => {
        this.infoService.success('Kullanıcı başarıyla kaydedildi.');
        this.selectedRecord = undefined;
      }).catch(err => this.infoService.error(err));
    } else {
      this.service.updateItem(this.selectedRecord)
      .then(() => {
        this.infoService.success('Kullanıcı başarıyla güncellendi.');
        this.selectedRecord = undefined;
      }).catch(err => this.infoService.error(err));
    }
  }

  btnRemove_Click(): void {
    this.service.removeItem(this.selectedRecord)
    .then(() => {
      this.infoService.success('Kullanıcı başarıyla kaldırıldı.');
      this.selectedRecord = undefined;
    }).catch(err => this.infoService.error(err));
  }

  btnNew_Click(): void {
    this.clearSelectedRecord();
  }

  clearSelectedRecord(): void {
    this.refModel = undefined;
    this.birthDate = getTodayForInput();
    this.selectedRecord = this.service.clearProfileMainModel();
  }

}
