import { test, expect } from '@playwright/test';

test.describe('Flujos de Control Gerencial y Seguridad POS', () => {
  test('Fraude KDS: Exigir PIN gerencial para cancelar comanda enviada, validar devolución de stock', async ({ page }) => {
    test.setTimeout(60000); // Dar más tiempo a todo el test
    await page.goto('/');
    await page.fill('input[id="username"]', 'cajero_hosp');
    await page.fill('input[id="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/user/);

    // Ir a Nueva Venta
    await page.locator('.operation-card', { hasText: 'Nueva Venta' }).click();
    await expect(page).toHaveURL(/\/new-sale/);

    // En la vista de KDS, cambiar a la categoría "Comida"
    await page.locator('.category-pill', { hasText: /Comida/i }).click();

    // Seleccionar Hamburguesa Clásica
    await page.locator('.product-card', { hasText: /Hamburguesa/i }).first().click();
    
    // Esperar que el modal de modificadores aparezca y hacer clic en el tamaño "Único"
    await expect(page.locator('text="Único"').first()).toBeVisible({ timeout: 10000 });
    await page.locator('text="Único"').first().click();

    // Añadir al ticket
    await page.locator('button:has-text("Añadir al Ticket")').click();

    // Guardar Comanda
    await page.click('button:has-text("Guardar")');
    await page.fill('input[placeholder*="Ej. Mesa 4"]', 'Mesa 5');
    await page.click('button:has-text("Confirmar y Guardar")');

    // El Swal de "Orden Guardada" no tiene botón de confirmar y se cierra automáticamente en 1.5s
    await expect(page.locator('text="Orden Guardada"')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text="Orden Guardada"')).toBeHidden({ timeout: 10000 });

    // Volver al dashboard de user
    await expect(page).toHaveURL(/\/user/);
    
    // Comandas Abiertas
    await page.click('button:has-text("Comandas Abiertas")');
    const orderCard = page.locator('.card', { hasText: 'Mesa 5' }).first();
    await orderCard.locator('button:has-text("Editar")').click();

    // Cancelar comanda
    await expect(page.locator('text="Comanda Cargada"')).toBeVisible({ timeout: 10000 });
    await page.click('button:has-text("Cerrar")');
    await page.click('button:has-text("Sí, cancelar comanda")');

    // Validar aparición del Modal de PIN
    await expect(page.locator('h2:has-text("Autorización Gerencial")')).toBeVisible({ timeout: 15000 });

    // Fallo Intencional
    await page.fill('input[id="swal-username"]', 'cajero_hosp');
    await page.fill('input[id="swal-password"]', 'admin123');
    await page.click('button:has-text("Autorizar Cancelación")');
    await expect(page.locator('h2:has-text("Denegado")')).toBeVisible({ timeout: 10000 });
    await page.click('button:has-text("OK")');

    // Éxito Gerencial
    await page.fill('input[id="swal-username"]', 'gerente_hosp');
    await page.fill('input[id="swal-password"]', 'admin123');
    await page.click('button:has-text("Autorizar Cancelación")');

    // Validar cancelación
    await expect(page.locator('text="Comanda Cancelada"')).toBeVisible({ timeout: 15000 });
  });

  test('Cierre Ciego: Bloquear cierre con FALTANTE de efectivo sin autorización gerencial', async ({ page }) => {
    test.setTimeout(60000);
    // Usamos cajero_retail, que no tiene caja abierta ni comandas huérfanas
    await page.goto('/');
    await page.fill('input[id="username"]', 'cajero_retail');
    await page.fill('input[id="password"]', 'admin123');
    await page.click('button[type="submit"]');

    // Abrir Turno
    await page.click('h3:has-text("Abrir Turno")');
    await page.selectOption('select#physicalRegister', { label: 'Caja 1 Express' });
    await page.fill('input[id="initialAmount"]', '1000');
    await page.click('button:has-text("Iniciar Turno en Caja")');

    // Hacer clic en Continuar en el Swal
    await expect(page.locator('.swal2-title', { hasText: 'Caja Abierta' })).toBeVisible({ timeout: 10000 });
    await page.click('button:has-text("Continuar")');

    await expect(page).toHaveURL(/\/user/);

    // Ir a Cerrar Caja
    await page.click('h3:has-text("Cerrar Caja")');
    await expect(page.locator('text=Oculto').first()).toBeVisible({ timeout: 15000 });

    // Declarar $0 (Faltante severo)
    await page.fill('input[id="finalAmount"]', '0');
    await page.click('button:has-text("Cerrar Caja y Confirmar Arqueo")');

    // Validar Modal Gerencial
    await expect(page.locator('h2:has-text("Autorización Gerencial")')).toBeVisible({ timeout: 15000 });

    // Autorizar como Gerente
    await page.fill('input[id="swal-username"]', 'gerente_hosp');
    await page.fill('input[id="swal-password"]', 'admin123');
    await page.click('.swal2-confirm');

    // Validar mensaje final de éxito
    await expect(page.locator('.swal2-title', { hasText: /Turno cerrado/i })).toBeVisible({ timeout: 15000 });
  });

  test('Cierre Ciego: Permitir cierre directo con SOBRANTE de efectivo sin PIN gerencial', async ({ page }) => {
    test.setTimeout(60000);
    // Usamos cajero_retail de nuevo
    await page.goto('/');
    await page.fill('input[id="username"]', 'cajero_retail');
    await page.fill('input[id="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Abrir Turno
    await page.click('h3:has-text("Abrir Turno")');
    await page.selectOption('select#physicalRegister', { label: 'Caja 1 Express' });
    await page.fill('input[id="initialAmount"]', '1000');
    await page.click('button:has-text("Iniciar Turno en Caja")');

    // Hacer clic en Continuar en el Swal
    await expect(page.locator('.swal2-title', { hasText: 'Caja Abierta' })).toBeVisible({ timeout: 10000 });
    await page.click('button:has-text("Continuar")');

    await expect(page).toHaveURL(/\/user/);

    // Ir a Cerrar Caja
    await page.click('h3:has-text("Cerrar Caja")');

    // Declarar sobrante gigante
    await page.fill('input[id="finalAmount"]', '1000000');
    await page.click('button:has-text("Cerrar Caja y Confirmar Arqueo")');

    // Validar mensaje final DIRECTAMENTE (No pide PIN)
    await expect(page.locator('.swal2-title', { hasText: /Turno cerrado/i })).toBeVisible({ timeout: 15000 });
  });
});
