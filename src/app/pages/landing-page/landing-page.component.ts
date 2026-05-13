import { Component } from '@angular/core';

@Component({
  selector: 'app-landing-page',
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.css']
})
export class LandingPageComponent {

  // Características o Beneficios
  features = [
    {
      icon: 'storefront', // Puedes cambiar estos íconos según tus necesidades. Estos son nombres de íconos de Material Icons.
      title: 'Gestión de Ventas',
      description: 'Administra tus ventas de manera eficiente y sencilla.'
    },
    {
      icon: 'inventory_2',
      title: 'Control de Inventario',
      description: 'Mantén un registro detallado de tus productos y existencias.'
    },
    {
      icon: 'people',
      title: 'Relaciones con Clientes',
      description: 'Gestiona la información de tus clientes y mejora la relación con ellos.'
    },
    // ... puedes agregar más características aquí
  ];

  // Testimonios
  testimonials = [
    {
      quote: 'Esta aplicación ha transformado la manera en que gestiono mi negocio. ¡Es increíble!',
      author: 'Juan Pérez'
    },
    {
      quote: 'El control de inventario nunca ha sido tan fácil. Recomiendo esta herramienta a todos los comerciantes.',
      author: 'María González'
    },
    // ... puedes agregar más testimonios aquí
  ];

  constructor() { }

  navigateToApp() {
    // Aquí puedes agregar la lógica para navegar a la aplicación principal o realizar otra acción.
  }

  navigateToSignUp() {
    // Aquí puedes agregar la lógica para navegar a la página de registro o realizar otra acción.
  }

}
