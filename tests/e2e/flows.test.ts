import { test, expect, type Page } from '@playwright/test'

// Flujos críticos sobre la app real y los datos del seed (prisma/seed.ts):
// tableros "Infraestructura", "Marketing y diseño" y "Lanzamiento" con columnas Pendiente → Hecho.

async function login(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.fill('input[name="email"]', email)
  await page.fill('input[name="password"]', password)
  await page.click('button[type="submit"]')
  await expect(page).toHaveURL('/')
}

async function abrirTablero(page: Page, nombre: string) {
  await page
    .getByRole('main')
    .getByRole('link', { name: new RegExp(`^${nombre}`) })
    .click()
  await expect(page).toHaveURL(/\/board\/.+/)
  await expect(page.locator('[data-column-name="Pendiente"]')).toBeVisible()
}

async function agregarTarea(page: Page, columna: string, titulo: string) {
  const col = page.locator(`[data-column-name="${columna}"]`)
  await col.getByRole('button', { name: /Agregar tarea/i }).click()
  await col.getByPlaceholder(/Nombre de la tarea/).fill(titulo)
  await page.keyboard.press('Enter')
  await expect(col.getByText(titulo)).toBeVisible()
}

test.describe('TaskFlow Pro - E2E User Flows', () => {
  test('Autenticación: registro, cierre de sesión y acceso', async ({ page }) => {
    const correo = `nuevo-${Date.now()}@example.com`
    await page.goto('/register')
    await page.fill('input[name="name"]', 'Nora Usuario')
    await page.fill('input[name="email"]', correo)
    await page.fill('input[name="password"]', 'Password123')
    await page.click('button[type="submit"]')

    await expect(page).toHaveURL('/')
    await expect(page.getByRole('heading', { name: /Hola, Nora/ })).toBeVisible()

    await page.getByRole('button', { name: 'Cerrar sesión' }).click()
    await expect(page).toHaveURL(/\/login/)

    await login(page, correo, 'Password123')
  })

  test('Tablero: una tarea nueva se guarda y sigue ahí al recargar', async ({ page }) => {
    await login(page, 'alice@taskflow.pro', 'password123')
    await abrirTablero(page, 'Lanzamiento')

    const titulo = `Tarea E2E ${Date.now()}`
    await agregarTarea(page, 'Pendiente', titulo)

    await page.reload()
    await expect(page.locator('[data-column-name="Pendiente"]').getByText(titulo)).toBeVisible()
  })

  test('Automatización: se crea con un webhook y aparece en la lista', async ({ page }) => {
    await login(page, 'alice@taskflow.pro', 'password123')
    await page.goto('/automations')
    await page
      .getByRole('link', { name: /Nueva Automatización/i })
      .first()
      .click()

    const nombre = `Auto E2E ${Date.now()}`
    await page.getByPlaceholder('Nombre de la automatización...').fill(nombre)
    await page.getByRole('button', { name: /Tarea movida/ }).click()
    await page.getByRole('button', { name: 'Añadir paso' }).click()
    await page.getByRole('button', { name: /Llamar a un Webhook/ }).click()
    await page.getByPlaceholder('https://hooks.slack.com/...').fill('https://example.com/webhook')
    await page.getByRole('button', { name: 'Guardar automatización' }).click()

    await expect(page).toHaveURL(/\/automations$/)
    await expect(page.getByText(nombre)).toBeVisible()
  })

  test('Tiempo real: lo que crea Alicia le aparece a Roberto sin recargar', async ({ browser }) => {
    const alicia = await (await browser.newContext()).newPage()
    const roberto = await (await browser.newContext()).newPage()

    await login(alicia, 'alice@taskflow.pro', 'password123')
    await login(roberto, 'bob@taskflow.pro', 'password123')

    await abrirTablero(alicia, 'Lanzamiento')
    await roberto.goto(alicia.url())
    await expect(roberto.locator('[data-column-name="Pendiente"]')).toBeVisible()

    const titulo = `Tiempo real ${Date.now()}`
    await agregarTarea(alicia, 'Pendiente', titulo)

    await expect(roberto.locator('[data-column-name="Pendiente"]').getByText(titulo)).toBeVisible({
      timeout: 10_000,
    })
  })
})
