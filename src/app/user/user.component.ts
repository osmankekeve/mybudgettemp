import {Component, OnInit, OnDestroy} from '@angular/core';
import {AngularFirestore} from '@angular/fire/firestore';
import {InformationService} from '../services/information.service';
import {ProfileService} from '../services/profile.service';
import {getDateForInput, getInputDataForInsert, getTodayForInput} from '../core/correct-library';
import {ProfileMainModel} from '../models/profile-main-model';
import {ActivatedRoute, Router} from '@angular/router';
import {AuthenticationService} from '../services/authentication.service';
import {InfoModuleComponent} from '../partials/info-module/info-module.component';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import { ExcelService } from '../services/excel-service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.css']
})
export class UserComponent implements OnInit, OnDestroy {
  mainList$: Subscription;
  mainList: Array<ProfileMainModel> = [];
  selectedRecord: ProfileMainModel;
  birthDate: any;
  searchText: '';
  onTransaction = false;
  employeeDetail: any;

  constructor(protected authService: AuthenticationService, protected infoService: InformationService, protected service: ProfileService,
              protected db: AngularFirestore, protected route: Router, protected router: ActivatedRoute, protected modalService: NgbModal,
              protected excelService: ExcelService) {
  }

  async ngOnInit() {
    this.employeeDetail = this.authService.isEmployeeLoggedIn();
    this.populateList();
    this.selectedRecord = undefined;
  }

  ngOnDestroy() {
    if (this.mainList$ !== undefined) {
      this.mainList$.unsubscribe();
    }
  }

  populateList(): void {
    this.mainList = undefined;
    this.mainList$ = this.service.getMainItems().subscribe(list => {
      if (this.mainList === undefined) {
        this.mainList = [];
      }
      list.forEach((data: any) => {
        const item = data.returnData as ProfileMainModel;

        if (item.actionType === 'added') {
          this.mainList.push(item);
        }
        if (item.actionType === 'removed') {
          for (let i = 0; i < this.mainList.length; i++) {
            if (item.data.primaryKey === this.mainList[i].data.primaryKey) {
              this.mainList.splice(i, 1);
              break;
            }
          }
        }
        if (item.actionType === 'modified') {
          for (let i = 0; i < this.mainList.length; i++) {
            if (item.data.primaryKey === this.mainList[i].data.primaryKey) {
              this.mainList[i] = item;
              break;
            }
          }
        }
      });
    });
    setTimeout(() => {
      if (this.mainList === undefined) {
        this.mainList = [];
      }
    }, 1000);
  }

  showSelectedRecord(record: any): void {
    this.selectedRecord = record as ProfileMainModel;
    this.birthDate = getDateForInput(this.selectedRecord.data.birthDate);
  }

  async btnReturnList_Click(): Promise<void> {
    try {
      this.finishFinally();
      await this.route.navigate(['user', {}]);
    } catch (error) {
      this.finishProcess(error, null);
    }
  }

  btnNew_Click(): void {
    try {
      this.clearSelectedRecord();
    } catch (error) {
      this.finishProcess(error, null);
    }
  }

  async btnSave_Click(): Promise<void> {
    try {
      this.onTransaction = true;
      if (this.selectedRecord.data.primaryKey === null) {
        this.selectedRecord.data.primaryKey = '';
        this.selectedRecord.data.birthDate = getInputDataForInsert(this.birthDate);
        await this.service.addItem(this.selectedRecord)
          .then(() => {
            this.finishProcess(null, 'Kullanıcı başarıyla kaydedildi.');
          })
          .catch((error) => {
            this.finishProcess(error, null);
          })
          .finally(() => {
            this.finishFinally();
          });
      } else {
        await this.service.updateItem(this.selectedRecord)
          .then(() => {
            this.finishProcess(null, 'Kullanıcı başarıyla güncellendi.');
          })
          .catch((error) => {
            this.finishProcess(error, null);
          })
          .finally(() => {
            this.finishFinally();
          });
      }
    } catch (error) {
      this.finishProcess(error, null);
    }
  }

  async btnRemove_Click(): Promise<void> {
    try {
      this.onTransaction = true;
      Promise.all([this.service.checkForRemove(this.selectedRecord)])
        .then(async (values: any) => {
          await this.service.removeItem(this.selectedRecord)
            .then(() => {
              this.finishProcess(null, 'Kullanıcı başarıyla kaldırıldı.');
            })
            .catch((error) => {
              this.finishProcess(error, null);
            })
            .finally(() => {
              this.finishFinally();
            });
        })
        .catch((error) => {
          this.finishProcess(error, null);
        });
    } catch (error) {
    this.finishProcess(error, null);
  }
}

  async btnShowJsonData_Click(): Promise<void> {
    try {
      await this.infoService.showJsonData(JSON.stringify(this.selectedRecord, null, 2));
    } catch (error) {
      await this.infoService.error(error);
    }
  }

  async btnShowInfoModule_Click(): Promise<void> {
    try {
      this.modalService.open(InfoModuleComponent, {size: 'lg'});
    } catch (error) {
      await this.infoService.error(error);
    }
  }

  btnExportToExcel_Click(): void {
    if (this.mainList.length > 0) {
      this.excelService.exportToExcel(this.mainList, 'users');
    } else {
      this.infoService.error('Aktarılacak kayıt bulunamadı.');
    }
  }

  clearSelectedRecord(): void {
    this.birthDate = getTodayForInput();
    this.selectedRecord = this.service.clearProfileMainModel();
  }

  finishFinally(): void {
    this.clearSelectedRecord();
    this.selectedRecord = undefined;
    this.onTransaction = false;
  }

  finishProcess(error: any, info: any): void {
    // error.message sistem hatası
    // error kontrol hatası
    if (error === null) {
      this.infoService.success(info !== null ? info : 'Belirtilmeyen Bilgi');
      this.clearSelectedRecord();
      this.selectedRecord = undefined;
    } else {
      this.infoService.error(error.message !== undefined ? error.message : error);
    }
    this.onTransaction = false;
  }

}
