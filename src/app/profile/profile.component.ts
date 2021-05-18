import { Component, OnInit, OnDestroy } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { InformationService } from '../services/information.service';
import { AuthenticationService } from '../services/authentication.service';
import {ProfileService} from '../services/profile.service';
import {ProfileMainModel} from '../models/profile-main-model';
import {AngularFireStorage} from '@angular/fire/storage';
import {Observable} from 'rxjs';
import {FileUploadService} from '../services/file-upload.service';
import {ToastService} from '../services/toast.service';
import { getString } from '../core/correct-library';
import { CONFIG } from 'src/main.config';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  openedPanel = 'mainPanel';
  selectedRecord: ProfileMainModel;
  selectedFiles: FileList;
  progress: { percentage: number } = { percentage: 0 };
  progressShow = false;
  btnUploadProfilePicture = true;
  snapshot: Observable<any>;
  downloadURL: string;
  onTransaction = false;
  securityFields = {
    currentPassword: '',
    newPassword: '',
    newPasswordAgain: '',
  };

  constructor(protected authService: AuthenticationService, protected storage: AngularFireStorage, protected fuService: FileUploadService,
              protected infoService: InformationService, protected service: ProfileService, protected db: AngularFirestore,
              protected toastService: ToastService) { }

  ngOnInit() {
    this.selectedRecord = JSON.parse(sessionStorage.getItem('employee')) as ProfileMainModel;
  }

  async generateModule(isReload: boolean, primaryKey: string, error: any, info: any): Promise<void> {
    if (error === null) {
      this.infoService.success(info !== null ? info : 'Belirtilmeyen Bilgi');
      if (isReload) {
        this.service.getItem(primaryKey, true)
          .then(item => {
            this.selectedRecord = item.returnData;
          })
          .catch(reason => {
            this.finishProcess(reason, null);
          });
      } else {

      }
    } else {
      await this.infoService.error(error.message !== undefined ? error.message : error);
    }
    this.onTransaction = false;
  }

  async btnSave_Click(): Promise<void> {
    try {
      this.onTransaction = true;
      Promise.all([this.service.checkForSave(this.selectedRecord)])
        .then(async (values: any) => {
          await this.service.updateItem(this.selectedRecord)
            .then(() => {
              this.generateModule(true, this.selectedRecord.data.primaryKey, null, 'Kayıt başarıyla güncellendi.');
            })
            .catch((error) => {
              this.finishProcess(error, null);
            });
        })
        .catch((error) => {
          this.finishProcess(error, null);
        });
    } catch (error) {
      await this.finishProcess(error, null);
    }
  }

  async btnSaveSecurity_Click(): Promise<void> {
    try {
      if (this.securityFields.newPassword.trim() !== '') {
        this.onTransaction = true;

        await this.service.isEmployeePasswordExist(this.selectedRecord.data.primaryKey, this.securityFields.currentPassword).then(async isExist => {
          if (!isExist) {
            this.finishProcess('Lütfen mevcut şifrenizi kontrol ediniz', null);
          } else {
            if (this.securityFields.newPassword.trim().length < 5) {
              this.finishProcess('Şireniz 5 karakterden kısa olamaz', null);
            } else if (this.securityFields.newPassword.trim() !== this.securityFields.newPasswordAgain.trim()) {
              this.finishProcess('Yeni şifre ile doğrulama eşleşmemektedir', null);
            } else {
              this.selectedRecord.data.password = this.securityFields.newPassword.trim();
              await this.service.updateItem(this.selectedRecord)
              .then(() => {
                sessionStorage.setItem('employee', JSON.stringify(this.selectedRecord));
                this.finishProcess(null, 'Şifreniz başarıyla güncellendi.');
              })
              .catch((error) => {
                this.finishProcess(error, null);
              });
            }
          }
        });

    }
    } catch (err) {
      await this.finishProcess(err, null);
    }
  }

  async btnUploadFile_Click() {
    try {
      this.onTransaction = true;
      if (this.selectedFiles === undefined) {
        await this.finishSubProcess('Lütfen dosya seçiniz.', null);
      } else {
        const file = this.selectedFiles.item(0);
        const path = CONFIG.pathOfProfileFiles + Date.now() + file.name;
        const ref = await this.storage.ref(path);
        this.storage.upload(path, file).then(async () => {
          this.downloadURL = await ref.getDownloadURL().toPromise();
          this.selectedRecord.data.pathOfProfilePicture = this.downloadURL;
          this.service.updateItem(this.selectedRecord)
            .then(async () => {
              const fileData = this.fuService.clearMainModel();
              fileData.data.primaryKey = this.db.createId();
              fileData.data.downloadURL = this.downloadURL;
              fileData.data.parentType = 'profile';
              fileData.data.parentPrimaryKey = this.selectedRecord.data.primaryKey;
              fileData.data.size = file.size;
              fileData.data.type = file.type;
              fileData.data.path = path;
              fileData.data.fileName = file.name;
              await this.db.collection('tblFiles').doc(fileData.data.primaryKey)
                .set(Object.assign({}, fileData.data))
                .then(() => {
                  this.service.getItem(this.selectedRecord.data.primaryKey, true)
                    .then(async () => {
                      await this.finishSubProcess(null, 'Profil resmi başarıyla değiştirildi.');
                  });
                });
            })
            .catch((error) => {
              this.finishProcess(error, null);
            });
        });
      }
    } catch (error) {
      this.finishProcess(error, null);
    }
  }

  onFileChange(event) {
    if (event) {
      this.progress.percentage = 0;
      this.progressShow = true;
      this.btnUploadProfilePicture = false;
      this.selectedFiles = event.target.files;
    } else {
      this.progress.percentage = 0;
      this.progressShow = false;
      this.btnUploadProfilePicture = true;
      this.selectedFiles = new FileList();
    }
  }

  openPanel(panel: string): void {
    this.openedPanel = panel;
  }

  async finishProcess(error: any, info: any): Promise<void> {
    // error.message sistem hatası
    // error kontrol hatası
    if (error === null) {
      if (info !== null) {
        this.toastService.success(info);
      }
    } else {
      await this.toastService.error(error.message !== undefined ? error.message : error);
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

  countContain(strPassword: string, strCheck: string): any {
     // Declare variables
     let nCount = 0;

     for (let i = 0; i < strPassword.length; i ++) {
         if (strCheck.indexOf(strPassword.charAt(i)) > -1) {
                 nCount++;
         }
     }

     return nCount;
  }

  passwordTextChanged(text: string): any {
    const strUpperCase = 'ABCDEFGHIİJKLMNOÖPQRSŞTUÜVWXYZ';
    const strLowerCase = 'abcdefghıijklmnoöpqrsştuüvwxyz';
    const strNumber = '0123456789';
    const strCharacters = '!@#$%^&*?_~';
    const strPassword = text.trimLeft().trimRight();
    // Reset combination count
    let nScore = 0;

    // Password length
    // -- Less than 4 characters
    if (strPassword.length > 0 && strPassword.length < 5) {
        nScore += 5;
    } else if (strPassword.length > 4 && strPassword.length < 8) {
        nScore += 10;
    } else if (strPassword.length > 7) {
        nScore += 25;
    }

    // Letters
    const nUpperCount = this.countContain(strPassword, strUpperCase);
    const nLowerCount = this.countContain(strPassword, strLowerCase);
    const nLowerUpperCount = nUpperCount + nLowerCount;
    // -- Letters are all lower case
    if (nUpperCount === 0 && nLowerCount !== 0) {
        nScore += 10;
    } else if (nUpperCount !== 0 && nLowerCount !== 0) {
        nScore += 20;
    }

    // Numbers
    const nNumberCount = this.countContain(strPassword, strNumber);
    // -- 1 number
    if (nNumberCount === 1) {
        nScore += 10;
    }
    // -- 3 or more numbers
    if (nNumberCount >= 3) {
        nScore += 20;
    }

    // Characters
    const nCharacterCount = this.countContain(strPassword, strCharacters);
    // -- 1 character
    if (nCharacterCount === 1) {
      nScore += 10;
    }
    // -- More than 1 character
    if (nCharacterCount > 1) {
      nScore += 25;
    }

    // Bonus
    // -- Letters and numbers
    if (nNumberCount !== 0 && nLowerUpperCount !== 0) {
      nScore += 2;
    }
    // -- Letters, numbers, and characters
    if (nNumberCount !== 0 && nLowerUpperCount !== 0 && nCharacterCount !== 0) {
      nScore += 3;
    }
    // -- Mixed case letters, numbers, and characters
    if (nNumberCount !== 0 && nUpperCount !== 0 && nLowerCount !== 0 && nCharacterCount !== 0) {
      nScore += 5;
    }
    let strText = '';
    let strColor = '';
    if (nScore >= 80) {
      strText = 'Very Strong';
      strColor = '#008000';
    } else if (nScore >= 60) {
      strText = 'Strong';
      strColor = '#006000';
    } else if (nScore >= 40) {
      strText = 'Average';
      strColor = '#e3cb00';
    } else if (nScore >= 20) {
      strText = 'Weak';
      strColor = '#Fe3d1a';
    } else {
      strText = 'Very Weak';
      strColor = '#e71a1a';
    }
    const ctlBar = document.getElementById('progress');
    ctlBar.style.width = getString((nScore * 1.25 > 100) ? 100 : nScore * 1.25) + '%';
    if (strPassword.length === 0) {
      ctlBar.style.backgroundColor = '';
    } else {
      ctlBar.style.backgroundColor = strColor;
    }
    this.securityFields.newPassword = strPassword;
  }

}
