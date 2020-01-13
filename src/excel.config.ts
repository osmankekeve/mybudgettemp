
export const ExcelConfig = {

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
  currencyFmt: '$#,##0.00;[Red]($#,##0.00)'
};
