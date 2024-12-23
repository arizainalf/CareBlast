import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'pasiens'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('name')
      table.string('no_hp')
      table.string('alamat')
      table.enum('jenis', [
        'Prolanis Kelompok HT 1',
        'Prolanis Kelompok HT 2',
        'Prolanis Kelompok DM',
        'TB Paru',
      ])
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
