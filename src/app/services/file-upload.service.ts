import {Injectable} from '@angular/core';
import {storage} from 'firebase';
import {AngularFireAuth} from '@angular/fire/auth';
import {AngularFireStorage} from '@angular/fire/storage';
import {FileUpload} from '../models/file-upload';
import {UploadTask} from '@angular/fire/storage/interfaces';
import {FileModel} from '../models/file-model';
import {LogService} from './log.service';
import {AngularFirestore, AngularFirestoreCollection} from '@angular/fire/firestore';
import {Observable, combineLatest} from 'rxjs';
import {AuthenticationService} from './authentication.service';
import {CustomerModel} from '../models/customer-model';
import {map, flatMap} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class FileUploadService {
  listCollection: AngularFirestoreCollection<FileModel>;
  mainList$: Observable<FileModel[]>;
  tableName = 'tblFiles';
  storageRef = storage().ref('files');
  uid: string;

  constructor(public firebaseAuth: AngularFireAuth, public firebaseStorage: AngularFireStorage,
              public logService: LogService,
              public authService: AuthenticationService,
              public db: AngularFirestore) {
  }

  getAllItems(): Observable<FileModel[]> {
    this.listCollection = this.db.collection<FileModel>(this.tableName,
      ref => ref.orderBy('insertDate').where('userPrimaryKey', '==', this.authService.getUid()));
    this.mainList$ = this.listCollection.valueChanges({idField: 'primaryKey'});
    return this.mainList$;
  }

  async addItem(record: FileModel) {
    await this.logService.sendToLog(record, 'insert', 'fileUpload');
    return await this.listCollection.add(record);
  }

  async removeItem(record: FileModel) {
    await this.logService.sendToLog(record, 'delete', 'fileUpload');
    return await this.db.collection(this.tableName).doc(record.primaryKey).delete();
  }

  async updateItem(record: FileModel) {
    await this.logService.sendToLog(record, 'update', 'fileUpload');
    return await this.db.collection(this.tableName).doc(record.primaryKey).update(record);
  }

  async setItem(record: FileModel, primaryKey: string) {
    await this.logService.sendToLog(record, 'insert', 'fileUpload');
    return await this.listCollection.doc(primaryKey).set(record);
  }

  uploadFile(fileUpload: FileUpload, progress: { percentage: number }) {
    const fileName: string = fileUpload.name;

    const uploadTask: UploadTask = this.storageRef.child(fileName).put(fileUpload.file);
    uploadTask.on(storage.TaskEvent.STATE_CHANGED, (snapshot: storage.UploadTaskSnapshot) => {
        const snap = snapshot as firebase.storage.UploadTaskSnapshot;
        progress.percentage = Math.ceil(snap.bytesTransferred / snap.totalBytes * 100);
      }, (error) => {
        return error;
      },
      () => {
        this.storageRef.child(fileName).getDownloadURL().then(p => {
            return p;
          }
        );
      });
  }

  uploadFileAsync = async (fileUpload: FileUpload, progress: { percentage: number }):
    // tslint:disable-next-line:cyclomatic-complexity
    Promise<any> => new Promise(async (resolve, reject): Promise<void> => {
    try {
      const fileName: string = fileUpload.name;

      const uploadTask: UploadTask = this.storageRef.child(fileName).put(fileUpload.file);
      uploadTask.on(storage.TaskEvent.STATE_CHANGED, (snapshot: storage.UploadTaskSnapshot) => {
        const snap = snapshot as firebase.storage.UploadTaskSnapshot;
        progress.percentage = Math.ceil(snap.bytesTransferred / snap.totalBytes * 100);
      }, (error) => {
      }, () => {
      });
      resolve(uploadTask);

    } catch (error) {
      console.error(error);
      reject({code: 401, message: 'You do not have permission or there is a problem about permissions!'});
    }
  });

  getMainItems(): Observable<FileModel[]> {
    this.listCollection = this.db.collection(this.tableName,
      ref => ref.orderBy('insertDate').where('userPrimaryKey', '==', this.authService.getUid()));
    this.mainList$ = this.listCollection.stateChanges().pipe(map(changes => {
      return changes.map(change => {
        const data = change.payload.doc.data() as FileModel;
        data.primaryKey = change.payload.doc.id;

        return this.db.collection('tblCustomer').doc(data.customerPrimaryKey).valueChanges()
          .pipe(map((customer: CustomerModel) => {
            return Object.assign({data, actionType: change.type});
          }));
      });
    }), flatMap(feeds => combineLatest(feeds)));
    return this.mainList$;
  }

  getMainItemsWithCustomerPrimaryKey(customerPrimaryKey: string): Observable<FileModel[]> {
    this.listCollection = this.db.collection(this.tableName,
      ref => ref.orderBy('insertDate').where('userPrimaryKey', '==', this.authService.getUid())
        .where('customerPrimaryKey', '==', customerPrimaryKey));
    this.mainList$ = this.listCollection.stateChanges().pipe(map(changes => {
      return changes.map(change => {
        const data = change.payload.doc.data() as FileModel;
        data.primaryKey = change.payload.doc.id;

        return this.db.collection('tblCustomer').doc(data.customerPrimaryKey).valueChanges()
          .pipe(map((customer: CustomerModel) => {
            return Object.assign({data, actionType: change.type});
          }));
      });
    }), flatMap(feeds => combineLatest(feeds)));
    return this.mainList$;
  }

}
