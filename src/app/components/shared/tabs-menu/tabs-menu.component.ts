import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';

@Component({
  selector: 'tabs-menu',
  templateUrl: './tabs-menu.component.html',
  styleUrls: ['./tabs-menu.component.css'],
})
export class TabsMenuComponent implements OnInit {
  @Input() items: any[] = [];
  @Input() default?: string;
  tabSelected: any;
  @Output() public tabSelectedOutput = new EventEmitter<any>();

  ngOnInit(): void {
    if (this.default) {
      this.tabSelected = this.default;
    } else if (this.items.length > 0) {
      this.tabSelected = this.items[0].name;
    }
  }

  changeTab(name: string) {
    this.tabSelected = name;
    this.tabSelectedOutput.emit(this.tabSelected);
  }
}
