import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'main-content-area',
  templateUrl: './main-content-area.component.html',
  styleUrls: ['./main-content-area.component.css']
})



export class MainContentAreaComponent implements OnInit {
  tiles: Tile[] = [
    {text: 'One', cols: 3, rows: 3, color: 'lightblue'},
    {text: 'Two', cols: 1, rows: 2, color: 'lightgreen'},
    {text: 'Three', cols: 1, rows: 2, color: 'lightgreen'},
    {text: 'Four', cols: 3, rows: 3, color: 'green'},

  ];

  constructor() { }

  ngOnInit() {
  }

}

export interface Tile {
  color: string;
  cols: number;
  rows: number;
  text: string;
}