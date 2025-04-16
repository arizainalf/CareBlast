import { DateTime } from 'luxon'
import {
  BaseModel,
  column,
  belongsTo,
  hasMany,
  beforeCreate,
  beforeDelete,
} from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Pasien from '#models/pasien'
import ObatPasien from '#models/obat_pasien'
import Dokter from '#models/dokter'
import { v4 as uuidv4 } from 'uuid'

export default class Kunjungan extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare uuid: string

  @column()
  declare dokterId: number

  @belongsTo(() => Dokter)
  declare dokter: BelongsTo<typeof Dokter>

  @column()
  declare pasienId: number

  @belongsTo(() => Pasien)
  declare pasien: BelongsTo<typeof Pasien>

  @column()
  declare tema: string

  @column()
  declare keterangan: string

  @column.date()
  declare tanggalKunjungan: DateTime

  @column.date()
  declare kunjunganBerikutnya: DateTime

  @hasMany(() => ObatPasien)
  declare obatPasiens: HasMany<typeof ObatPasien>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  
  @beforeCreate()
  public static assignUuid(kunjungan: Kunjungan) {
    kunjungan.uuid = uuidv4()
  }

  @beforeDelete()
  public static async hapusRelasi(kunjungan: Kunjungan) {
    console.log(`Deleting ObatPasien records for kunjungan ID: ${kunjungan.id}`)
    await ObatPasien.query().where('kunjunganId', kunjungan.id).delete()
    console.log('ObatPasien records deleted successfully')
  }
}
