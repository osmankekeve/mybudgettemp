import {Component, OnInit, Input, Output, EventEmitter} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {ProductModel} from '../../models/product-model';
import {ProductService} from '../../services/product.service';
import {ProductMainModel} from '../../models/product-main-model';
import {PriceListService} from '../../services/price-list.service';
import {InformationService} from '../../services/information.service';
import {SalesOrderMainModel} from '../../models/sales-order-main-model';
import {SalesOrderService} from '../../services/sales-order.service';
import {Router} from '@angular/router';
import {PurchaseOrderService} from '../../services/purchase-order.service';

@Component({
  selector: 'app-order-select',
  templateUrl: 'order-select.component.html'
})

export class OrderSelectComponent implements OnInit {

  @Input() public list: Array<string>;
  @Input() public customerPrimaryKey: string;
  @Input() public orderType: string;
  @Output() passEntry: EventEmitter<any> = new EventEmitter();
  orderList: Array<SalesOrderMainModel>;
  searchText: '';

  constructor(public activeModal: NgbActiveModal, protected soService: SalesOrderService, protected poService: PurchaseOrderService, protected route: Router,
              protected infoService: InformationService) {
  }

  async ngOnInit(): Promise<void> {
    const module = this.route.url.replace('/', '');
    if (this.list === undefined) {
      this.list = [];
    }
    if (module === 'sales-invoice') {
      Promise.all([this.soService.getOrdersMain(this.customerPrimaryKey, this.orderType)]).then((values: any) => {
        this.orderList = [];
        if (values[0] !== null) {
          const returnData = values[0] as Array<SalesOrderMainModel>;
          returnData.forEach(value => {
            this.orderList.push(value);
          });
        }
      });
    } else if (module === 'purchaseInvoice') {
      Promise.all([this.poService.getOrdersMain(this.customerPrimaryKey, this.orderType)]).then((values: any) => {
        this.orderList = [];
        if (values[0] !== null) {
          const returnData = values[0] as Array<SalesOrderMainModel>;
          returnData.forEach(value => {
            this.orderList.push(value);
          });
        }
      });
    } else {

    }
  }

  markSelected(selectedOrder: SalesOrderMainModel) {
    if (this.list.indexOf(selectedOrder.data.primaryKey) > -1) {
      this.list.splice(this.list.indexOf(selectedOrder.data.primaryKey), 1);
    } else {
      this.list.push(selectedOrder.data.primaryKey);
    }
  }

  async btnSelect_Click() {
    try {
      this.passEntry.emit(this.list);
      this.activeModal.close(this.list);
    } catch (error) {
      await this.infoService.error(error);
    }
  }
}
