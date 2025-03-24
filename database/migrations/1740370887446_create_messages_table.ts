import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'messages'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()

      table.string('contact_id').notNullable().references('id')
        .inTable('contacts')
        .onDelete('CASCADE')
        .onUpdate('CASCADE')

      table.boolean('from_me').defaultTo(false)
      table.string('message_id').unique().notNullable()
      table.string('message_type').notNullable()
      table.text('content').notNullable()

      table.string('group_id').nullable().references('id')
        .inTable('groups')
        .onDelete('CASCADE')
        .onUpdate('CASCADE')

      table.boolean('is_hasil_lab').defaultTo(false)
      table.string('file_name').nullable()
      table.string('file_path').nullable()

      table.timestamp('timestamp')
      table.timestamp('created_at').defaultTo(this.now())
      table.timestamp('updated_at').defaultTo(this.now())
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
