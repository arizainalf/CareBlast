
import puppeteer from 'puppeteer'

export default async function generatePdf(html: string): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })
  const page = await browser.newPage()

  await page.setContent(html, {
    waitUntil: 'networkidle0',
  })

  const pdf = await page.pdf({ format: 'A4', printBackground: true })

  await browser.close()
  return Buffer.from(pdf)
}
