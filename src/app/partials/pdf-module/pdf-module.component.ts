import {Component, Input, OnInit} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {Router} from '@angular/router';
import { isNullOrEmpty } from 'src/app/core/correct-library';
import { SalesOrderMainModel } from 'src/app/models/sales-order-main-model';
import jspdf from 'jspdf';
import html2canvas from 'html2canvas';
import { CompanyModel } from 'src/app/models/company-model';

@Component({
  selector: 'app-pdf-module',
  templateUrl: 'pdf-module.component.html'
})

export class PDFModuleComponent implements OnInit {
  @Input() public key: string;
  @Input() public data: any;
  selectedRecord: any;
  companyData: any;
  headerTitle = '';
  text = 'Osman KEKEVE';

  constructor(public activeModal: NgbActiveModal, protected route: Router) {
  }

  ngOnInit(): void {
    this.companyData = JSON.parse(sessionStorage.getItem('company')) as CompanyModel;
    const module = this.route.url;
    if (!isNullOrEmpty(this.key) && this.data != null) {
      if (this.key === 'sales-offer') {
        this.headerTitle = 'Satış Teklifi';
        this.selectedRecord = this.data as SalesOrderMainModel;

      } else if (this.key === 'sales-order') {
        this.headerTitle = 'Satış Siparişi';
        this.selectedRecord = this.data as SalesOrderMainModel;

      } else {

      }

    } else {

    }
  }

  btnGeneratePDF_Click() {

    const data = document.getElementById('exportPDFPanel');
    html2canvas(data).then(canvas => {
      const imgWidth = 208;
      const imgHeight = canvas.height * imgWidth / canvas.width;
      const contentDataURL = canvas.toDataURL('image/png');
      const pdf = new jspdf('p', 'mm', 'a4');
      const position = 0;
      pdf.addImage(contentDataURL, 'PNG', 0, position, imgWidth, imgHeight);
      pdf.save(this.key + '_' + this.selectedRecord.data.primaryKey + '.pdf');
    });
  }
}
