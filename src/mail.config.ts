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
      user: 'kozayazilim@gmail.com',
      pass: 'wBf3gRGx03I+XdoAemPd6HxYMkFb9431/yqe9X0eqvtQ+fikFmSW6eZ7go+/GJKl'
    }
  },
  mailFrom: '"My Budget Web"',
  mailTo: 'murat@kozayazilim.com',
};
