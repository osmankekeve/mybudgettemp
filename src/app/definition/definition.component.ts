import {Component, OnDestroy, OnInit} from '@angular/core';
import {AngularFirestore} from '@angular/fire/firestore';
import {AccountTransactionService} from '../services/account-transaction.service';
import {InformationService} from '../services/information.service';
import {AuthenticationService} from '../services/authentication.service';
import {Router} from '@angular/router';
import {DefinitionService} from '../services/definition.service';
import {DefinitionMainModel} from '../models/definition-main-model';
import {GlobalUploadService} from '../services/global-upload.service';
import {ToastService} from '../services/toast.service';
import { InfoModuleComponent } from '../partials/info-module/info-module.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-definition',
  templateUrl: './definition.component.html',
  styleUrls: ['./definition.component.css']
})
export class DefinitionComponent implements OnInit, OnDestroy {
  mainList$: Subscription;
  mainList: Array<DefinitionMainModel>;
  selectedRecord: DefinitionMainModel;
  searchText = '';
  onTransaction = false;
  definitionTypeKey = '';
  module = {
    header: '',
    detailHeader: '',
    newTitle: '',
    isShowKey: false,
    isKeyShowCustom1: false,
    isKeyShowCustom2: false,
    isKeyShowCustom3: false,
    isKeyShowCustomDouble: false,
    isKeyShowCustomBool: false,
    isKeyShowCustom1Tr: '',
    isKeyShowCustom2Tr: '',
    isKeyShowCustom3Tr: '',
    isKeyShowCustomDoubleTr: '',
    isKeyShowCustomBoolTr: ''
  };

  constructor(public authService: AuthenticationService, public service: DefinitionService, public atService: AccountTransactionService,
              public infoService: InformationService, public db: AngularFirestore, public route: Router, protected toastService: ToastService,
              protected modalService: NgbModal ) {
  }

  ngOnInit() {
    this.definitionTypeKey = this.route.url.replace('/', '');
    if (this.definitionTypeKey === 'storage') {
      this.module = {
        header: 'Depo',
        detailHeader: 'Depo',
        newTitle: 'Yeni Depo Oluştur',
        isShowKey: true,
        isKeyShowCustom1: true,
        isKeyShowCustom2: false,
        isKeyShowCustom3: false,
        isKeyShowCustomDouble: false,
        isKeyShowCustomBool: false,
        isKeyShowCustom1Tr: 'Depo Adı',
        isKeyShowCustom2Tr: '',
        isKeyShowCustom3Tr: '',
        isKeyShowCustomDoubleTr: '',
        isKeyShowCustomBoolTr: ''
      };
    } else if (this.definitionTypeKey === 'term') {
      this.module = {
        header: 'Vade',
        detailHeader: 'Vade',
        newTitle: 'Yeni Vade Oluştur',
        isShowKey: true,
        isKeyShowCustom1: true,
        isKeyShowCustom2: false,
        isKeyShowCustom3: false,
        isKeyShowCustomDouble: false,
        isKeyShowCustomBool: false,
        isKeyShowCustom1Tr: 'Vade Adı',
        isKeyShowCustom2Tr: 'Vade Gün Sayıları',
        isKeyShowCustom3Tr: '',
        isKeyShowCustomDoubleTr: '',
        isKeyShowCustomBoolTr: ''
      };
    }  else if (this.definitionTypeKey === 'payment-type') {
      this.module = {
        header: 'Ödeme Tipi',
        detailHeader: 'Ödeme Tipi',
        newTitle: 'Yeni Ödeme Tipi Oluştur',
        isShowKey: true,
        isKeyShowCustom1: true,
        isKeyShowCustom2: false,
        isKeyShowCustom3: false,
        isKeyShowCustomDouble: false,
        isKeyShowCustomBool: false,
        isKeyShowCustom1Tr: 'Ödeme Tipi Adı',
        isKeyShowCustom2Tr: '',
        isKeyShowCustom3Tr: '',
        isKeyShowCustomDoubleTr: '',
        isKeyShowCustomBoolTr: ''
      };
    } else {
      this.module = {
        header: '',
        detailHeader: '',
        newTitle: '',
        isShowKey: false,
        isKeyShowCustom1: false,
        isKeyShowCustom2: false,
        isKeyShowCustom3: false,
        isKeyShowCustomDouble: false,
        isKeyShowCustomBool: false,
        isKeyShowCustom1Tr: '',
        isKeyShowCustom2Tr: '',
        isKeyShowCustom3Tr: '',
        isKeyShowCustomDoubleTr: '',
        isKeyShowCustomBoolTr: ''
      };
    }
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
    this.mainList$ = this.service.getMainItems(this.definitionTypeKey).subscribe(list => {
      if (this.mainList === undefined) {
        this.mainList = [];
      }
      list.forEach((data: any) => {
        const item = data.returnData as DefinitionMainModel;
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
    this.selectedRecord = record as DefinitionMainModel;
  }

  async btnReturnList_Click(): Promise<void> {
    this.selectedRecord = undefined;
    await this.route.navigate([this.definitionTypeKey, {}]);
  }

  async btnNew_Click(): Promise<void> {
    try {
      this.clearSelectedRecord();
    } catch (error) {
      await this.finishProcess(error, null);
    }
  }

  async btnSave_Click(): Promise<void> {
    try {
      this.onTransaction = true;
      this.selectedRecord.data.typeKey = this.definitionTypeKey;
      Promise.all([this.service.checkForSave(this.selectedRecord)])
        .then(async (values: any) => {
          if (this.selectedRecord.data.primaryKey === null) {
            this.selectedRecord.data.primaryKey = this.db.createId();
            await this.service.setItem(this.selectedRecord, this.selectedRecord.data.primaryKey)
              .then(() => {
                this.finishProcess(null, 'Hatırlatma başarıyla kaydedildi.');
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
                this.finishProcess(null, 'Hatırlatma başarıyla güncellendi.');
              })
              .catch((error) => {
                this.finishProcess(error, null);
              })
              .finally(() => {
                this.finishFinally();
              });
          }
        })
        .catch((error) => {
          this.finishProcess(error, null);
        });
    } catch (error) {
      await this.finishProcess(error, null);
    }
  }

  async btnRemove_Click(): Promise<void> {
    try {
      this.onTransaction = true;
      Promise.all([this.service.checkForRemove(this.selectedRecord)])
        .then(async (values: any) => {
          await this.service.removeItem(this.selectedRecord)
            .then(() => {
              this.finishProcess(null, 'Hatırlatma başarıyla kaldırıldı.');
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

  clearSelectedRecord(): void {
    this.selectedRecord = this.service.clearMainModel();
  }

  finishFinally(): void {
    this.clearSelectedRecord();
    this.selectedRecord = undefined;
    this.onTransaction = false;
  }

  async finishProcess(error: any, info: any): Promise<void> {
    // error.message sistem hatası
    // error kontrol hatası
    if (error === null) {
      this.toastService.success(info !== null ? info : 'Belirtilmeyen Bilgi');
      this.clearSelectedRecord();
      this.selectedRecord = undefined;
    } else {
      await this.infoService.error(error.message !== undefined ? error.message : error);
    }
    this.onTransaction = false;
  }

}
