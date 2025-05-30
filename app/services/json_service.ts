import fs from 'node:fs'

export async function saveFile(file: string, data: any, type: any) {
  const filePath = file

  let load: any[] = []
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8')
      load = content.trim() ? JSON.parse(content) : []
    } else {
      fs.writeFileSync(filePath, JSON.stringify([]))
    }
  } catch (e) {
    console.error(`[ERROR] Failed to read/parse ${file}:`, e)
    load = []
  }

  load.push(data)

  try {
    fs.writeFileSync(filePath, JSON.stringify(load, null, 2))
    console.log('json service : success simpan ' + type)
  } catch (e) {
    console.error(`[ERROR] Failed to write ${file}:`, e)
  }
}
