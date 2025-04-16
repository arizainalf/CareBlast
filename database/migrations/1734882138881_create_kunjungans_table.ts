import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'kunjungans'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('uuid').notNullable().unique()
      table.integer('dokter_id').unsigned().references('id').inTable('dokters').onDelete('CASCADE')
      table.integer('pasien_id').unsigned().references('id').inTable('pasiens').onDelete('CASCADE')
      table.string('tema').notNullable().defaultTo('Tanpa Tema')
      table.text('keterangan').nullable()
      table.date('tanggal_kunjungan').notNullable()
      table.date('kunjungan_berikutnya').nullable()
      table.timestamp('created_at').defaultTo(this.now())
      table.timestamp('updated_at').defaultTo(this.now())
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
