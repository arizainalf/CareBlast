import { BaseSchema } from '@adonisjs/lucid/schema'

export default class ObatPasiens extends BaseSchema {
  protected tableName = 'obat_pasiens'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()

      table.uuid('uuid').notNullable().unique()

      table
        .integer('pasien_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('pasiens')
        .onDelete('CASCADE')
        .onUpdate('CASCADE')

      table
        .integer('obat_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('obats')
        .onDelete('CASCADE')
        .onUpdate('CASCADE')

      table
        .integer('kunjungan_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('kunjungans')
        .onDelete('CASCADE')
        .onUpdate('CASCADE')

      table.integer('frekuensi').notNullable().comment('Berapa kali sehari minum obat')

      table
        .json('waktu_konsumsi')
        .notNullable()
        .comment('JSON daftar waktu konsumsi, ex: ["08:00", "14:00", "20:00"]')

      table.enum('keterangan_waktu', ['Sebelum makan', 'Sesudah makan']).notNullable()

      table.timestamp('created_at', { useTz: true }).defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).defaultTo(this.now())
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
