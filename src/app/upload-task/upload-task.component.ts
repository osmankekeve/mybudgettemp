import { Component, OnInit, Input, ChangeDetectorRef } from '@angular/core';
import { AngularFireStorage, AngularFireUploadTask } from '@angular/fire/storage';
import { AngularFirestore } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { finalize, tap } from 'rxjs/operators';
import { FileUploadConfig } from '../../file-upload.config';
import { FileUploadService } from '../services/file-upload.service';
import { AuthenticationService } from '../services/authentication.service';
import { HttpClient } from '@angular/common/http';
import { getFileIcons } from '../core/correct-library';

@Component({
  selector: 'app-upload-task',
  templateUrl: './upload-task.component.html',
  styleUrls: ['./upload-task.component.css']
})
export class UploadTaskComponent implements OnInit {
  @Input() file: File;
  @Input() recordData: any;
  task: AngularFireUploadTask;
  percentage: Observable<number>;
  snapshot: Observable<any>;
  downloadURL: string;

  constructor(private storage: AngularFireStorage, public db: AngularFirestore,
              private httpClient: HttpClient,
              public authService: AuthenticationService, public service: FileUploadService) { }

  ngOnInit() {
    this.startUpload();
  }

  startUpload() {
    //const endpoint = '../../assets/files';
    //const formData: FormData = new FormData();
    //formData.append('fileKey', this.file, this.file.name);
    //this.httpClient.post(endpoint, formData);

    // The storage path
    const path = FileUploadConfig.pathOfFiles + Date.now() + this.file.name;

    // Reference to storage bucket
    const ref = this.storage.ref(path);

    // The main task
    this.task = this.storage.upload(path, this.file);

    // Progress monitoring
    this.percentage = this.task.percentageChanges();

    this.snapshot = this.task.snapshotChanges().pipe(
      // The file's download URL
      finalize( async () =>  {
        this.downloadURL = await ref.getDownloadURL().toPromise();
        const fileData = this.service.clearMainModel();
        fileData.data.primaryKey = this.db.createId();
        fileData.data.downloadURL = this.downloadURL;
        fileData.data.parentType = 'shared';
        fileData.data.parentPrimaryKey = '-1';
        fileData.data.size = this.file.size;
        fileData.data.type = this.file.type;
        fileData.data.fileName = this.file.name;
        fileData.data.path = path;
        if (this.recordData !== null && this.recordData !== undefined) {
          fileData.data.parentType = this.recordData.componentKey;
          fileData.data.parentPrimaryKey = this.recordData.primaryKey;
        }
        const lastDot = fileData.data.fileName.lastIndexOf('.');
        const ext = fileData.data.fileName.substring(lastDot + 1);
        fileData.fileIcon = getFileIcons().get(ext);

        await this.db.collection('tblFiles').doc(fileData.data.primaryKey).set(Object.assign({}, fileData.data));
      }),
    );
  }

  isActive(snapshot) {
    return snapshot.state === 'running' && snapshot.bytesTransferred < snapshot.totalBytes;
  }

}
