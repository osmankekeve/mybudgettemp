import {Injectable} from '@angular/core';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';
import {getDateForExcel, getBoolStr, getTransactionTypes, getRelationTypes} from '../core/correct-library';
import {ExcelConfig} from 'src/excel.config';
import {CollectionMainModel} from '../models/collection-main-model';
import {AccountVoucherMainModel} from '../models/account-voucher-main-model';
import {SalesInvoiceMainModel} from '../models/sales-invoice-main-model';
import {PaymentMainModel} from '../models/payment-main-model';
import {PurchaseInvoiceMainModel} from '../models/purchase-invoice-main-model';
import {CustomerAccountMainModel} from '../models/customer-main-account-model';

@Injectable()
export class ExcelService {
  worksheet: XLSX.WorkSheet = null;
  relationTypeMap = getRelationTypes();

  constructor() {
  }

  public exportAsExcelFile(json: any[], excelFileName: string): void {
    this.worksheet = XLSX.utils.json_to_sheet(json);
    const workbook: XLSX.WorkBook = {Sheets: {data: this.worksheet}, SheetNames: ['data']};
    const excelBuffer: any = XLSX.write(workbook, {bookType: 'xlsx', type: 'array'});
    // const excelBuffer: any =  XLSX.write(workbook, { bookType: 'xlsx', type: 'array', cellDates: true, cellStyles: true});
    this.saveAsExcelFile(excelBuffer, excelFileName);
  }

  public saveAsExcelFile(buffer: any, fileName: string): void {
    // this.setStyles(fileName);
    const data: Blob = new Blob([buffer], {type: ExcelConfig.EXCEL_TYPE});
    FileSaver.saveAs(data, fileName + '_export_' + new Date().getTime() + ExcelConfig.EXCEL_TYPE);
  }

  public exportToExcel(list: any[], record: string): void {
    const excelList = [];
    const transactionTypes = getTransactionTypes();
    let fileName = 'default';
    if (record === 'purchaseInvoice') {
      fileName = 'purchase_invoice';
      list.forEach((data: any) => {
        const item = data as PurchaseInvoiceMainModel;
        excelList.push({
          'Customer Name': item.customerName,
          'Receipt No': item.data.receiptNo,
          'Total Price': item.data.totalPrice,
          'Total Price (+KDV)': item.data.totalPriceWithTax,
          'Insert Date': getDateForExcel(item.data.insertDate),
          Description: item.data.description
        });
      });
    }
    if (record === 'payment') {
      fileName = 'payment';
      list.forEach((data: any) => {
        const item = data as PaymentMainModel;
        excelList.push({
          'Customer Name': item.customerName,
          'Receipt No': item.data.receiptNo,
          Amount: item.data.amount,
          'Insert Date': getDateForExcel(item.data.insertDate),
          Description: item.data.description
        });
      });
    }
    if (record === 'salesInvoice') {
      fileName = 'sales_invoice';
      list.forEach((item: any) => {
        const data = item as SalesInvoiceMainModel;
        excelList.push({
          'Customer Name': data.customerName,
          'Receipt No': data.data.receiptNo,
          'Total Price': data.data.totalPrice,
          'Total Price (+KDV)': data.data.totalPriceWithTax,
          'Insert Date': getDateForExcel(data.data.insertDate),
          Description: data.data.description
        });
      });
    }
    if (record === 'collection') {
      fileName = 'collection';
      list.forEach((item: any) => {
        const data = item as CollectionMainModel;
        excelList.push({
          'Customer Name': data.customerName,
          'Receipt No': data.data.receiptNo,
          Amount: data.data.amount,
          'Insert Date': getDateForExcel(data.data.insertDate),
          Description: data.data.description
        });
      });
    }
    if (record === 'customer') {
      fileName = 'customer';
      list.forEach((item: any) => {
        const data = {
          'Customer Type': item.customerTypeTr,
          Code: item.data.code,
          'Customer Name': item.data.name,
          Owner: item.data.owner,
          Phone: item.data.phone1,
          Fax: item.data.phone2,
          Mail: item.data.email,
          'Active Status': getBoolStr(item.data.isActive),
          Address: item.data.address,
          'Sales Executive': item.executive.longName,
          'Payment Type': item.paymentTypeTr,
          'Term Type': item.termTr
        };
        excelList.push(data);
      });
    }
    if (record === 'note') {
      fileName = 'note';
      list.forEach((item: any) => {
        const data = {
          Note: item.data.note,
          'Insert Date': getDateForExcel(item.data.insertDate)
        };
        excelList.push(data);
      });
    }
    if (record === 'cashdeskVoucher') {
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
    }
    if (record === 'cashdeskTransaction') {
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
    }
    if (record === 'accountVoucher') {
      fileName = 'account_voucher';
      list.forEach((item: any) => {
        const data = item as AccountVoucherMainModel;
        excelList.push({
          'Customer Name': data.customerName,
          'Receipt No': data.data.receiptNo,
          Amount: data.data.amount,
          Type: data.data.type === 'debitVoucher' ? 'Borç' : 'Alacak',
          'Insert Date': getDateForExcel(data.data.insertDate),
          Description: data.data.description
        });
      });
    }
    if (record === 'customerAccountSummary') {
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
      excelList.push({Transaction: 'Toplam', 'Receipt No': '', Amount: totalValue, Type: '', 'Insert Date': ''});
    }
    if (record === 'customer-account') {
      fileName = 'customer-account';
      list.forEach((item: any) => {
        const data = item as CustomerAccountMainModel;
        excelList.push({
          'Customer Name': data.customer.data.name,
          'Account No': data.data.name,
          Description: data.data.description
        });
      });
    }
    if (record === 'customer-account-transactions') {
      fileName = 'customer-account-transactions';
      list.forEach((item: any) => {
        const data = item as any;
        excelList.push({
          'Receipt No': data.receiptNo,
          'Transaction Type': data.transactionTypeTr,
          Amount: item.amount,
        });
      });
    }
    if (record === 'buy-sell-currency-transactions') {
      fileName = 'buy-sell-currency-transactions';
      list.forEach((item: any) => {
        const data = item as any;
        excelList.push({
          Employee: data.employeeName,
          Currency: data.currencyName,
          Amount: data.amountFormatted,
          Value: data.data.unitValue,
          'Total Amount': data.totalAmountFormatted,
        });
      });
    }
    if (record === 'buy-sale') {
      fileName = 'buy-sale';
      list.forEach((item: any) => {
        const data = item as any;
        excelList.push({
          Employee: data.employeeName,
          Currency: data.currencyName,
          Amount: data.amountFormatted,
          Value: data.data.unitValue,
          'Total Amount': data.totalAmountFormatted,
        });
      });
    }
    if (record === 'unit-mapping') {
      fileName = 'unit-mapping';
      list.forEach((item: any) => {
        const data = item as any;
        excelList.push({
          Code: data.product.data.productCode,
          Name: data.product.data.productName,
          'Unit Name': data.unit.unitName,
          Value: data.data.unitValue
        });
      });
    }
    if (record === 'product') {
      fileName = 'product';
      list.forEach((item: any) => {
        const data = item as any;
        excelList.push({
          'Stock Type': data.stockTypeTr,
          Code: data.data.productCode,
          'Base Code': data.data.productBaseCode,
          Name: data.data.productName,
          'Tax Rate': '%' + data.data.taxRate.toString(),
          'Sct Amount': data.sctAmountFormatted.toString(),
          'Active Status': data.isActiveTr,
          'Is Web Product': data.isWebProductTr,
          'Barcode 1': data.data.barcode1,
          'Barcode 2': data.data.barcode2,
          'Height': data.data.height,
          'Weight': data.data.weight
        });
      });
    }
    if (record === 'product-unit') {
      fileName = 'product_unit';
      list.forEach((item: any) => {
        const data = item as any;
        excelList.push({
          'Stock Type': data.product.stockTypeTr,
          Code: data.product.data.productCode,
          Name: data.product.data.productName,
          'Active Status': data.product.isActiveTr,
          Value: data.data.unitValue
        });
      });
    }

    this.exportAsExcelFile(excelList, fileName);

  }

  public setStyles(record: string) {
    // https://www.npmjs.com/package/xlsx-style
    const range = XLSX.utils.decode_range(this.worksheet['!ref']);
    let wscols = null;
    if (record === 'collection') {
      this.setHeaderStyles(range, 1);
      wscols = [{wch: 10}, {wch: 10}, {wch: 10}, {wch: 10}, {wch: 40}];
      for (let R = range.s.r + 1; R <= range.e.r; ++R) {
        this.setTextFmt(XLSX.utils.encode_cell({c: 0, r: R}));
        this.setTextFmt(XLSX.utils.encode_cell({c: 1, r: R}));
        this.setCurrencyFmt(XLSX.utils.encode_cell({c: 2, r: R}));
        this.setTextFmt(XLSX.utils.encode_cell({c: 3, r: R}));
        this.setTextFmt(XLSX.utils.encode_cell({c: 4, r: R}));
      }

    }
    this.worksheet['!cols'] = wscols;
    this.worksheet['!rows'] = [{hpx: 13.2}];
  }

  protected setHeaderStyles(range: any, numOfHeaders: number) {
    let i = 0;
    for (let C = range.s.c; C <= range.e.c; ++C) {
      i = 0;
      while (i < numOfHeaders) {// Set header styles
        const header1 = XLSX.utils.encode_cell({c: C, r: i});
        this.worksheet[header1].s = ExcelConfig.headerStyle;
        i++;
      }
    }
    // set general cell style
    for (let R = range.s.r + i; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const all = XLSX.utils.encode_cell({c: C, r: R});
        if (this.worksheet[all]) {
          this.worksheet[all].s = ExcelConfig.generalStyle;
        }
      }
    }
  }

  protected setDateFmt(cell: string) {
    if (this.worksheet[cell] && this.worksheet[cell].v !== '' && this.worksheet[cell].v !== 'N/A') {
      this.worksheet[cell].t = 'd';
      this.worksheet[cell].z = ExcelConfig.dateFmt;
      this.worksheet[cell].s = ExcelConfig.dateStyle;
    }
  }

  protected setTimeStampFmt(cell: string) {
    this.worksheet[cell].s = ExcelConfig.dateStyle;
  }

  protected setTextFmt(cell: string) {
    if (this.worksheet[cell]) {
      this.worksheet[cell].t = 's';
      this.worksheet[cell].s = ExcelConfig.textStyle;
    }
  }

  protected setCurrencyFmt(cell: string) {
    if (this.worksheet[cell]) {
      this.worksheet[cell].t = 'n';
      this.worksheet[cell].z = ExcelConfig.currencyFmt;
      this.worksheet[cell].s = ExcelConfig.currencyStyle;
    }
  }
}
