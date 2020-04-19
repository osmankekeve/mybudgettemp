import {Component, OnInit, OnDestroy, OnChanges} from '@angular/core';
import { FileUpload } from '../models/file-upload';
import { FileUploadService } from '../services/file-upload.service';
import { storage } from 'firebase';
import { InformationService } from '../services/information.service';
import { AuthenticationService } from '../services/authentication.service';
import { Observable } from 'rxjs';
import { CustomerModel } from '../models/customer-model';
import { CustomerService } from '../services/customer.service';
import {FileMainModel} from '../models/file-main-model';

@Component({
  selector: 'app-file-upload',
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.css']
})

export class FileUploadComponent implements OnInit {
  mainList: Array<FileMainModel>;
  selectedFiles: FileList;
  currentFileUpload: FileUpload;
  selectedRecord: FileMainModel;
  refModel: FileMainModel;
  customerList$: Observable<CustomerModel[]>;
  progress: { percentage: number } = { percentage: 0 };
  progressShow = false;
  btnDis = true;
  storageRef = storage().ref('files');

  constructor(public storageService: FileUploadService,
              public service: FileUploadService,
              public cService: CustomerService,
              public authService: AuthenticationService,
              public infoService: InformationService ) { }

  ngOnInit() {
    this.clearSelectedRecord();
    this.customerList$ = this.cService.getAllItems();
    this.populateAllRecords();
  }

  populateAllRecords(): void {
    this.mainList = undefined;
    this.service.getMainItems('shared').subscribe(list => {
      this.mainList = [];
      list.forEach((data: any) => {
        const item = data.returnData as FileMainModel;
        if (item.actionType === 'added') {
          this.mainList.push(item);
        }
        if (item.actionType === 'removed') {
          for (let i = 0; i < this.mainList.length; i++) {
            if (item.data.primaryKey === this.mainList[i].data.primaryKey) {
              this.mainList.splice(i, 1);
            }
          }
        }
        if (item.actionType === 'modified') {
          for (let i = 0; i < this.mainList.length; i++) {
            if (item.data.primaryKey === this.mainList[i].data.primaryKey) {
              this.mainList[i] = item;
            }
          }
        }
      });
    });
    setTimeout (() => {
      if (this.mainList === undefined) {
        this.mainList = [];
      }
    }, 1000);
  }

  btnUploadFile_Click() {
    if (this.selectedFiles === undefined) {
      this.infoService.error('Lütfen dosya seçiniz.');
    } else {
      const file = this.selectedFiles.item(0);
      this.currentFileUpload = new FileUpload(file);
      this.currentFileUpload.name = file.name;

      this.storageService.uploadFileAsync(this.currentFileUpload, this.progress).then((data) => {
        if (data.state === 'success') {
          this.selectedRecord.data.primaryKey = '';
          this.selectedRecord.data.fileName = this.currentFileUpload.file.name;
          this.selectedRecord.data.size = this.currentFileUpload.file.size;
          this.selectedRecord.data.type = this.currentFileUpload.file.type;
          this.selectedRecord.data.path = data.metadata.fullPath;
          if (this.selectedRecord.data.parentType !== 'customer') { this.selectedRecord.data.parentPrimaryKey = '-1'; }
          this.service.addItem(this.selectedRecord)
          .then(() => {
            this.infoService.success('Dosya başarılı şekilde yüklendi.');
            this.clearSelectedRecord();
            this.onFileChange(undefined);
          }).catch(err => this.infoService.error(err));
        } else {
          this.infoService.error('Dosya yükleme sırasında problem oluştu.');
        }
      });
    }
  }

  btnDownloadFile_Click(): void {
    try {
      this.storageRef.storage.ref(this.selectedRecord.data.path)
      .getDownloadURL().then(url => {
        console.log(url);
        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.target = '_blank';
        downloadLink.setAttribute('download', (this.selectedRecord.data.path));
        document.body.appendChild(downloadLink);
        downloadLink.click();
      }).catch(err => this.infoService.error(err));
    } catch (err) {
      this.infoService.error(err);
    }
  }

  btnRemoveFile_Click(): void {
    try {
      this.storageRef.storage.ref(this.selectedRecord.data.path).delete().then(() => {
        this.service.removeItem(this.selectedRecord)
        .then(() => {
          this.infoService.success('Dosya başarılı şekilde kaldırıldı.');
          this.clearSelectedRecord();
          this.onFileChange(undefined);
        }).catch(err => this.infoService.error(err));

      }).catch(err => this.infoService.error(err));

    } catch (err) {
      this.infoService.error(err);
    }
  }

  btnCancelFile_Click(): void {
    try {
      this.clearSelectedRecord();
      this.onFileChange(undefined);

    } catch (err) {
      this.infoService.error(err);
    }
  }

  btnNew_Click(): void {
    try {
      this.clearSelectedRecord();
      this.onFileChange(undefined);

    } catch (err) {
      this.infoService.error(err);
    }
  }

  showSelectedRecord(file: any) {
    this.selectedRecord = file as FileMainModel;
    this.refModel = file as FileMainModel;
  }

  sendFile() {
  if (this.selectedFiles === undefined) {
      console.log('Dosya Seçilmedi!');
  } else {
      const file = this.selectedFiles.item(0);
      this.currentFileUpload = new FileUpload(file);
      this.currentFileUpload.name = file.name;





      const data = this.storageService.uploadFile(this.currentFileUpload, this.progress);
      console.log(data);
  }
  }

  onFileChange(event) {
    if (event) {
      this.progress.percentage = 0;
      this.progressShow = true;
      this.btnDis = false;
      this.selectedFiles = event.target.files;
    } else {
      this.progress.percentage = 0;
      this.progressShow = false;
      this.btnDis = true;
      this.selectedFiles = new FileList();
    }
  }

  clearSelectedRecord(): void {
    this.refModel = undefined;
    this.selectedRecord = this.service.clearMainModel();
  }

}
