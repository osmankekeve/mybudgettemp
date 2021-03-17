import { getDateTimeNow } from './../core/correct-library';
import { MessageModel } from './../models/message-model';
import { MessageMainModel } from './../models/message-main-model';
import { MessageService } from './../services/message.service';
import { ChatChanelMainModel } from './../models/chat-channel-main-model';
import { ProfileMainModel } from './../models/profile-main-model';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { AngularFirestore, CollectionReference } from '@angular/fire/firestore';
import { InformationService } from '../services/information.service';
import { AuthenticationService } from '../services/authentication.service';
import { ToastService } from '../services/toast.service';
import { ProfileService } from '../services/profile.service';
import { ChatChannelService } from '../services/chat-channel.service';
import { Subscription } from 'rxjs';
import { Query} from '@angular/fire/firestore';

@Component({
  selector: 'app-messaging',
  templateUrl: './messaging.component.html',
  styleUrls: ['./messaging.component.css']
})
export class MessagingComponent implements OnInit, OnDestroy {

  constructor(protected authService: AuthenticationService, protected infoService: InformationService, protected toastService: ToastService,
              protected db: AngularFirestore, protected profileService: ProfileService, protected service: ChatChannelService, protected mService: MessageService) {
  }
  mainList$: Subscription;
  mainList: Array<MessageMainModel>;
  profileList: Array<ProfileMainModel>;
  chatChannelList: Array<ChatChanelMainModel>;
  mainProfileRecord: ProfileMainModel;
  searchText: '';
  isNewChatOpened = false;
  selectedChatChannelModel: ChatChanelMainModel;
  selectedProfileModel: ProfileMainModel;
  messageText: '';

  ngOnInit() {
    this.mainProfileRecord = JSON.parse(sessionStorage.getItem('employee')) as ProfileMainModel;

    this.chatChannelList = undefined;
    this.service.getMainItems().subscribe(list => {
      if (this.chatChannelList === undefined) {
        this.chatChannelList = [];
      }
      list.forEach((data: any) => {
        const item = data.returnData as ChatChanelMainModel;
        if (item.actionType === 'added') {
          this.chatChannelList.push(item);
        }
        if (item.actionType === 'removed') {
          for (let i = 0; i < this.chatChannelList.length; i++) {
            if (item.data.primaryKey === this.chatChannelList[i].data.primaryKey) {
              this.chatChannelList.splice(i, 1);
              break;
            }
          }
        }
        if (item.actionType === 'modified') {
          for (let i = 0; i < this.chatChannelList.length; i++) {
            if (item.data.primaryKey === this.chatChannelList[i].data.primaryKey) {
              this.chatChannelList[i] = item;
              break;
            }
          }
        }
      });
    });

    /*this.service.getMainItems().subscribe({
      next: (result: any) => {
        console.log(result);
      },
      error: (err: any) => {
        console.log(err);
      },
      complete: () => {
        console.log('complete');
      }
    });*/

    setTimeout(() => {
      if (this.chatChannelList === undefined) {
        this.chatChannelList = [];
      }
    }, 2000);

    this.profileList = undefined;
    this.profileService.getMainItems().subscribe(list => {
      if (this.profileList === undefined) {
        this.profileList = [];
      }
      list.forEach((data: any) => {
        const item = data.returnData as ProfileMainModel;
        if (item.actionType === 'added') {
          this.profileList.push(item);
        }
        if (item.actionType === 'removed') {
          for (let i = 0; i < this.profileList.length; i++) {
            if (item.data.primaryKey === this.profileList[i].data.primaryKey) {
              this.profileList.splice(i, 1);
              break;
            }
          }
        }
        if (item.actionType === 'modified') {
          for (let i = 0; i < this.profileList.length; i++) {
            if (item.data.primaryKey === this.profileList[i].data.primaryKey) {
              this.profileList[i] = item;
              break;
            }
          }
        }
      });
    });
    setTimeout(() => {
      if (this.profileList === undefined) {
        this.profileList = [];
      }
    }, 2000);
    // this.selectedChatChannelModel = new ChatChanelMainModel();
  }

  ngOnDestroy() {
    if (this.mainList$ !== undefined) {
      this.mainList$.unsubscribe();
    }

  }

  btnShowNewChat_Click(): void {
    this.isNewChatOpened = this.isNewChatOpened !== true;
  }

  async btnStarChatChannel_Click(): Promise<void> {
    try {
      // TODO: eger ilgili kisiye ait channel varsa olusturma
      const c1 = this.service.clearMainModel();
      const c2 = this.service.clearMainModel();

      c1.data.primaryKey = this.db.createId(); // olusturan
      c1.data.profilePrimaryKey = this.authService.getEid();
      c1.opposideProfile = this.selectedProfileModel;
      c1.data.oppositeProfilePrimaryKey = c1.opposideProfile.data.primaryKey;

      c2.data.primaryKey = c1.data.primaryKey;
      c2.data.profilePrimaryKey = c1.data.oppositeProfilePrimaryKey;
      c2.data.oppositeProfilePrimaryKey = c1.data.profilePrimaryKey;

      const firstMessage = this.mService.clearModel();
      firstMessage.primaryKey = this.db.createId();
      firstMessage.message = 'Bugün';
      firstMessage.profilePrimaryKey = 's-1'; // system-1

      await this.db.collection('tblChatChannel').doc(c1.data.primaryKey).collection('messages').doc(firstMessage.primaryKey).set(Object.assign({}, firstMessage));
      await this.db.collection('tblProfile').doc(c1.data.profilePrimaryKey).collection('tblChatChannelList').doc(c1.data.primaryKey).set(Object.assign({}, c1.data));
      await this.db.collection('tblProfile').doc(c2.data.profilePrimaryKey).collection('tblChatChannelList').doc(c2.data.primaryKey).set(Object.assign({}, c2.data));

      this.showSelectedChatChannelInfo(c1);
      this.toastService.success('Bağlantı oluşturuldu');

    } catch (error) {
      await this.infoService.error(error);
    }
  }

  async btnSendMessage_Click(): Promise<void> {
    try {

      const message = this.mService.clearModel();
      message.primaryKey = this.db.createId();
      message.message = this.messageText.trimLeft().trimRight();
      message.profilePrimaryKey = this.mainProfileRecord.data.primaryKey;
      this.db.collection('tblChatChannel')
      .doc(this.selectedChatChannelModel.data.primaryKey)
      .collection('messages')
      .doc(message.primaryKey)
      .set(Object.assign({}, message));
      this.messageText = '';

    } catch (error) {
      await this.infoService.error(error);
    }
  }

  async btnCleanChat_Click(): Promise<void> {
    try {
      this.db.collection('tblChatChannel')
      .doc(this.selectedChatChannelModel.data.primaryKey)
      .collection('messages').get().toPromise().then((snapshot) => {
        snapshot.forEach(async doc => {
          doc.ref.delete();
        });
      });
    } catch (error) {
      await this.infoService.error(error);
    }
  }

  async btnCleanMessages_Click(): Promise<void> {
    try {
      this.selectedChatChannelModel.data.clearDate = getDateTimeNow();
      this.db.collection('tblProfile').doc(this.selectedChatChannelModel.data.profilePrimaryKey)
      .collection('tblChatChannelList').doc(this.selectedChatChannelModel.data.primaryKey)
      .update(Object.assign({}, this.selectedChatChannelModel.data));
      this.mainList = [];
    } catch (error) {
      await this.infoService.error(error);
    }
  }

  async btnShowJsonData_Click(): Promise<void> {
    try {
      await this.infoService.showJsonData(JSON.stringify(this.selectedChatChannelModel, null, 2));
    } catch (error) {
      await this.infoService.error(error);
    }
  }

  async btnExitChat_Click(): Promise<void> {
    try {
      this.selectedChatChannelModel = undefined;
      this.mainList = undefined;
      this.ngOnDestroy();
    } catch (error) {
      await this.infoService.error(error);
    }
  }

  showSelectedProfileInfo(record: any): void {
    this.selectedChatChannelModel = undefined;
    if (this.selectedProfileModel && this.selectedProfileModel.data.primaryKey === record.data.primaryKey) {
      this.selectedProfileModel = undefined;
    } else {
      this.chatChannelList.forEach((item) => {
        if (item.data.oppositeProfilePrimaryKey === record.data.primaryKey) {
          this.showSelectedChatChannelInfo(item);
          return;
        }
      });
      this.selectedProfileModel = record as ProfileMainModel;
    }
  }

  showSelectedChatChannelInfo(record: any): void {
    this.ngOnDestroy();
    this.mainList = undefined;
    this.selectedProfileModel = undefined;
    if (this.selectedChatChannelModel && this.selectedChatChannelModel.data.primaryKey === record.data.primaryKey) {
      this.selectedChatChannelModel = undefined;

    } else {
      this.isNewChatOpened = false;
      this.selectedChatChannelModel = record as ChatChanelMainModel;
      this.populateChannelDetails();
    }
  }

  populateChannelDetails(): void {

    this.mainList = [];
    this.mainList$ = this.db.collection('tblChatChannel')
    .doc(this.selectedChatChannelModel.data.primaryKey).collection('messages',
    ref => {
      let query: CollectionReference | Query = ref;
      if (this.selectedChatChannelModel.data.clearDate !== null) {
        query = query.orderBy('insertDate').startAt(this.selectedChatChannelModel.data.clearDate);
      }
      return query;
    })
    .stateChanges().subscribe(list => {
      list.forEach(async change => {
        const data = change.payload.doc.data() as MessageModel;
        if (change.type === 'added') {
          data.primaryKey = change.payload.doc.id;

          const returnData = this.mService.clearMainModel();
          returnData.data = this.mService.checkFields(data);
          returnData.actionType = change.type;

          const a = await this.profileService.getItem(returnData.data.profilePrimaryKey, false);
          returnData.profile = a === null ? this.profileService.clearProfileMainModel() : a.returnData;
          if (this.mainList.indexOf(returnData) < 0) {
            this.mainList.push(returnData);
            this.mainList.sort((a, b) => {
              return new Date(a.data.insertDate).getTime() - new Date(b.data.insertDate).getTime();
            });
          }
        }
        if (change.type === 'removed') {
          for (let i = 0; i < this.mainList.length; i++) {
            if (data.primaryKey === this.mainList[i].data.primaryKey) {
              this.mainList.splice(i, 1);
              break;
            }
          }
        }

      });
    });
    setTimeout(() => {
      this.addWellcomeMessageToList();
    }, 500);

  }

  addWellcomeMessageToList(): void {
    const firstMessage = this.mService.clearModel();
    firstMessage.primaryKey = this.db.createId();
    firstMessage.message = 'Hoşgeldiniz';
    firstMessage.profilePrimaryKey = 's-1'; // system-1

    const returnData = this.mService.clearMainModel();
    returnData.data = this.mService.checkFields(firstMessage);
    returnData.actionType = 'added';

    this.mainList.push(returnData);
  }

  sendFixMessage(messageText: string): void {
    const message = this.mService.clearModel();
    message.primaryKey = this.db.createId();
    message.message = messageText.trimLeft().trimRight();
    message.profilePrimaryKey = this.mainProfileRecord.data.primaryKey;
    this.db.collection('tblChatChannel')
    .doc(this.selectedChatChannelModel.data.primaryKey)
    .collection('messages')
    .doc(message.primaryKey)
    .set(Object.assign({}, message));
  }
}
