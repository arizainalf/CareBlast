import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'contacts'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()
      table.string('pasien_id').nullable().references('uuid')
        .inTable('pasiens').unique()
        .onDelete('CASCADE')
        .onUpdate('CASCADE')
      table.string('user_id').nullable().references('uuid')
        .inTable('users').unique()
        .onDelete('CASCADE')
        .onUpdate('CASCADE')
      table.string('wa_id').unique()
      table.string('username').nullable()
      table.string('name').nullable()
      table.string('profile_picture').defaultTo('/images/users/user.png')
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}