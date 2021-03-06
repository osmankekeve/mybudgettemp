import {Component, OnInit, Input, Output, EventEmitter} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {ProductService} from '../../services/product.service';
import {ProductMainModel} from '../../models/product-main-model';
import {InformationService} from '../../services/information.service';
import {Router} from '@angular/router';

@Component({
  selector: 'app-product-select',
  templateUrl: 'product-select.component.html'
})

export class ProductSelectComponent implements OnInit {

  @Input() public product: ProductMainModel;
  @Input() public productTypes: Array<string>;
  @Input() public productStockTypes: Array<string>;
  @Output() passEntry: EventEmitter<any> = new EventEmitter();
  productList: Array<ProductMainModel>;
  searchText: '';

  constructor(public activeModal: NgbActiveModal, protected route: Router,  protected pService: ProductService,
              protected infoService: InformationService) {
  }

  async ngOnInit(): Promise<void> {
    if (this.product === null) {
      this.product = this.pService.clearMainModel();
    }
    if (this.productStockTypes == null || this.productStockTypes.length === 0) {
      this.productStockTypes = ['normal', 'promotion', 'service'];
    }
    if (this.productTypes == null || this.productTypes.length === 0) {
      this.productTypes = ['buy', 'sale', 'buy-sale'];
    }
    const module = this.route.url.replace('/', '');
    Promise.all([this.pService.getProductsForSelection(this.productStockTypes, this.productTypes)]).then((values: any) => {
      this.productList = [];
      if (values[0] !== null) {
        const returnData = values[0] as Array<ProductMainModel>;
        returnData.forEach(value => {
          if (module === 'sales-offer') {
            if (value.data.productType === 'sale' || value.data.productType === 'buy-sale') {
              this.productList.push(value);
            }
          } else if (module === 'purchase-offer') {
            if (value.data.productType === 'buy' || value.data.productType === 'buy-sale') {
              this.productList.push(value);
            }
          } else {
            this.productList.push(value);
          }
        });
      }
    });
  }

  markSelectedProduct(selectedProduct: ProductMainModel) {
    this.product = selectedProduct;
  }

  async btnSelectProduct_Click() {
    try {
      this.passEntry.emit(this.product);
      this.activeModal.close(this.product);
    } catch (error) {
      await this.infoService.error(error);
    }
  }
}
