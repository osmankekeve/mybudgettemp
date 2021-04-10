import {Component, OnInit, Input, Output, EventEmitter} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {ProductService} from '../../services/product.service';
import {ProductMainModel} from '../../models/product-main-model';
import {InformationService} from '../../services/information.service';
import {Router} from '@angular/router';
import { getFirstDayOfMonthForInput, getTodayForInput } from 'src/app/core/correct-library';

@Component({
  selector: 'app-main-filter',
  templateUrl: 'main-filter.component.html'
})

export class MainFilterComponent implements OnInit {

  @Output() passEntry: EventEmitter<any> = new EventEmitter();
  module = 'default';
  mainFilter = {
    filterBeginDate: getFirstDayOfMonthForInput(),
    filterFinishDate: getTodayForInput(),
    filterStatus: '-1',
    filterStockType: '-1',
    filterIsPersonal: '-1',
    filterPeriodType: '-1',
    isActive: true,
  };

  pnlBeginDate = false;
  pnlFinishDate = false;
  pnlStatus = false;
  pnlIsActive = false;
  pnlProductStockType = false;
  pnlPersonal = false;
  pnlPeriodType = false;
  listStatus = [];

  constructor(public activeModal: NgbActiveModal, protected route: Router,
              protected infoService: InformationService) {
  }

  async ngOnInit(): Promise<void> {
    this.module = this.route.url.replace('/', '');
    switch (this.module) {
      case 'sales-offer': {
        this.pnlBeginDate = true;
        this.pnlFinishDate = true;
        this.pnlStatus = true;
        this.listStatus = [
          { key: '-1', value: 'Hepsi'},
          { key: 'waitingForApprove', value: 'Onay Bekliyor'},
          { key: 'rejected', value: 'Geri Çevrildi'},
        ];
        break;
      }
      case 'sales-order': {
        this.pnlBeginDate = true;
        this.pnlFinishDate = true;
        this.pnlStatus = true;
        this.listStatus = [
          { key: '-1', value: 'Hepsi'},
          { key: 'approved', value: 'Onaylandı'},
          { key: 'portion', value: 'Parçalı'},
          { key: 'closed', value: 'Kapatıldı'},
          { key: 'done', value: 'Tamamlandı'},
          { key: '-2', value: 'Faturaya Hazır'},
        ];
        break;
      }
      case 'sales-invoice': {
        this.pnlBeginDate = true;
        this.pnlFinishDate = true;
        this.pnlStatus = true;
        this.listStatus = [
          { key: '-1', value: 'Hepsi'},
          { key: 'waitingForApprove', value: 'Onay Bekliyor'},
          { key: 'approved', value: 'Onaylandı'},
          { key: 'rejected', value: 'Geri Çevrildi'},
          { key: 'canceled', value: 'İptal Edildi'},
        ];
        break;
      }
      case 'collection': {
        this.pnlBeginDate = true;
        this.pnlFinishDate = true;
        this.pnlStatus = true;
        this.listStatus = [
          { key: '-1', value: 'Hepsi'},
          { key: 'waitingForApprove', value: 'Onay Bekliyor'},
          { key: 'approved', value: 'Onaylandı'},
          { key: 'canceled', value: 'İptal Edildi'}
        ];
        break;
      }
      case 'account-voucher': {
        this.pnlBeginDate = true;
        this.pnlFinishDate = true;
        this.pnlStatus = true;
        this.listStatus = [
          { key: '-1', value: 'Hepsi'},
          { key: 'waitingForApprove', value: 'Onay Bekliyor'},
          { key: 'approved', value: 'Onaylandı'},
          { key: 'rejected', value: 'Geri Çevrildi'},
        ];
        break;
      }
      case 'campaign': {
        this.pnlBeginDate = true;
        this.pnlFinishDate = true;
        break;
      }
      case 'purchase-offer': {
        this.pnlBeginDate = true;
        this.pnlFinishDate = true;
        this.pnlStatus = true;
        this.listStatus = [
          { key: '-1', value: 'Hepsi'},
          { key: 'waitingForApprove', value: 'Onay Bekliyor'},
          { key: 'rejected', value: 'Geri Çevrildi'},
        ];
        break;
      }
      case 'purchase-order': {
        this.pnlBeginDate = true;
        this.pnlFinishDate = true;
        this.pnlStatus = true;
        this.listStatus = [
          { key: '-1', value: 'Hepsi'},
          { key: 'approved', value: 'Onaylandı'},
          { key: 'portion', value: 'Parçalı'},
          { key: 'closed', value: 'Kapatıldı'},
          { key: 'done', value: 'Tamamlandı'},
          { key: '-2', value: 'Faturaya Hazır'},
        ];
        break;
      }
      case 'purchase-invoice': {
        this.pnlBeginDate = true;
        this.pnlFinishDate = true;
        this.pnlStatus = true;
        this.listStatus = [
          { key: '-1', value: 'Hepsi'},
          { key: 'waitingForApprove', value: 'Onay Bekliyor'},
          { key: 'approved', value: 'Onaylandı'},
          { key: 'rejected', value: 'Geri Çevrildi'},
          { key: 'canceled', value: 'İptal Edildi'},
        ];
        break;
      }
      case 'payment': {
        this.pnlBeginDate = true;
        this.pnlFinishDate = true;
        this.pnlStatus = true;
        this.listStatus = [
          { key: '-1', value: 'Hepsi'},
          { key: 'waitingForApprove', value: 'Onay Bekliyor'},
          { key: 'approved', value: 'Onaylandı'},
          { key: 'canceled', value: 'İptal Edildi'}
        ];
        break;
      }
      case 'cash-desk': {
        this.pnlBeginDate = true;
        this.pnlFinishDate = true;
        break;
      }
      case 'cashdesk-voucher': {
        this.pnlBeginDate = true;
        this.pnlFinishDate = true;
        this.pnlStatus = true;
        this.listStatus = [
          { key: '-1', value: 'Hepsi'},
          { key: 'waitingForApprove', value: 'Onay Bekliyor'},
          { key: 'approved', value: 'Onaylandı'},
          { key: 'rejected', value: 'Geri Çevrildi'},
        ];
        break;
      }
      case 'customer-account': {
        this.pnlBeginDate = true;
        this.pnlFinishDate = true;
        break;
      }
      case 'customer': {
        this.pnlIsActive = true;
        break;
      }
      case 'customer-target': {
        this.pnlIsActive = true;
        break;
      }
      case 'visit': {
        this.pnlBeginDate = true;
        this.pnlFinishDate = true;
        break;
      }
      case 'crm': {
        this.pnlBeginDate = true;
        this.pnlFinishDate = true;
        break;
      }
      case 'product': {
        this.pnlIsActive = true;
        this.pnlProductStockType = true;
        break;
      }
      case 'notification': {
        this.pnlBeginDate = true;
        this.pnlFinishDate = true;
        break;
      }
      case 'reminder': {
        this.pnlPeriodType = true;
        break;
      }
      case 'account-transaction': {
        this.pnlBeginDate = true;
        this.pnlFinishDate = true;
        break;
      }
      case 'mail-sender': {
        this.pnlBeginDate = true;
        this.pnlFinishDate = true;
        break;
      }
      case 'to-do-list': {
        this.pnlBeginDate = true;
        this.pnlFinishDate = true;
        this.pnlIsActive = true;
        break;
      }
      case 'buy-sell-currency': {
        this.pnlBeginDate = true;
        this.pnlFinishDate = true;
        break;
      }
      default: {
        this.pnlBeginDate = false;
        this.pnlFinishDate = false;
        this.pnlStatus = false;
        this.pnlIsActive = false;
        this.pnlProductStockType = false;
        this.pnlPersonal = false;
        this.pnlPeriodType = false;
        break;
      }
  }
}

  async btnSubmitFilter_Click() {
    try {
      this.passEntry.emit(this.mainFilter);
      this.activeModal.close(this.mainFilter);
    } catch (error) {
      await this.infoService.error(error);
    }
  }
}
