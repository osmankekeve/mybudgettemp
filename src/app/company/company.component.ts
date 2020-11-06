import {Component, OnInit, OnDestroy} from '@angular/core';
import {AngularFirestore, AngularFirestoreCollection} from '@angular/fire/firestore';
import {InformationService} from '../services/information.service';
import {AuthenticationService} from '../services/authentication.service';
import {
  currencyFormat, getDateForInput,
  getEncryptionKey,
  getFloat, getInputDataForInsert, getTodayForInput,
  moneyFormat
} from '../core/correct-library';
import {ExcelService} from '../services/excel-service';
import {Router, ActivatedRoute} from '@angular/router';
import {GlobalService} from '../services/global.service';
import * as CryptoJS from 'crypto-js';
import {ProductMainModel} from '../models/product-main-model';
import {ProductModel} from '../models/product-model';
import {ProductService} from '../services/product.service';
import {ActionMainModel} from '../models/action-main-model';
import {ActionService} from '../services/action.service';
import {FileUploadService} from '../services/file-upload.service';
import {GlobalUploadService} from '../services/global-upload.service';
import {FileMainModel} from '../models/file-main-model';
import {ProductUnitService} from '../services/product-unit.service';
import {ProductUnitModel} from '../models/product-unit-model';
import {SettingService} from '../services/setting.service';
import {ProductUnitMappingService} from '../services/product-unit-mapping.service';
import {ProductUnitMappingMainModel} from '../models/product-unit-mapping-main-model';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {ExcelImportComponent} from '../partials/excel-import/excel-import.component';
import {InfoModuleComponent} from '../partials/info-module/info-module.component';
import {ToastService} from '../services/toast.service';
import {FileUploadConfig} from '../../file-upload.config';
import {AngularFireStorage, AngularFireUploadTask} from '@angular/fire/storage';
import {Observable} from 'rxjs';
import {ProfileMainModel} from '../models/profile-main-model';
import {ProfileService} from '../services/profile.service';
import {CompanyModel} from '../models/company-model';
import {CompanyService} from '../services/company.service';
import {SalesInvoiceMainModel} from '../models/sales-invoice-main-model';

@Component({
  selector: 'app-company',
  templateUrl: './company.component.html',
  styleUrls: ['./company.component.css']
})
export class CompanyComponent implements OnInit, OnDestroy {
  selectedRecord: CompanyModel;
  progress: { percentage: number } = { percentage: 0 };
  progressShow = false;
  snapshot: Observable<any>;
  downloadURL: string;
  percentage: Observable<number>;
  selectedFiles: FileList;
  onTransaction = false;

  constructor(protected authService: AuthenticationService, protected infoService: InformationService, protected service: CompanyService,
              protected db: AngularFirestore, protected route: Router, protected router: ActivatedRoute, protected toastService: ToastService,
              protected storage: AngularFireStorage, protected fuService: FileUploadService) {
  }

  async ngOnInit() {
    this.selectedRecord = this.service.clearModel();
    const sessionData = JSON.parse(sessionStorage.getItem('company')) as CompanyModel;
    if (sessionData != null) {
      this.selectedRecord = sessionData;
    } else {
      await this.finishSubProcess('Firma bilgisi bulunamadı', null);
    }
  }

  ngOnDestroy(): void {
  }

  async btnSave_Click(): Promise<void> {
    try {
      this.onTransaction = true;
      Promise.all([this.service.checkForSave(this.selectedRecord)])
        .then(async (values: any) => {
          if (this.selectedRecord.primaryKey === null) {
            this.selectedRecord.primaryKey = this.authService.getUid();
            await this.service.addItem(this.selectedRecord)
              .then(() => {
                this.finishProcess(null, 'Firma bilgileri başarıyla kaydedildi.');
                sessionStorage.setItem('company', JSON.stringify(this.selectedRecord));
              })
              .catch((error) => {
                this.finishProcess(error, null);
              });
          } else {
            await this.service.updateItem(this.selectedRecord)
              .then(() => {
                this.finishProcess(null, 'Firma bilgileri başarıyla güncellendi.');
                sessionStorage.setItem('company', JSON.stringify(this.selectedRecord));
              })
              .catch((error) => {
                this.finishProcess(error, null);
              });
          }
        })
        .catch((error) => {
          this.finishProcess(error, null);
        });
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

  async btnUploadFile_Click() {
    try {
      this.onTransaction = true;
      if (this.selectedFiles === undefined) {
        await this.finishSubProcess('Lütfen dosya seçiniz.', null);
        this.onTransaction = false;
      } else {
        const file = this.selectedFiles.item(0);
        const path = FileUploadConfig.pathOfProfileFiles + Date.now() + file.name;
        const ref = await this.storage.ref(path);
        this.storage.upload(path, file).then(async () => {
          this.downloadURL = await ref.getDownloadURL().toPromise();
          this.selectedRecord.imgUrl = this.downloadURL;
          this.service.updateItem(this.selectedRecord)
            .then(async () => {
              const fileData = this.fuService.clearMainModel();
              fileData.data.primaryKey = this.db.createId();
              fileData.data.downloadURL = this.downloadURL;
              fileData.data.parentType = 'company-profile';
              fileData.data.parentPrimaryKey = this.selectedRecord.primaryKey;
              fileData.data.size = file.size;
              fileData.data.type = file.type;
              fileData.data.path = path;
              fileData.data.fileName = file.name;
              await this.db.collection('tblFiles').doc(fileData.data.primaryKey).set(Object.assign({}, fileData.data));
              this.clearImageItems();
              await this.finishSubProcess(null, 'Ürün resmi başarıyla güncellendi.');
            })
            .catch((error) => {
              this.finishProcess(error, null);
            });
        });
      }
    } catch (error) {
      await this.finishProcess(error, null);
    }
  }

  async btnShowJsonData_Click(): Promise<void> {
    try {
      await this.infoService.showJsonData(JSON.stringify(this.selectedRecord, null, 2));
    } catch (error) {
      await this.infoService.error(error);
    }
  }

  onFileChange(event) {
    if (event) {
      this.progress.percentage = 0;
      this.progressShow = true;
      this.selectedFiles = event.target.files;
    } else {
      this.progress.percentage = 0;
      this.progressShow = false;
      this.selectedFiles = new FileList();
    }
  }

  clearImageItems(): void {
    this.progress.percentage = 0;
    this.progressShow = false;
    this.selectedFiles = null;
  }

  finishFinally(): void {
    this.onTransaction = false;
  }

  finishProcess(error: any, info: any): void {
    // error.message sistem hatası
    // error kontrol hatası
    if (error === null) {
      this.infoService.success(info !== null ? info : 'Belirtilmeyen Bilgi');
    } else {
      this.infoService.error(error.message !== undefined ? error.message : error);
    }
    this.onTransaction = false;
  }

  async finishSubProcess(error: any, info: any): Promise<void> {
    // error.message sistem hatası
    // error kontrol hatası
    if (error === null) {
      if (info !== null) {
        this.toastService.success(info, true);
      }
    } else {
      await this.infoService.error(error.message !== undefined ? error.message : error);
    }
    this.onTransaction = false;
  }
}
