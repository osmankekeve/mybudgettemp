import {Component, OnInit, Input, Output, EventEmitter} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {ProductModel} from '../../models/product-model';
import {ProductService} from '../../services/product.service';
import {ProductMainModel} from '../../models/product-main-model';
import {PriceListService} from '../../services/price-list.service';
import {InformationService} from '../../services/information.service';

@Component({
  selector: 'app-product-select',
  templateUrl: 'product-select.component.html'
})

export class ProductSelectComponent implements OnInit {

  @Input() public product: ProductMainModel;
  @Output() passEntry: EventEmitter<any> = new EventEmitter();
  productList: Array<ProductMainModel>;
  searchText: '';

  constructor(public activeModal: NgbActiveModal, protected pService: ProductService, protected infoService: InformationService) {
  }

  async ngOnInit(): Promise<void> {
    if (this.product === null) {
      this.product = this.pService.clearMainModel();
    }
    const list = Array<string>();
    list.push('normal');
    Promise.all([this.pService.getProductsForSelection(list)]).then((values: any) => {
      this.productList = [];
      if (values[0] !== undefined || values[0] !== null) {
        const returnData = values[0] as Array<ProductMainModel>;
        returnData.forEach(value => {
          this.productList.push(value);
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
