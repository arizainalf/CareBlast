import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Spesialist from '#models/spesialist'
import Kunjungan from '#models/kunjungan'

export default class Dokter extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare nip: string

  @column()
  declare nama: string

  @column()
  declare noWhatsapp: string

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

  @hasMany(() => Kunjungan)
  declare kunjungan: HasMany<typeof Kunjungan>
}