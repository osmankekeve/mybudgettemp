import { Component, OnInit, Input, ChangeDetectorRef } from '@angular/core';
import { AngularFireStorage, AngularFireUploadTask } from '@angular/fire/storage';
import { AngularFirestore } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { finalize, tap } from 'rxjs/operators';
import {FileUpload} from '../../file-upload.config';
import {FileModel} from '../models/file-model';
import {FileUploadService} from '../services/file-upload.service';
import {AuthenticationService} from '../services/authentication.service';
import {FileMainModel} from '../models/file-main-model';

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

  constructor(private storage: AngularFireStorage, public db: AngularFirestore,
              public authService: AuthenticationService, public service: FileUploadService) { }

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
        const fileData = this.service.clearMainModel();
        fileData.data.primaryKey = this.db.createId();
        fileData.data.downloadURL = this.downloadURL;
        fileData.data.parentType = 'shared';
        fileData.data.size = this.file.size;
        fileData.data.type = this.file.type;
        fileData.data.fileName = this.file.name;
        await this.db.collection('tblFiles').doc(fileData.data.primaryKey).set(Object.assign({}, fileData.data));
      }),
    );
  }

  isActive(snapshot) {
    return snapshot.state === 'running' && snapshot.bytesTransferred < snapshot.totalBytes;
  }

}
