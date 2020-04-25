import { Component, OnInit, OnDestroy } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { InformationService } from '../services/information.service';
import { AuthenticationService } from '../services/authentication.service';
import {ProfileService} from '../services/profile.service';
import {ProfileMainModel} from '../models/profile-main-model';
import {FileUploadConfig} from '../../file-upload.config';
import {AngularFireStorage} from '@angular/fire/storage';
import {Observable} from 'rxjs';
import {FileUploadService} from '../services/file-upload.service';

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

  constructor(public authService: AuthenticationService, private storage: AngularFireStorage, public fuService: FileUploadService,
              public infoService: InformationService, public service: ProfileService, public db: AngularFirestore) { }

  ngOnInit() {
    this.selectedRecord = JSON.parse(sessionStorage.getItem('employee')) as ProfileMainModel;
  }

  btnSaveProfileClick(): void {
    try {

    } catch (err) {
      this.infoService.error(err);
    }
  }

  async btnUploadFile_Click() {
    try {
      this.onTransaction = true;
      if (this.selectedFiles === undefined) {
        await this.infoService.error('Lütfen dosya seçiniz.');
        this.onTransaction = false;
      } else {
        const file = this.selectedFiles.item(0);
        const path = FileUploadConfig.pathOfProfileFiles + Date.now() + file.name;
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
              fileData.data.fileName = file.name;
              await this.db.collection('tblFiles').doc(fileData.data.primaryKey)
                .set(Object.assign({}, fileData.data))
                .then(() => {
                  this.service.getItem(this.selectedRecord.data.primaryKey, true)
                    .then((item) => {
                    this.finishProcess(null, 'Profil resmi başarıyla değiştirildi.');
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

  clearSelectedRecord(): void {

  }

  async finishProcess(error: any, info: any): Promise<void> {
    // error.message sistem hatası
    // error kontrol hatası
    if (error === null) {
      if (info !== null) {
        this.infoService.success(info);
      }
      this.clearSelectedRecord();
      this.selectedRecord = undefined;
    } else {
      await this.infoService.error(error.message !== undefined ? error.message : error);
    }
    this.onTransaction = false;
  }

}
