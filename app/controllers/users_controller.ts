import { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import { createUserValidator } from '#validators/user'
import { MultipartFile } from '@adonisjs/core/bodyparser'
// import { dd } from '@adonisjs/core/services/dumper'


export default class UsersController {
  /**
   * Display a list of resource
   */
  async index({ view }: HttpContext) {
    const users = await User.all()
    return view.render('users/index', { users })
  }

  private async saveFile(file: MultipartFile | null): Promise<string | null> {
    if (!file) {
      throw new Error('File is required')
    }

    if (!file.isValid) {
      throw new Error('Invalid file')
    }

    const extname = file.extname ?? 'unknown'
    const fileName = `${new Date().getTime()}.${extname}`

    await file.move('public/images/users', { name: fileName })

    return `users/${fileName}`
  }

  /**
   * Handle form submission for the create action
   */
  async store({ request, response, session }: HttpContext) {
    try {
      const payload = await request.validateUsing(createUserValidator)
      let fotoPath = ''
      if (request.file('avatar')) {
        if (payload.avatar) {
          fotoPath = (await this.saveFile(payload.avatar)) ?? 'users/default-profile.jpg'
        }
      } else {
        fotoPath = 'users/default-profile.jpg'
      }

      const user = await User.create({
        fullName: payload.fullName,
        email: payload.email,
        password: payload.password,
        foto: fotoPath,
        phoneNumber: payload.phoneNumber,
      })

      session.flash({ 'success': 'User ' + user.fullName + ' ditambahkan!' })
      return response.redirect().back()
    } catch (error) {
      console.log(error)
      session.flash({ 'error': 'Gagal menambahkan user! ' + error.message })
      return response.redirect().back()
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
    const user = await User.find(params.id);
    return response.json(user);
  }

  public async update({ request, params, response }: HttpContext) {
    const user = await User.findOrFail(params.id);
    const data = request.only(['fullName', 'email', 'phoneNumber', 'role']);
    let fotoPath = user.foto ?? 'users/default-profile.jpg'

    const avatar = request.file('avatar')

    if (avatar) {
      fotoPath = (await this.saveFile(avatar)) ?? 'default-profile.jpg'
    }

    try {
      user.merge({ ...data, foto: fotoPath });
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
    const user = auth.user

    if (!user) {
      return response.badRequest({ status: 'error', title: 'Ada Kesalahan!', message: 'User tidak ditemukan' })
    }

    if (!payload.current_password || !payload.new_password || !payload.confirm_password) {
      return response.badRequest({ status: 'error', title: 'Ada Kesalahan!', message: 'Password lama, password baru, dan konfirmasi password wajib diisi' })
    } else if (!await user.verifyPassword(payload.current_password)) {
      return response.badRequest({ status: 'error', title: 'Ada Kesalahan!', message: 'Password lama salah' })
    } else if (payload.new_password !== payload.confirm_password) {
      return response.badRequest({ status: 'error', title: 'Ada Kesalahan!', message: 'Password baru dan konfirmasi password tidak sama' })
    }

    try {
      user.password = payload.confirm_password
      await user.save()
      return response.ok({ status: 'success', title: 'Berhasil!', message: 'Password berhasil diperbarui' })
    } catch (error) {
      return response.badRequest({ status: 'error', title: 'Ada Kesalahan!', message: 'Gagal memperbarui password' + error.message })
    }
  }


  async editProfile({ request, auth, response, view }: HttpContext) {
    if (request.method() === 'GET') {
      return view.render('profile/index', { user: auth.user })
    }

    const user = auth.user
    if (!user) {
      return response.badRequest({
        status: 'error',
        title: 'Ada Kesalahan!',
        message: 'User tidak ditemukan',
      })
    }

    // Ambil data input kecuali 'photo' karena photo adalah file
    const payload = request.only(['fullName', 'email', 'phoneNumber'])

    let fotoPath = user.foto ?? 'users/default-profile.jpg'

    const photo = request.file('photo')

    if (photo) {
      fotoPath = (await this.saveFile(photo)) ?? 'users/default-profile.jpg'
    }

    if (!payload.fullName || !payload.email || !payload.phoneNumber) {
      return response.badRequest({
        status: 'error',
        title: 'Ada Kesalahan!',
        message: 'Nama, Email, dan No Hp/Wa wajib diisi',
      })
    }

    try {
      user.merge({ ...payload, foto: fotoPath })
      await user.save()
      return response.ok({
        status: 'success',
        title: 'Berhasil!',
        message: 'Profil berhasil diperbarui',
      })
    } catch (error) {
      return response.badRequest({
        status: 'error',
        title: 'Ada Kesalahan!',
        message: 'Gagal memperbarui profil: ' + error.message,
      })
    }
  }

}
