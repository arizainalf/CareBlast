import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import Spesialist from './spesialist.js'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

export default class Dokter extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare nip: string

  @column()
  declare nama: string

  @column()
  declare spesialistId: number

  @column()
  declare jamMulai: string

  @column()
  declare jamSelesai: string

  @column()
  declare status: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Spesialist)
  declare spesialist: BelongsTo<typeof Spesialist>
}