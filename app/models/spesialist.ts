import { DateTime } from 'luxon'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import Dokter from './dokter.js'
import type { HasMany } from '@adonisjs/lucid/types/relations'

export default class Spesialist extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare nama: string

  @column()
  declare gelar: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @hasMany(() => Dokter)
  declare dokter: HasMany<typeof Dokter>
}