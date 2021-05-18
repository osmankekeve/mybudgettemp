/** Config */
import * as colors from 'colors';

// tslint:disable
export const CONFIG = {
  // Mail
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

  //Excel
  
  EXCEL_TYPE: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',

  EXCEL_EXTENSION: '.xlsx',

  headerStyle: {
    fill: {fgColor: {rgb: 'D3D3D3'}},
    font: {name: 'Arial', sz: 10, bold: true},
    alignment: { wrapText: true, vertical: 'bottom', horizontal: 'center' }
  },

  dateStyle: {
    font: {name: 'Arial', sz: 10},
    alignment: { wrapText: false, vertical: 'bottom', horizontal: 'center' }
  },

  currencyStyle: {
    font: {name: 'Arial', sz: 10},
    alignment: { wrapText: false, vertical: 'bottom', horizontal: 'right' }
  },

  textStyle: {
    font: {name: 'Arial', sz: 10},
    alignment: { wrapText: true, vertical: 'bottom', horizontal: 'right' }
  },

  generalStyle: {
    font: {name: 'Arial', sz: 10},
    alignment: { wrapText: true, vertical: 'bottom', horizontal: 'left' }
  },

  dateFmt: 'mm/dd/yyyy',
  currencyFmt: '$#,##0.00;[Red]($#,##0.00)',
  
  //Chart
  Chart_Colors: {
    red: 'rgba(255, 99, 132, 1)',
    yellow: 'rgba(255, 206, 86, 1)',
    blue: 'rgba(54, 162, 235, 1)',
    purple: 'rgba(153, 102, 255, 1)',
    green: 'rgba(75, 192, 192, 1)',
    grey: 'rgba(208, 208, 208, 1)'
  },
  Chart_Colors_Soft: {
    red: 'rgba(255, 99, 132, 0.2)',
    yellow: 'rgba(255, 206, 86, 0.2)',
    blue: 'rgba(54, 162, 235, 0.2)',
    purple: 'rgba(153, 102, 255, 0.2)',
    green: 'rgba(75, 192, 192, 0.2)',
    grey: 'rgba(208, 208, 208, 0.2)'
  },

  //File Upload
  pathOfFiles: 'files/',
  pathOfProfileFiles: 'profile/',
};
