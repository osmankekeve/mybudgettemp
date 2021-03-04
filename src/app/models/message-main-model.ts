import { ProfileMainModel } from './profile-main-model';
import { MessageModel } from './message-model';

export class MessageMainModel {
  data: MessageModel;
  profile?: ProfileMainModel;
  actionType?: string;
}
