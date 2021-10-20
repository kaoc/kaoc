import { Component, OnInit } from '@angular/core';
import { HeaderText, IHeaderText } from 'src/app/utility/HeaderText';

@Component({
  selector: 'app-kaoc-bye-law',
  templateUrl: './kaoc-bye-law.component.html',
  styleUrls: ['./kaoc-bye-law.component.css']
})
export class KaocByeLawComponent implements OnInit {

  constructor(private headerText: HeaderText) {
    this.headerText.setHeaderText({
      title: 'KAOC Bylaw'
    } as IHeaderText);
  }

  ngOnInit() {
  }

}
