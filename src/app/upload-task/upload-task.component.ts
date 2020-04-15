import { Component, OnInit, Input, ChangeDetectorRef } from '@angular/core';
import { AngularFireStorage, AngularFireUploadTask } from '@angular/fire/storage';
import { AngularFirestore } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { finalize, tap } from 'rxjs/operators';
import {FileUpload} from '../../file-upload.config';
import {FileModel} from '../models/file-model';
import {FileUploadService} from '../services/file-upload.service';
import {AuthenticationService} from '../services/authentication.service';

@Component({
  selector: 'app-upload-task',
  templateUrl: './upload-task.component.html',
  styleUrls: ['./upload-task.component.css']
})
export class UploadTaskComponent implements OnInit {
  @Input() file: File;
  task: AngularFireUploadTask;
  percentage: Observable<number>;
  snapshot: Observable<any>;
  downloadURL: string;

  constructor(private storage: AngularFireStorage, public authService: AuthenticationService, public service: FileUploadService) { }

  ngOnInit() {
    this.startUpload();
  }

  startUpload() {

    // The storage path
    const path = FileUpload.pathOfFiles + Date.now() + this.file.name;

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
        const fileData = new FileModel();
        fileData.customerPrimaryKey = '-1';
        fileData.userPrimaryKey = this.authService.getUid();
        fileData.insertDate = new Date().getTime();
        fileData.downloadURL = this.downloadURL;
        fileData.parentType = 'shared';
        fileData.size = this.file.size;
        fileData.type = this.file.type;
        fileData.fileName = this.file.name;
        await this.service.addItem(fileData);
      }),
    );
  }

  isActive(snapshot) {
    return snapshot.state === 'running' && snapshot.bytesTransferred < snapshot.totalBytes;
  }

}
