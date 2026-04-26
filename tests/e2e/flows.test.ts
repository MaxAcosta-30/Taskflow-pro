import { test, expect, type Page } from '@playwright/test';

test.describe('TaskFlow Pro - E2E User Flows', () => {
  
  test('Authentication Flow: Register and Login', async ({ page }) => {
    // 1. Registro
    await page.goto('/register');
    await page.fill('input[name="name"]', 'New User');
    await page.fill('input[name="email"]', 'newuser@example.com');
    await page.fill('input[name="password"]', 'Password123');
    await page.click('button[type="submit"]');

    // Debería redirigir al dashboard
    await expect(page).toHaveURL('/');
    await expect(page.locator('text=New User')).toBeVisible();

    // 2. Logout
    await page.click('button:has-text("Cerrar sesión")');
    await expect(page).toHaveURL('/login');

    // 3. Login
    await page.fill('input[name="email"]', 'newuser@example.com');
    await page.fill('input[name="password"]', 'Password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/');
  });

  test('Kanban Flow: Board creation, task creation and drag&drop', async ({ page }) => {
    // Login con usuario del seed
    await login(page, 'alice@taskflow.pro', 'password123');

    // 1. Crear nuevo tablero
    await page.click('button:has-text("Nuevo tablero")');
    await page.fill('input[name="name"]', 'E2E Testing Board');
    await page.click('button:has-text("Crear")');
    
    await expect(page).toHaveURL(/\/board\/.+/);
    await expect(page.locator('h1')).toHaveText('E2E Testing Board');

    // 2. Crear tarea
    const backlogColumn = page.locator('[data-column-name="Backlog"]');
    await backlogColumn.getByRole('button', { name: /Agregar tarea/i }).click();
    await page.fill('input[placeholder="Título de la tarea"]', 'My E2E Task');
    await page.keyboard.press('Enter');

    await expect(page.locator('text=My E2E Task')).toBeVisible();

    // 3. Drag and Drop (Simulado mediante click y mover si el DND es complejo)
    // Nota: Dependiendo de dnd-kit, a veces se requiere un helper de drag and drop
    const taskCard = page.locator('text=My E2E Task');
    const todoColumn = page.locator('[data-column-name="To Do"]');
    
    await taskCard.dragTo(todoColumn);
    
    // Verificar persistencia tras recarga
    await page.reload();
    const todoColumnAfterReload = page.locator('[data-column-name="To Do"]');
    await expect(todoColumnAfterReload.locator('text=My E2E Task')).toBeVisible();
  });

  test('Automation Flow: Create and monitor runs', async ({ page }) => {
    await login(page, 'alice@taskflow.pro', 'password123');
    await page.goto('/automations');

    await page.click('button:has-text("Nueva automatización")');
    await page.fill('input[name="name"]', 'E2E Auto');
    
    // Seleccionar trigger (ej: TASK_MOVED)
    await page.click('text=Seleccionar trigger');
    await page.click('text=Tarea movida');
    
    // Agregar acción (ej: SEND_NOTIFICATION)
    await page.click('text=Agregar acción');
    await page.click('text=Enviar notificación');
    await page.fill('input[name="actions.0.config.title"]', 'E2E Alert');
    await page.fill('textarea[name="actions.0.config.body"]', 'Automation works');

    await page.click('button:has-text("Guardar automatización")');
    
    await expect(page.locator('text=E2E Auto')).toBeVisible();
    await expect(page.locator('text=Activa')).toBeVisible();
  });

  test('Real-time: Multi-user sync', async ({ browser }) => {
    // Crear dos contextos de navegador independientes
    const aliceContext = await browser.newContext();
    const bobContext = await browser.newContext();

    const alicePage = await aliceContext.newPage();
    const bobPage = await bobContext.newPage();

    // Login en ambos
    await login(alicePage, 'alice@taskflow.pro', 'password123');
    await login(bobPage, 'bob@taskflow.pro', 'password123');

    // Ambos van al mismo tablero (usando el primero del seed)
    await alicePage.goto('/');
    await alicePage.click('text=🚀 Product Launch');
    const boardUrl = alicePage.url();
    await bobPage.goto(boardUrl);

    // Alice crea una tarea
    const aliceBacklog = alicePage.locator('[data-column-name="Backlog"]');
    await aliceBacklog.getByRole('button', { name: /Agregar tarea/i }).click();
    await alicePage.fill('input[placeholder="Título de la tarea"]', 'Real-time Task');
    await alicePage.keyboard.press('Enter');

    // Bob debería verla SIN recargar (WebSockets)
    await expect(bobPage.locator('text=Real-time Task')).toBeVisible({ timeout: 5000 });

    await aliceContext.close();
    await bobContext.close();
  });
});

async function login(page: Page, email: string, pass: string) {
  await page.goto('/login');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', pass);
  await page.click('button[type="submit"]');
  await page.waitForURL('/');
}
