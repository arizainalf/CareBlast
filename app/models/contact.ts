import { DateTime } from 'luxon'
import { BaseModel, column, beforeCreate, hasMany, belongsTo } from '@adonisjs/lucid/orm'
import { v4 as uuidv4 } from 'uuid'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import Messages from '#models/message'
import Pasien from '#models/pasien'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'


export default class Contact extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare pasienId: string // Nullable jika tidak terkait dengan pasien

  @column()
  declare userId: string

  @column()
  declare waId: string

  @column()
  declare username: string

  @column()
  declare name: string

  @column()
  declare profilePicture: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @hasMany(() => Messages)
  declare messagess: HasMany<typeof Messages>
  
  @belongsTo(() => Pasien,{
    foreignKey: 'pasien_id', // Kunci asing yang mengacu pada pasien
    localKey: 'uuid' // Kunci lokal yang digunakan untuk relasi
  })
  declare pasien: BelongsTo<typeof Pasien>

  // @belongsTo(() => Pasien, {
  //   foreignKey: 'user_id', // Kunci asing yang mengacu pada pasien
  //   localKey: 'uuid' // Kunci lokal yang digunakan untuk relasi
  // })
  // declare user: BelongsTo<typeof Pasien>

  @beforeCreate()
  public static assignUuid(contact: Contact) {
    contact.id = uuidv4() // Generate UUID untuk ID unik
  }
}