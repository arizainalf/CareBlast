import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'jadwals'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('uuid').notNullable().unique()
      table
        .integer('obat_id')
        .unsigned()
        .references('id')
        .inTable('obats')
        .onDelete('CASCADE')
        .notNullable()
      table
        .integer('kunjungan_id')
        .unsigned()
        .references('id')
        .inTable('kunjungans')
        .onDelete('CASCADE').notNullable
      table.json('waktu')
      table.date('tanggal_selesai')
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
