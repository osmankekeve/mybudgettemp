import {Component, OnInit} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {Router} from '@angular/router';

@Component({
  selector: 'app-info-module',
  templateUrl: 'info-module.component.html'
})

export class InfoModuleComponent implements OnInit {

  constructor(public activeModal: NgbActiveModal, protected route: Router) {
  }

  mainList = [];
  headerTitle = '';

  ngOnInit(): void {
    const module = this.route.url.replace('/', '');
    if (module === 'product') {
      this.headerTitle = 'Ürünler';
      this.mainList = [
        { key: 'Ürün kodları sistemde tekil olmalıdır.'},
        { key: 'İlk kayıttan sonra \'Ürün Kodu\', \'Ürün Tipi\', \'Ürün Birimi\' değiştirilemez.'},
        { key: 'Dosyalar; sekmesinden dosyalar yükleyebilirsiniz.'},
        { key: 'İşlemler; sekmesinden son yapılan işlemleri görüntüleyebilirsiniz.'},
        { key: 'Ürün Birimleri; arayüzünde bulunan \'Birimleri Oluştur\' tuşu ile, eksik olan birimler otomatik oluşturulur.'},
        { key: 'Ürün; \'Fiyat Listesi\' nde, \'İskonto Listesi\' nde, \'Sipariş\' te kullanılırsa silinemez.'},
        { key: 'Otomatik ürün kodu için ayarlar bölümünden gerekli seçimler yapılmalıdır.'},
      ];
    }
    if (module === 'sales-offer') {
      this.headerTitle = 'Satış Teklifi';
      this.mainList = [
        { key: 'Müşteri sekmesinde, \'Müşteri\' ve \'Tedarikçi-Müşteri\' tipindeki müşteriler görüntülenir.'},
        { key: '\'Fiyat Listesi\' ve \'İskonto Listesi\' aktif olmalıdır.'},
        { key: 'Müşteri sevk adresi seçilmesi gereklidir, Sevk adresi işlemleri \'Müşteri Kartı\' ndan yapılmaktadır..'},
        { key: 'Teklif onaylandıktan sonra silinemez sadece iptal edilebilir.'},
        { key: 'Seçilen ürün, fiyat yada iskonto listesinde bilgisi varsa ilgili alanlarda gösterilir, dilenirse bu alanlar değiştirilebilir.'},
        { key: 'Teklif silinirse, detayı ile birlikte tüm bilgileri kaldırılır.'},
        { key: 'Otomatik fiş numarası için ayarlar bölümünden gerekli seçimler yapılmalıdır.'},
      ];
    }
    if (module === 'sales-order') {
      this.headerTitle = 'Satış Siparişi';
      this.mainList = [
        { key: 'Teklif onaylandıktan sonra sipariş süreci başlar, sonraki adım faturalamadır.'},
        { key: 'Siparişte değişiklik yapılmak isteniyorsa, \' Teklife Geri Gönder\' tuşu ile onay belkiyor durumuna çevrilebilir.'},
        { key: 'Faturası kesilen sipariş, Teklife geri gönderilemez.'},
        { key: 'Parçalı fatura işlemi yapıldı ise, açık kalan kalemler \'Siparişi Kapat\' tuşu ile kapatılabilir, Teklife geri gönderilemez.'}
      ];
    }
    if (module === 'sales-invoice') {
      this.headerTitle = 'Satış Faturası';
      this.mainList = [
        { key: 'Onaylanmış siparişler faturalaştırılabilmektedir.'},
        { key: 'Çoklu sipariş seçimi yapılarak, birden fazla sipariş tek faturada birleştirilebilir.'},
        { key: 'Seçilen siparişlerin faturalaştırılmayan miktarı kadar ürün fatura edilebilir.'},
        { key: 'İptal edilen faturalara bağlı siparişler yeniden aktif hale gelir.'},
        { key: 'Tüm kalemleri faturalaştırılan siparişler diğer işlemlere kapatılır.'},
        { key: 'Otomatik fiş numarası için ayarlar bölümünden gerekli seçimler yapılmalıdır.'},
      ];
    }
    if (module === 'customer') {
      this.headerTitle = 'Müşteri';
      this.mainList = [];
    }
    if (module === 'purchase-offer') {
      this.headerTitle = 'Alım Teklifi';
      this.mainList = [
        { key: 'Müşteri sekmesinde, \'Tedarikçi\' ve \'Tedarikçi-Müşteri\' tipindeki müşteriler görüntülenir.'},
        { key: '\'Fiyat Listesi\' ve \'İskonto Listesi\' aktif olmalıdır.'},
        { key: 'Teklif onaylandıktan sonra silinemez sadece iptal edilebilir.'},
        { key: 'Seçilen ürün, fiyat yada iskonto listesinde bilgisi varsa ilgili alanlarda gösterilir, dilenirse bu alanlar değiştirilebilir.'},
        { key: 'Teklif silinirse, detayı ile birlikte tüm bilgileri kaldırılır.'},
        { key: 'Otomatik fiş numarası için ayarlar bölümünden gerekli seçimler yapılmalıdır.'},
      ];
    }
    if (module === 'purchase-order') {
      this.headerTitle = 'Alım Siparişi';
      this.mainList = [
        { key: 'Teklif onaylandıktan sonra sipariş süreci başlar, sonraki adım faturalamadır.'},
        { key: 'Siparişte değişiklik yapılmak isteniyorsa, \' Teklife Geri Gönder\' tuşu ile onay belkiyor durumuna çevrilebilir.'},
        { key: 'Faturası kesilen sipariş, Teklife geri gönderilemez.'},
        { key: 'Parçalı fatura işlemi yapıldı ise, açık kalan kalemler \'Siparişi Kapat\' tuşu ile kapatılabilir, Teklife geri gönderilemez.'}
      ];
    }
    if (module === 'purchaseInvoice') {
      this.headerTitle = 'Alım Faturası';
      this.mainList = [
        { key: 'Onaylanmış siparişler faturalaştırılabilmektedir.'},
        { key: 'Çoklu sipariş seçimi yapılarak, birden fazla sipariş tek faturada birleştirilebilir.'},
        { key: 'Seçilen siparişlerin faturalaştırılmayan miktarı kadar ürün fatura edilebilir.'},
        { key: 'İptal edilen faturalara bağlı siparişler yeniden aktif hale gelir.'},
        { key: 'Tüm kalemleri faturalaştırılan siparişler diğer işlemlere kapatılır.'},
        { key: 'Otomatik fiş numarası için ayarlar bölümünden gerekli seçimler yapılmalıdır.'},
      ];
    }
  }
}
