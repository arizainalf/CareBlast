import vine from '@vinejs/vine'

export const createUserValidator = vine.compile(
  vine.object({
    fullName: vine.string().minLength(6),
    email: vine.string().trim().minLength(6),
    password: vine.string().trim().minLength(8).maxLength(20),
    phoneNumber: vine.string().trim().maxLength(13),
    role: vine.enum(['super_admin', 'admin']),
    avatar: vine.file({
      size: '2mb',
      extnames: ['jpg', 'png']
    }).optional()
  })
)

export const updateUserValidator = vine.compile(
  vine.object({
    fullName: vine.string().minLength(6),
    email: vine.string().trim().minLength(6),
    password: vine.string().trim().minLength(8).maxLength(20),
    phoneNumber: vine.string().trim().minLength(11).maxLength(13),
    role: vine.enum(['super_admin', 'admin']),
    avatar: vine.file({
      size: '2mb',
      extnames: ['jpg', 'png']
    }).nullable()
  })
)

export const fotoValidator = vine.compile(
  vine.object({
    foto: vine.file({
      size: '2mb',
      extnames: ['jpg', 'png']
    }).nullable()
  })
)