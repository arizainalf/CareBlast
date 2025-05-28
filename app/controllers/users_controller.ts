import { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import Contact from '#models/contact'
import { formatWhatsappNumber } from '#services/number_service'
import { getProfilePicture } from '#services/whatsapp_service'
import { join } from 'path'
import { createId } from '@paralleldrive/cuid2'
import fs from 'node:fs'



export default class UsersController {
  /**
   * Display a list of resource
   */
  async index({ view }: HttpContext) {
    const users = await User.query().preload('contact').exec()
    return view.render('users/index', { users })
  }

  /**
   * Handle form submission for the create action
   */
  async store({ request, response }: HttpContext) {
    try {
      const { email, password, fullName, phoneNumber } = request.all()
      const foto = request.file('foto')

      let fotoName = null

      if (foto) {
        fotoName = `${createId()}.${foto.extname}`

        // Path absolut dari root project ke public/images/users
        const targetPath = join('public', 'images', 'users')

        await foto.move(targetPath, {
          name: fotoName,
          overwrite: true,
        })

        fotoName = `/images/users/${fotoName}`

      } else {
        fotoName = '/images/users/user.png'
      }

      const user = await User.create({
        fullName,
        email,
        password,
        foto: fotoName,
      })

      const waId = formatWhatsappNumber(phoneNumber)
      let profilePicture
      try {
        profilePicture = await getProfilePicture(waId)
      } catch (error) {
        console.error('Gagal mengambil foto profil:', error.message)
        profilePicture = 'images/users/user.png'
      }

      if (phoneNumber) {
        await Contact.create({
          userId: user.uuid,
          waId,
          name: fullName,
          username: fullName,
          profilePicture,
        })
      }

      const referer = request.headers().referer

      return response.json({
        success: true,
        message: 'Data berhasil ditambahkan.',
        redirectUrl: referer
      })
    } catch (error) {
      console.log(error)
      return response.json({
        success: false,
        message: 'Error gagal menambahkan data.',
        error
      })
    }
  }

  /**
   * Show individual record
   */
  async show({ params }: HttpContext) {
    const user = await User.findOrFail(params.id)
    return user
  }

  /**
   * Edit individual record
   */
  public async edit({ params, response }: HttpContext) {
    const user = await User.query().preload('contact').where('id', params.id).first();
    return response.json(user);
  }

  public async update({ request, params, response }: HttpContext) {
    const user = await User.findOrFail(params.id);
    const data = request.only(['fullName', 'email', 'role', 'foto']);
    const phoneNumber = request.input('phoneNumber')

    try {
      const foto = request.file('foto')
      if (foto) {
        // Hapus foto lama jika ada
        const oldFotoPath = user.foto

        if (oldFotoPath && !oldFotoPath?.includes('user.png')) {
          const oldFotoFullPath = join('public', oldFotoPath) // Mendapatkan path lengkap dari foto lama
          try {
            fs.unlinkSync(oldFotoFullPath) // Menghapus file lama
          } catch (err) {
            console.log('Error saat menghapus foto lama:', err)
          }
        }

        // Menyimpan foto baru
        const fotoName = `${createId()}.${foto.extname}`
        const targetPath = join('public', 'images', 'users')

        await foto.move(targetPath, {
          name: fotoName,
          overwrite: true,
        })

        // Memperbarui foto path
        user.foto = `/images/users/${fotoName}`
      }

      user.merge({ ...data });

      const contact = await Contact.findBy('user_id', user.uuid)

      const newNoHp = phoneNumber || ''
      const newWaId = formatWhatsappNumber(newNoHp)
      if (!contact && newNoHp) {
        let profilePicture
        try {
          profilePicture = await getProfilePicture(newWaId)
        } catch (error) {
          console.error('Gagal mengambil foto profil:', error.message)
          profilePicture = 'images/users/user.png'
        }

        await Contact.create({
          userId: user.uuid,
          waId: newWaId,
          name: data.fullName,
          username: data.fullName,
          profilePicture,
        })

      } else if (contact) {

        const contactNeedsUpdate =
          contact.waId !== newWaId || contact.name !== data.fullName
        if (contactNeedsUpdate) {
          contact.merge({
            waId: newWaId,
            name: data.fullName,
            username: data.fullName,
          })
          await contact.save()
        }

      }
      await user.save();
      return response.json({ success: true, message: 'Pengguna berhasil diperbarui!', user });
    } catch (error) {
      return response.json({ success: false, message: 'Gagal memperbarui pengguna!', error });
    }
  }

  /**
   * Delete record
   */
  async destroy({ params, response }: HttpContext) {
    const user = await User.findOrFail(params.id)
    if (!user) {
      return response.json({ success: false, message: 'Pengguna tidak ditemukan!' })
    }
    try {
      await user.delete()
      return response.json({ success: true, message: 'Pengguna berhasil dihapus!' })
    } catch (error) {
      return response.json({ success: false, message: 'Gagal menghapus pengguna!' })
    }
  }

  async editPassword({ request, auth, response }: HttpContext) {
    const payload = request.only(['current_password', 'new_password', 'confirm_password'])
    const user = auth.use('web').user
    console.log(payload)

    if (!user) {
      return response.badRequest({ success: false, message: 'User tidak ditemukan' })
    }

    if (!payload.current_password || !payload.new_password || !payload.confirm_password) {
      return response.badRequest({ success: false, message: 'Password lama, password baru, dan konfirmasi password wajib diisi' })
    } else if (user instanceof User && !await user.verifyPassword(payload.current_password)) {
      return response.badRequest({ success: false, message: 'Password lama salah' })
    } else if (payload.new_password !== payload.confirm_password) {
      return response.badRequest({ success: false, message: 'Password baru dan konfirmasi password tidak sama' })
    }

    const referer = request.headers().referer

    try {
      user.password = payload.confirm_password
      await user.save()
      return response.ok({ success: true, message: 'Password berhasil diperbarui', redirectUrl: referer })
    } catch (error) {
      return response.badRequest({ success: false, message: 'Gagal memperbarui password' + error.message })
    }
  }


  async editProfile({ request, auth, response, view }: HttpContext) {
    if (request.method() === 'GET') {
      let userWithContact = null
      if (auth.user && auth.user instanceof User) {
        userWithContact = await auth.user.load('contact')
      }
      return view.render('profile/index', { user: userWithContact })
    }

    const user = auth.use('web').user
    if (!user) {
      return response.badRequest({
        success: false,
        message: 'User tidak ditemukan',
      })
    }

    // Ambil data input kecuali 'photo' karena photo adalah file
    const payload = request.only(['fullName', 'email'])
    const phoneNumber = request.input('phoneNumber')


    if (!payload.fullName || !payload.email || !phoneNumber) {
      return response.badRequest({
        success: false,
        message: 'Nama, Email, dan No Hp/Wa wajib diisi',
      })
    }

    try {

      const foto = request.file('foto')
      if (foto) {
        // Hapus foto lama jika ada
        const oldFotoPath = user.foto

        if (oldFotoPath && !oldFotoPath?.includes('user.png')) {
          const oldFotoFullPath = join('public', oldFotoPath) // Mendapatkan path lengkap dari foto lama
          try {
            fs.unlinkSync(oldFotoFullPath) // Menghapus file lama
          } catch (err) {
            console.log('Error saat menghapus foto lama:', err)
          }
        }

        // Menyimpan foto baru
        const fotoName = `${createId()}.${foto.extname}`
        const targetPath = join('public', 'images', 'users')

        await foto.move(targetPath, {
          name: fotoName,
          overwrite: true,
        })

        // Memperbarui foto path
        user.foto = `/images/users/${fotoName}`
      }

      user.merge({ ...payload })
      await user.save()
      return response.ok({
        success: true,
        message: 'Profil berhasil diperbarui',
      })
    } catch (error) {
      return response.badRequest({
        success: false,
        message: 'Gagal memperbarui profil: ' + error.message,
      })
    }
  }
}
