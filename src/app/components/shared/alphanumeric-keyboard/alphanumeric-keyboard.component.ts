import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-alphanumeric-keyboard',
  template: `
    <div class="alphanumeric-keyboard card p-3">
      <input type="text" [value]="value" class="form-control mb-3 text-center" readonly>
      <div class="keyboard-rows">
        <div class="keyboard-row d-flex justify-content-center mb-2 p-2" *ngFor="let row of keyboardLayout">
          <button *ngFor="let key of row" 
                  class="btn btn-outline-primary m-1 keyboard-button" 
                  (click)="onKeyPress(key)">
            {{key}}
          </button>
        </div>
      </div>
      <div class="keyboard-actions d-flex justify-content-between mt-3">
        <button class="btn btn-danger flex-grow-1 me-2" (click)="onClear()">Borrar</button>
        <button class="btn btn-success flex-grow-1 ms-2" (click)="onConfirm()">Confirmar</button>
      </div>
    </div>
  `,
  styles: [`
    .alphanumeric-keyboard {
      max-width: 400px; 
      margin: 0 auto;
      border-radius: 10px;
    }
    .keyboard-row {
      display: flex;
      justify-content: center;
    }
    .keyboard-button {
      width: 45px;
      height: 45px;
      font-size: 18px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .keyboard-button:active {
      transform: translateY(2px);
      box-shadow: none;
    }
    .keyboard-actions button {
      font-size: 18px;
      border-radius: 8px;
    }
    .form-control {
      font-size: 20px;
      height: 50px;
    }
  `]
})
export class AlphanumericKeyboardComponent implements OnChanges {
  @Input() value: string = '';
  @Input() numericOnly: boolean = false;
  @Output() valueChange = new EventEmitter<string>();
  @Output() confirm = new EventEmitter<void>();

  keyboardLayout: string[][] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['numericOnly']) {
      this.updateKeyboardLayout();
    }
  }

  updateKeyboardLayout() {
    if (this.numericOnly) {
      this.keyboardLayout = [
        ['1', '2', '3'],
        ['4', '5', '6'],
        ['7', '8', '9'],
        ['0']
      ];
    } else {
      this.keyboardLayout = [
        ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
        ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
        ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
        ['Z', 'X', 'C', 'V', 'B', 'N', 'M', '.']
      ];
    }
  }

  onKeyPress(key: string) {
    this.value += key;
    this.valueChange.emit(this.value);
  }

  onClear() {
    this.value = '';
    this.valueChange.emit(this.value);
  }

  onConfirm() {
    this.confirm.emit();
  }
}
