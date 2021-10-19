import { Component, OnInit } from '@angular/core';
import { HeaderText, IHeaderText } from 'src/app/utility/HeaderText';

@Component({
  selector: 'app-history',
  templateUrl: './kaoc-history.component.html',
  styleUrls: ['./kaoc-history.component.scss']
})
export class KaocHistoryComponent implements OnInit {

  constructor(private headerText: HeaderText) {
    this.headerText.setHeaderText({
      title: 'About KAOC',
      subTitle: 'KAOC is a registered non-profit organization'
    } as IHeaderText);
  }

  ngOnInit() {
  }

}
