import { ProfileModel } from '../models/profile-model';
import { ProfileService } from './profile.service';
import { ChatChanelModel } from '../models/chat-channel-model';
import { Injectable } from '@angular/core';
import { map, flatMap } from 'rxjs/operators';
import { combineLatest } from 'rxjs';
import {AngularFirestore, AngularFirestoreCollection} from '@angular/fire/firestore';
import { Observable } from 'rxjs/Observable';
import { AuthenticationService } from './authentication.service';
import { ChatChanelMainModel } from '../models/chat-channel-main-model';
import { MessageMainModel } from '../models/message-main-model';
import { MessageModel } from '../models/message-model';

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  listCollection: AngularFirestoreCollection<MessageModel>;
  mainList$: Observable<MessageMainModel[]>;
  tableName = 'tblChatChannel';

  constructor(public authService: AuthenticationService, public db: AngularFirestore, public profileService: ProfileService) {

  }

  async setItem(record: MessageMainModel, primaryKey: string) {
    return await this.listCollection.doc(primaryKey).set(Object.assign({}, record.data));
  }

  async addItem(record: MessageMainModel) {
    return await this.listCollection.add(Object.assign({}, record.data));
  }

  async removeItem(record: MessageMainModel) {
    return await this.db.collection(this.tableName).doc(record.data.primaryKey).delete();
  }

  async updateItem(record: MessageMainModel) {
    return await this.db.collection(this.tableName).doc(record.data.primaryKey).update(Object.assign({}, record));
  }

  checkFields(model: MessageModel): MessageModel {
    const cleanModel = this.clearModel();

    return model;
  }

  clearModel(): MessageModel {
    const returnData = new MessageModel();
    returnData.primaryKey = null;
    returnData.profilePrimaryKey = '-1';
    returnData.insertDate = Date.now();

    return returnData;
  }

  clearMainModel(): MessageMainModel {
    const returnData = new MessageMainModel();
    returnData.data = this.clearModel();
    returnData.profile = this.profileService.clearProfileMainModel();
    returnData.actionType = 'added';
    return returnData;
  }
}
