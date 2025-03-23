import fs from 'node:fs'

export async function saveFile(file: string, data: any, type: any) {
  const filePath = file
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify([]))
  }
  const load = JSON.parse(fs.readFileSync(filePath, 'utf-8'))

  load.push(data)
  fs.writeFileSync(file, JSON.stringify(load, null, 2))
  console.log('success simpan '+ type)
}