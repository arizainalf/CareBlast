import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'groups'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary
      table.string('group_jid').unique().notNullable()
      table.string('group_name').notNullable()
      table.string('owner_jid').nullable()
      table.json('participants').nullable()
      table.string('profile_picture').nullable()
      table.boolean('is_group').defaultTo(true)
      table.timestamp('subject_updated_at').nullable()
      table.string('subject_updated_by').nullable()
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}