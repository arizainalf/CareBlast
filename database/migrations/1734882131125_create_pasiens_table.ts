import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'pasiens'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('uuid').notNullable().unique()
      table.index(['name', 'tempat'])
      table.string('nik').unique()
      table
        .integer('jenis_penyakit_id')
        .unsigned()
        .references('id')
        .inTable('jenis_penyakits')
        .onDelete('CASCADE')
        .onUpdate('CASCADE')
      table.string('name')
      table.enum('jenis_kelamin', ['Laki-laki', 'Perempuan'])
      table.string('tempat')
      table.date('tanggal_lahir')
      table.string('alamat')
      table.enum('golongan_darah', ['A+', 'B+', 'AB+', 'O+', 'A-', 'B-', 'AB-', 'O-']).nullable()
      table.enum('role', ['Pasien']).defaultTo('Pasien')
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
