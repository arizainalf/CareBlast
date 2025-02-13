import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'pasiens'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('uuid').notNullable().unique()
      table
        .integer('jenis_penyakit_id')
        .unsigned()
        .references('id')
        .inTable('jenis_penyakits')
        .onDelete('CASCADE')
        .onUpdate('CASCADE')
      table.string('name')
      table.string('tempat')
      table.date('tanggal_lahir')
      table.string('no_hp')
      table.string('alamat')
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
