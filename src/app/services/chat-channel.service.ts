import { ProfileModel } from './../models/profile-model';
import { ProfileService } from './profile.service';
import { ChatChanelModel } from './../models/chat-channel-model';
import { Injectable } from '@angular/core';
import { map, mergeMap } from 'rxjs/operators';
import { combineLatest } from 'rxjs';
import {AngularFirestore, AngularFirestoreCollection, CollectionReference, Query} from '@angular/fire/firestore';
import { Observable } from 'rxjs/Observable';
import { AuthenticationService } from './authentication.service';
import { ChatChanelMainModel } from '../models/chat-channel-main-model';
import { ProfileMainModel } from '../models/profile-main-model';

@Injectable({
  providedIn: 'root'
})
export class ChatChannelService {
  listCollection: AngularFirestoreCollection<ChatChanelModel>;
  mainList$: Observable<ChatChanelMainModel[]>;
  tableName = 'tblChatChannel';
  profileChannelTableName = 'tblChatChannelList';

  constructor(public authService: AuthenticationService, public db: AngularFirestore, public profileService: ProfileService) {

  }

  async setItem(record: ChatChanelMainModel, primaryKey: string) {
    return await this.listCollection.doc(primaryKey).set(Object.assign({}, record.data));
  }

  async addItem(record: ChatChanelMainModel) {
    return await this.listCollection.add(Object.assign({}, record.data));
  }

  async removeItem(record: ChatChanelMainModel) {
    return await this.db.collection(this.tableName).doc(record.data.primaryKey).delete();
  }

  async updateItem(record: ChatChanelMainModel) {
    return await this.db.collection(this.tableName).doc(record.data.primaryKey).update(Object.assign({}, record));
  }

  checkFields(model: ChatChanelModel): ChatChanelModel {
    const cleanModel = this.clearModel();

    return model;
  }

  clearModel(): ChatChanelModel {
    const returnData = new ChatChanelModel();
    returnData.primaryKey = null;
    returnData.profilePrimaryKey = '-1';
    returnData.oppositeProfilePrimaryKey = '-1';
    returnData.userPrimaryKey = this.authService.getUid();
    returnData.isActive = true;
    returnData.insertDate = Date.now();
    returnData.clearDate = Date.now();

    return returnData;
  }

  clearMainModel(): ChatChanelMainModel {
    const returnData = new ChatChanelMainModel();
    returnData.data = this.clearModel();
    returnData.opposideProfile = this.profileService.clearProfileMainModel();
    returnData.actionType = 'added';
    return returnData;
  }

  getMainItems(): Observable<ChatChanelMainModel[]> {
    this.listCollection = this.db.collection<ChatChanelModel>('tblProfile',
    ref => ref.doc(this.authService.getEid()).collection(this.profileChannelTableName)
    .where('isActive', '==', true));
    this.mainList$ = this.listCollection.stateChanges().pipe(map(changes  => {
      return changes.map(change => {
        const data = change.payload.doc.data() as ChatChanelModel;
        data.primaryKey = change.payload.doc.id;

        const returnData = this.clearMainModel();
        returnData.data = this.checkFields(data);
        returnData.actionType = change.type;

        return this.db.collection('tblProfile').doc(returnData.data.oppositeProfilePrimaryKey).valueChanges()
        .pipe(map( (profile: ProfileModel) => {
          returnData.opposideProfile = this.profileService.convertMainModel(profile);
          return Object.assign({ returnData }); }));
      });
    }), mergeMap(feeds => combineLatest(feeds)));
    return this.mainList$;
  }

  isProfileHasChannel = async (profilePrimaryKey: string, oppositeProfilePrimaryKey: string):
    Promise<boolean> => new Promise(async (resolve, reject): Promise<void> => {
    try {
      this.db.collection('tblProfile').doc(profilePrimaryKey).collection(this.profileChannelTableName, ref => {
        let query: CollectionReference | Query = ref;
        query = query.limit(1).where('oppositeProfilePrimaryKey', '==', oppositeProfilePrimaryKey);
        return query;
      }).get().subscribe(snapshot => {
        if (snapshot.size > 0) {
          resolve(true);
        } else {
          resolve(false);
        }
      });
    } catch (error) {
      reject({message: 'Error: ' + error});
    }
  })

}
