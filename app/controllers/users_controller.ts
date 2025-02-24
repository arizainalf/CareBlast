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

  private async saveFile(file: MultipartFile): Promise<string> {
    const fileName = `${new Date().getTime()}.${file.extname}`
    await file.move('images/users', { name: fileName })
    return `users/${fileName}`
  }

  /**
   * Handle form submission for the create action
   */
  async store({ request, response, session }: HttpContext) {
    try {
      const payload = await request.validateUsing(createUserValidator)
      let fotoPath = ''
      if(request.file('avatar')){
        if (payload.avatar) {
          fotoPath = await this.saveFile(payload.avatar)
          // dd(fotoPath)
        } else {
          fotoPath = 'default-profile.jpg'
        }
      } else {
        fotoPath = 'default-profile.jpg'
      }

      const user = await User.create({ 
        fullName: payload.fullName,
        email: payload.email,
        password: payload.password,
        foto: fotoPath,
        phoneNumber: payload.phoneNumber,
      })

      session.flash({ 'success': 'User ' + user.fullName +' ditambahkan!' })
      return response.redirect().back()
    } catch (error) {
      console.log(error)
      session.flash({'error': 'Gagal menambahkan user! ' + error.message})
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
  async edit({ params }: HttpContext) {
    const user = await User.findOrFail(params.id)
    return user
  }

  /**
   * Handle form submission for the edit action
   */
  async update({ params, request }: HttpContext) {
    const { name, email, password } = request.all()
    const user = await User.findOrFail(params.id)
    user.fullName = name
    user.email = email
    user.password = password
    await user.save()
  }

  /**
   * Delete record
   */
  async destroy({ params }: HttpContext) {
    const user = await User.findOrFail(params.id)
    await user.delete()
  }

}
