import vine from '@vinejs/vine'

export const LoginValidator = vine.compile(
    vine.object({
        email: vine.string().email().trim(),
        password: vine.string().trim(),
    })
)