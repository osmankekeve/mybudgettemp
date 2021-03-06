import {Injectable} from '@angular/core';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';
import {getDateForExcel, getBoolStr, getTransactionTypes, getRelationTypes, currencyFormat} from '../core/correct-library';
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
    const data: Blob = new Blob([buffer], {type: ExcelConfig.EXCEL_EXTENSION});
    FileSaver.saveAs(data, fileName + '_export_' + new Date().getTime() + ExcelConfig.EXCEL_EXTENSION);
  }

  public exportToExcel(list: any[], record: string): void {
    const excelList = [];
    const transactionTypes = getTransactionTypes();
    let fileName = 'default';

    switch (record) {
      case 'purchase-invoice': {
        fileName = 'purchase_invoice';
        list.forEach((data: any) => {
          const item = data as PurchaseInvoiceMainModel;
          excelList.push({
            'Customer Code': item.customer.data.code,
            'Customer Name': item.customer.data.name,
            'Receipt No': item.data.receiptNo,
            'Total Price': item.data.totalPrice,
            'Total Price (+KDV)': item.data.totalPriceWithTax,
            'Insert Date': getDateForExcel(item.data.insertDate),
            Description: item.data.description
          });
        });
        break;
      }
      case 'payment': {
        fileName = 'payment';
        list.forEach((data: any) => {
        const item = data as PaymentMainModel;
        excelList.push({
          'Customer Code': data.customer.data.code,
          'Customer Name': data.customer.data.name,
          'Receipt No': data.data.receiptNo,
          Status: data.statusTr,
          Amount: data.amountFormatted,
          'Insert Date': getDateForExcel(data.data.insertDate),
          Description: data.data.description
        });
      });

        break;
      }
      case 'salesInvoice': {
        fileName = 'sales_invoice';
        list.forEach((item: any) => {
        const data = item as SalesInvoiceMainModel;
        excelList.push({
          'Customer Code': data.customer.data.code,
          'Customer Name': data.customer.data.name,
          'Invoice Type': data.typeTr,
          'Invoice Status': data.statusTr,
          'Receipt No': data.data.receiptNo,
          'Total Price': data.totalPriceFormatted,
          'Total Price (+KDV)': data.totalPriceWithTaxFormatted,
          'Insert Date': getDateForExcel(data.data.insertDate),
          Description: data.data.description
        });
      });

        break;
      }
      case 'collection': {
        fileName = 'collection';
        list.forEach((item: any) => {
        const data = item as CollectionMainModel;
        excelList.push({
          'Customer Code': data.customer.data.code,
          'Customer Name': data.customer.data.name,
          'Receipt No': data.data.receiptNo,
          Status: data.statusTr,
          Amount: data.amountFormatted,
          'Insert Date': getDateForExcel(data.data.insertDate),
          Description: data.data.description
        });
      });

        break;
      }
      case 'customer': {
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

        break;
      }
      case 'note': {
        fileName = 'note';
        list.forEach((item: any) => {
        const data = {
          Note: item.data.note,
          'Insert Date': getDateForExcel(item.data.insertDate)
        };
        excelList.push(data);
      });

        break;
      }
      case 'cashdeskVoucher': {
        fileName = 'cashdesk_voucher';
        list.forEach((item: any) => {
        const data = {
          Cashdesk: item.casDeskName,
          'Receipt No': item.data.receiptNo,
          Amount: item.data.amount,
          Type: item.data.type === 'open' ? 'A????l????' : 'Transfer',
          'Insert Date': getDateForExcel(item.data.insertDate),
          Description: item.data.description
        };
        excelList.push(data);
      });

        break;
      }
      case 'accountVoucher': {
        fileName = 'account_voucher';
        list.forEach((item: any) => {
        const data = item as AccountVoucherMainModel;
        excelList.push({
          'Customer Name': data.customer.data.name,
          'Receipt No': data.data.receiptNo,
          Amount: data.data.amount,
          Type: data.data.type === 'debitVoucher' ? 'Bor??' : 'Alacak',
          'Insert Date': getDateForExcel(data.data.insertDate),
          Description: data.data.description
        });
      });

        break;
      }
      case 'customerAccountSummary': {
        fileName = 'customer_account_summary';
        let totalValue = 0;
        list.forEach((item: any) => {
        const data = {
          Transaction: item.transactionTypeTr,
          'Sub Transaction': item.subTransactionTypeTr,
          'Receipt No': item.data.receiptNo,
          Amount: item.data.amount,
          Type: item.data.amountType === 'debit' ? 'Bor??' : 'Alacak',
          'Insert Date': getDateForExcel(item.insertDate)
        };
        excelList.push(data);
        totalValue += data.Amount;
      });
        excelList.push({Transaction: 'Toplam', 'Receipt No': '', Amount: totalValue, Type: '', 'Insert Date': ''});

        break;
      }
      case 'customer-account': {
        fileName = 'customer-account';
        list.forEach((item: any) => {
        const data = item as CustomerAccountMainModel;
        excelList.push({
          'Customer Code': data.customer.data.code,
          'Customer Name': data.customer.data.name,
          'Customer Owner': data.customer.data.owner,
          'Account No': data.data.name,
          Description: data.data.description
        });
      });

        break;
      }
      case 'customer-account-transactions': {
        fileName = 'customer-account-transactions';
        list.forEach((item: any) => {
        const data = item as any;
        excelList.push({
          'Receipt No': data.receiptNo,
          'Transaction Type': data.transactionTypeTr,
          Amount: item.amount,
        });
      });

        break;
      }
      case 'buy-sell-currency-transactions': {
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

        break;
      }
      case 'buy-sale': {
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

        break;
      }
      case 'unit-mapping': {
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

        break;
      }
      case 'product': {
        fileName = 'product';
        list.forEach((item: any) => {
        const data = item as any;
        excelList.push({
          'Product Type': data.productTypeTr,
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
          Height: data.data.height,
          Weight: data.data.weight
        });
      });

        break;
      }
      case 'product-unit': {
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

        break;
      }
      case 'sales-invoice-detail': {
        fileName = 'sales_invoice_detail';
        list.forEach((item: any) => {
        const data = item as any;
        excelList.push({
          'Product Code': data.product.data.productCode,
          'Product Name': data.product.data.productName,
          'Product Type': data.product.stockTypeTr,
          'Product Price': data.priceFormatted,
          'Discount 1': '%' + data.data.discount1.toString(),
          'Discount 2': '%' + data.data.discount2.toString(),
          Quantity: data.data.quantity,
          Unit: data.unit.unitName,
          'Tax Rate': '%' + data.data.taxRate.toString(),
          'Total Price': data.totalPriceFormatted,
          'Total Tax': data.totalTaxAmountFormatted,
          'Total Price With Tax': data.totalPriceWithTaxFormatted,
        });
      });

        break;
      }
      case 'sales-order': {
        fileName = 'sales_order';
        list.forEach((item: any) => {
        const data = item as any;
        excelList.push({
          'Customer Code': data.customer.data.code,
          'Customer Name': data.customer.data.name,
          'Receipt No': data.data.receiptNo,
          'Order Type': data.orderTypeTr,
          Status: data.statusTr,
          'Total Price': data.totalPriceFormatted,
          'Total Tax': data.totalTaxAmountFormatted,
          'Total Price With Tax': data.totalPriceWithTaxFormatted,
        });
      });

        break;
      }
      case 'sales-order-detail': {
        fileName = 'sales_order_detail';
        list.forEach((item: any) => {
        const data = item as any;
        excelList.push({
          'Product Code': data.product.data.productCode,
          'Product Name': data.product.data.productName,
          'Product Type': data.product.stockTypeTr,
          'Product Price': data.priceFormatted,
          'Discount 1': '%' + data.data.discount1.toString(),
          'Discount 2': '%' + data.data.discount2.toString(),
          Quantity: data.data.quantity,
          'Invoiced Quantity': data.data.invoicedQuantity,
          Unit: data.unit.unitName,
          'Tax Rate': '%' + data.data.taxRate.toString(),
          'Total Price': data.totalPriceFormatted,
          'Total Tax': data.totalTaxAmountFormatted,
          'Total Price With Tax': data.totalPriceWithTaxFormatted,
        });
      });

        break;
      }
      case 'purchase-order': {
        fileName = 'sales_order';
        list.forEach((item: any) => {
        const data = item as any;
        excelList.push({
          'Customer Code': data.customer.data.code,
          'Customer Name': data.customer.data.name,
          'Receipt No': data.data.receiptNo,
          'Order Type': data.orderTypeTr,
          Status: data.statusTr,
          'Total Price': data.totalPriceFormatted,
          'Total Tax': data.totalTaxAmountFormatted,
          'Total Price With Tax': data.totalPriceWithTaxFormatted,
        });
      });

        break;
      }
      case 'purchase-order-detail': {
        fileName = 'purchase_order_detail';
        list.forEach((item: any) => {
        const data = item as any;
        excelList.push({
          'Product Code': data.product.data.productCode,
          'Product Name': data.product.data.productName,
          'Product Type': data.product.stockTypeTr,
          'Product Price': data.priceFormatted,
          'Discount 1': '%' + data.data.discount1.toString(),
          'Discount 2': '%' + data.data.discount2.toString(),
          Quantity: data.data.quantity,
          'Invoiced Quantity': data.data.invoicedQuantity,
          Unit: data.unit.unitName,
          'Tax Rate': '%' + data.data.taxRate.toString(),
          'Total Price': data.totalPriceFormatted,
          'Total Tax': data.totalTaxAmountFormatted,
          'Total Price With Tax': data.totalPriceWithTaxFormatted,
        });
      });

        break;
      }
      case 'product-prices': {
        fileName = 'product_price';
        list.forEach((item: any) => {
        const data = item as any;
        excelList.push({
          'Product Code': data.product.data.productCode,
          'Product Name': data.product.data.productName,
          'Product Stock Type': data.product.stockTypeTr,
          'Product Type': data.product.productTypeTr,
          'Product Price': data.priceFormatted,
        });
      });

        break;
      }
      case 'product-discount': {
        fileName = 'product_discount';
        list.forEach((item: any) => {
        const data = item as any;
        excelList.push({
          'Product Code': data.product.data.productCode,
          'Product Name': data.product.data.productName,
          'Product Stock Type': data.product.stockTypeTr,
          'Product Type': data.product.productTypeTr,
          'Discount 1': '%' + data.data.discount1.toString(),
          'Discount 2': '%' + data.data.discount2.toString(),
        });
      });

        break;
      }
      case 'purchase-invoice-detail': {
        fileName = 'purchase_invoice_detail';
        list.forEach((item: any) => {
        const data = item as any;
        excelList.push({
          'Product Code': data.product.data.productCode,
          'Product Name': data.product.data.productName,
          'Product Type': data.product.stockTypeTr,
          'Product Price': data.priceFormatted,
          'Discount 1': '%' + data.data.discount1.toString(),
          'Discount 2': '%' + data.data.discount2.toString(),
          Quantity: data.data.quantity,
          Unit: data.unit.unitName,
          'Tax Rate': '%' + data.data.taxRate.toString(),
          'Total Price': data.totalPriceFormatted,
          'Total Tax': data.totalTaxAmountFormatted,
          'Total Price With Tax': data.totalPriceWithTaxFormatted,
        });
      });

        break;
      }
      case 'cash-desk': {
        fileName = 'cash-desk';
        list.forEach((item: any) => {
        const data = item as any;
        excelList.push({
          'Cashdesk Name': data.data.name,
          'Cashdesk Description': data.data.description,
        });
      });

        break;
      }
      case 'cash-desk-transaction': {
        fileName = 'cash-desk-transaction';
        list.forEach((item: any) => {
        const data = item as any;
        excelList.push({
          'Receipt No': data.data.receiptNo,
          'Transaction Main': data.transactionTypeTr,
          'Sub Transaction': data.subTransactionTypeTr,
          'Amount Type': data.amountTypeTr,
          Amount: Math.abs(item.data.amount),
          'Insert Date': getDateForExcel(item.insertDate)
        });
      });

        break;
      }
      case 'mail-sender': {
        fileName = 'mail-sender';
        list.forEach((item: any) => {
        const data = {
          'Mail To': item.data.mailTo,
          Subject: item.data.subject,
          Content: item.data.content,
          'Customer Name': item.customerName,
          'G??nderim Durumu': item.isSendTr,
          'Insert Date': getDateForExcel(item.data.insertDate)
        };
        excelList.push(data);
      });

        break;
      }
      case 'to-do-list': {
        fileName = 'to-do-list';
        list.forEach((item: any) => {
        const data = {
          Employee: item.employee.longName,
          Content: item.data.todoText,
          Result: item.data.result,
          'Aktiflik Durumu': item.isActiveTr,
          'Insert Date': getDateForExcel(item.data.insertDate)
        };
        excelList.push(data);
      });

        break;
      }
      case 'product-stock-transaction': {
        fileName = 'product-stock-transaction';
        list.forEach((item: any) => {
        excelList.push(
          {
            'Transaction Type': item.transactionTypeTr,
            'Subtransaction Type': item.subTransactionTypeTr,
            ReceiptNo: item.data.receiptNo,
            Amount: currencyFormat(item.data.amount),
            Quantity: item.data.quantity,
          }
        );
      });

        break;
      }
      default: {

        break;
      }
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
