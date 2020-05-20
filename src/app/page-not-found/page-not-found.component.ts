import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-page-not-found',
  template: `
    <div class="notPage mt-5">
      <h2>404</h2>
      <p>Aradığınız sayfa bulunamadı.<br><br>
    </div>
  `,
  styles: []
})
export class PageNotFoundComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
