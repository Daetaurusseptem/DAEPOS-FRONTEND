import { test, expect } from '@playwright/test';

test.describe('Flujo de Venta Retail', () => {
  test('Debería iniciar sesión y ver el dashboard', async ({ page }) => {
    // 1. Ir a la página de login
    await page.goto('/');
    
    // 2. Ingresar credenciales del cajero retail (creado en seed-v3.ts)
    await page.fill('input[id="username"]', 'cajero_retail');
    await page.fill('input[id="password"]', 'admin123'); // Password por defecto del seed
    
    // 3. Clic en login
    await page.click('button[type="submit"]');

    // 4. Verificar que entra al dashboard del usuario
    await expect(page).toHaveURL(/\/user/);
    
    // Verificar que aparece el nombre del cajero o algún elemento del dashboard
    await expect(page.locator('h1.cashier-title')).toContainText('Cajero Retail', { timeout: 10000 });
  });
});
