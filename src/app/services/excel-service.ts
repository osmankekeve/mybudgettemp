import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
const EXCEL_EXTENSION = '.xlsx';
import * as FileSaver from 'file-saver';
import { getDateForExcel, getBoolStr, getTransactionTypes } from '../core/correct-library';

@Injectable()
export class ExcelService {
  relationTypeMap = new Map([['meeting', 'Toplanti'], ['mailSending', 'Mail Gönderim'],
  ['faxSending', 'Fax Gönderim'], ['phoneCall', 'Telefon Görüşmesi'], ['travel', 'Seyahat'], ['visit', 'Ziyaret']]);
  constructor() { }

  public exportAsExcelFile(json: any[], excelFileName: string): void {
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(json);
    const workbook: XLSX.WorkBook = { Sheets: { data: worksheet }, SheetNames: ['data'] };
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    this.saveAsExcelFile(excelBuffer, excelFileName);
  }

  private saveAsExcelFile(buffer: any, fileName: string): void {
    const data: Blob = new Blob([buffer], {type: EXCEL_TYPE});
    FileSaver.saveAs(data, fileName + '_export_' + new Date().getTime() + EXCEL_EXTENSION);
  }

  public exportToExcel(list: any[], record: string): void {
    const excelList = [];
    const transactionTypes = getTransactionTypes();
    let fileName = 'default';
    if (record === 'purchaseInvoice') {
      fileName = 'purchase_invoice';

      list.forEach((item: any) => {
      const data = {
        'Customer Name': item.customerName,
        'Receipt No': item.data.receiptNo,
        'Total Price': item.data.totalPrice,
        'Total Price (+KDV)': item.data.totalPriceWithTax,
        'Insert Date': getDateForExcel(item.data.insertDate),
        Description: item.data.description
      };
      excelList.push(data);
    });
    } else if (record === 'payment') {
      fileName = 'payment';

      list.forEach((item: any) => {
      const data = {
        'Customer Name': item.customerName,
        'Receipt No': item.data.receiptNo,
        Amount: item.data.amount,
        'Insert Date': getDateForExcel(item.data.insertDate),
        Description: item.data.description
      };
      excelList.push(data);
    });

    } else if (record === 'salesInvoice') {
      fileName = 'sales_invoice';

      list.forEach((item: any) => {
        const data = {
          'Customer Name': item.customerName,
          'Receipt No': item.data.receiptNo,
          'Total Price': item.data.totalPrice,
          'Total Price (+KDV)': item.data.totalPriceWithTax,
          'Insert Date': getDateForExcel(item.data.insertDate),
          Description: item.data.description
        };
        excelList.push(data);
    });

    } else if (record === 'collection') {
      fileName = 'collection';

      list.forEach((item: any) => {
      const data = {
        'Customer Name': item.customerName,
        'Receipt No': item.data.receiptNo,
        Amount: item.data.amount,
        'Insert Date': getDateForExcel(item.data.insertDate),
        Description: item.data.description
      };
      excelList.push(data);
    });

    } else if (record === 'customer') {
      fileName = 'customer';

      list.forEach((item: any) => {
      const data = {
        Code: item.data.code,
        'Customer Name': item.data.name,
        Owner: item.data.owner,
        Phone: item.data.phone1,
        Fax: item.data.phone2,
        Mail: item.data.email,
        'Active Status': getBoolStr(item.data.isActive),
        Address: item.data.address,
      };
      excelList.push(data);
    });

    } else if (record === 'note') {
      fileName = 'note';

      list.forEach((item: any) => {
      const data = {
        Note: item.data.note,
        'Insert Date': getDateForExcel(item.data.insertDate)
      };
      excelList.push(data);
    });

    } else if (record === 'cashdeskVoucher') {
      fileName = 'cashdesk_voucher';

      list.forEach((item: any) => {
      const data = {
        Cashdesk: item.casDeskName,
        'Receipt No': item.data.receiptNo,
        Amount: item.data.amount,
        Type: item.data.type === 'open' ? 'Açılış' : 'Transfer',
        'Insert Date': getDateForExcel(item.data.insertDate),
        Description: item.data.description
      };
      excelList.push(data);
    });

    } else if (record === 'cashdeskTransaction') {
      fileName = 'cashdesk_transaction';

      list.forEach((item: any) => {
      const data = {
        'Transaction Type': transactionTypes.get(item.transactionType),
        'Receipt No': item.receiptNo,
        Amount: Math.abs(item.amount),
        Type: item.type === 'debit' ? 'Borç' : 'Alacak',
        'Insert Date': getDateForExcel(item.insertDate)
      };
      excelList.push(data);
    });

    } else if (record === 'accountVoucher') {
      fileName = 'account_voucher';

      list.forEach((item: any) => {
      const data = {
        'Customer Name': item.customerName,
        'Receipt No': item.data.receiptNo,
        Amount: item.data.amount,
        Type: item.data.type === 'debitVoucher' ? 'Borç' : 'Alacak',
        'Insert Date': getDateForExcel(item.data.insertDate),
        Description: item.data.description
      };
      excelList.push(data);
    });

    } else if (record === 'customerAccountSummary') {
      fileName = 'customer_account_summary';

      let totalValue = 0;
      list.forEach((item: any) => {
      const data = {
        Transaction: item.transactionTypeTr,
        'Receipt No': item.receiptNo,
        Amount: item.amount,
        Type: item.amountType === 'debit' ? 'Borç' : 'Alacak',
        'Insert Date': getDateForExcel(item.insertDate)
      };
      excelList.push(data);
      totalValue += data.Amount;
    });
      excelList.push({ Transaction: 'Toplam', 'Receipt No': '', Amount: totalValue, Type: '', 'Insert Date': '' });

    }  else {
      // add empty information
    }
    this.exportAsExcelFile(excelList, fileName);

  }
}
