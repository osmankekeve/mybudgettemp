import { ProfileMainModel } from './profile-main-model';
import { ChatChanelModel } from './chat-channel-model';

export class ChatChanelMainModel {
  data: ChatChanelModel;
  opposideProfile?: ProfileMainModel;
  actionType?: string;
}
