/** Config */
import * as colors from 'colors';

// tslint:disable
export const CONFIG = {
  isSendMail: true,
  smtp: {
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
      user: 'osmankekeve@gmail.com',
      pass: '198800keK'
    }
  },
  mailFrom: '"My Budget Web"',
  mailTo: 'osman.kekeve@gmail.com', // destek mail adresi olacak
  mailToName: 'Osman KEKEVE', // destek ekibinin jargon ismi
  mailFromName: 'My Budget Web System', // mailin nereden geldiği
  mjsServiceID: 'gmail',
  mjsUserID: 'user_MnYHwTCq0NxsdQx7XCHoh',
  mjsContactUsTemplateID: 'template_ZOI4dmYR',
  mjsMainTemplateID: 'main_template',
};
