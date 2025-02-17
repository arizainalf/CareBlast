import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import { v4 as uuidv4 } from 'uuid'
import JenisPenyakit from '#models/jenis_penyakit'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

export default class Pasien extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare uuid: string

  @column()
  declare jenisPenyakitId: number | null

  @belongsTo(() => JenisPenyakit)
  declare jenisPenyakit: BelongsTo<typeof JenisPenyakit>

  @column()
  declare name: string

  @column()
  declare tempat: string

  @column.date()
  declare tanggal_lahir: DateTime

  @column()
  declare no_hp: string

  @column()
  declare alamat: string

  @column()
  declare jenis_kelamin: string

  @column()
  declare nik: string

  @column()
  declare golongan_darah: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  public static async generateUuid(pasien: Pasien) {
    pasien.uuid = uuidv4()
  }
}
