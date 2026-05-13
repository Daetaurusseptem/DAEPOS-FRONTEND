import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SalesService } from 'src/app/services/sales.service';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { Sale, User } from 'src/app/interfaces/models.interface';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-sale-detail',
  templateUrl: './sale-detail.component.html',
  styleUrls: ['./sale-detail.component.css']
})
export class SaleDetailComponent implements OnInit {
  saleId!: string;
  sale!: Sale;
  usuario!: User;
  products: any;

  constructor(
    private route: ActivatedRoute,
    private salesService: SalesService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.saleId = this.route.snapshot.paramMap.get('saleId')!;
    this.loadSale();
  }

  loadSale() {
    this.salesService.getSaleById(this.saleId).subscribe((response) => {
      this.sale = response.sale!;
      console.log(this.sale);
      this.usuario = response!.sale?.user as User;
      this.products = response.sale!.productsSold!;
      console.log(this.products);
    });
  }

  getModificationsTotalPrice(modifications: any[]): number {
    if (!modifications || modifications.length === 0) {
      return 0;
    }
    return modifications.reduce((sum, mod) => sum + (mod.extraPrice || 0), 0);
  }

  generarPDF() {
    const doc = new jsPDF();

    let currentY = 10;
    const marginX = 10;

    // Header
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Detalle de Venta', marginX, currentY);
    currentY += 10;

    // Sale Information
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Usuario: ${this.usuario.name}`, marginX, currentY);
    currentY += 6;
    doc.text(`Fecha: ${new Date(this.sale.date).toLocaleDateString()}`, marginX, currentY);
    currentY += 6;
    doc.text(`Total: ${this.sale.total.toFixed(2)} MXN`, marginX, currentY);
    currentY += 6;

    if (this.sale.paymentMethod === 'cash') {
      doc.text(`Pago con: ${this.sale.receivedAmount?.toFixed(2)} MXN`, marginX, currentY);
      currentY += 6;
      doc.text(`Cambio: ${this.sale.change?.toFixed(2)} MXN`, marginX, currentY);
      currentY += 6;
    } else if (this.sale.paymentMethod === 'credit') {
      doc.text(`Referencia de Pago: ${this.sale.paymentReference}`, marginX, currentY);
      currentY += 6;
    }

    currentY += 10;

    // Product Table Header
    doc.setFont('helvetica', 'bold');
    doc.text('Productos Vendidos:', marginX, currentY);
    currentY += 8;

    // Table Columns
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Producto', marginX, currentY);
    doc.text('Cantidad', marginX + 60, currentY);
    doc.text('Precio Unitario', marginX + 100, currentY);
    doc.text('Precio Modificaciones', marginX + 140, currentY);
    doc.text('Total', marginX + 180, currentY);
    currentY += 6;

    doc.setFont('helvetica', 'normal');

    // Product Details
    this.products.forEach((product: any) => {
      const modificationsPrice = this.getModificationsTotalPrice(product.modifications);
      const unitPriceWithMods = product.unitPrice + modificationsPrice;
      const totalPrice = unitPriceWithMods * product.quantity;

      doc.text(`${product.product.name}`, marginX, currentY);
      doc.text(`${product.quantity}`, marginX + 60, currentY);
      doc.text(`${product.unitPrice.toFixed(2)} MXN`, marginX + 100, currentY);
      doc.text(`${modificationsPrice.toFixed(2)} MXN`, marginX + 140, currentY);
      doc.text(`${totalPrice.toFixed(2)} MXN`, marginX + 180, currentY);
      currentY += 6;

      if (product.modifications.length > 0) {
        product.modifications.forEach((mod: any) => {
          doc.setFontSize(9);
          doc.setTextColor(100);
          doc.text(`- ${mod.name} (+${mod.extraPrice.toFixed(2)} MXN)`, marginX + 5, currentY);
          currentY += 4;
        });
        doc.setFontSize(10);
        doc.setTextColor(0);
      }

      currentY += 4;
    });

    // Footer
    currentY += 10;
    doc.setFont('helvetica', 'bold');
    doc.text('Gracias por su compra', marginX, currentY);

    // Open PDF in a new tab for review
    const pdfBlob = doc.output('blob');
    const url = URL.createObjectURL(pdfBlob);

    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = url;

    document.body.appendChild(iframe);

    iframe.onload = () => {
      console.log('Iframe loaded, attempting to print');
      try {
        iframe.contentWindow!.focus();
        iframe.contentWindow!.print();
        console.log('Print command sent');
      } catch (e) {
        console.error('Print error: ', e);
      }
    };

    iframe.onerror = (error) => {
      console.error('Error loading iframe: ', error);
    };
  }
}
