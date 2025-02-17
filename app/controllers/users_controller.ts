import { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
// import { dd } from '@adonisjs/core/services/dumper'

export default class UsersController {
  /**
   * Display a list of resource
   */
  async index({ view }: HttpContext) {
    const users = await User.all()
    return view.render('users/index', { users })
  }

  /**
   * Handle form submission for the create action
   */
  async store({ request, response, session }: HttpContext) {
    try {
      const { name, email, password, role, phoneNumber } = request.all()
      const user = await User.create({ fullName: name, email, password, role, phoneNumber })
      session.flash('success', user.fullName + ' berhasil ditambahkan!')
      return response.redirect().back()
    } catch (error) {
      session.flash('error', 'Gagal menambahkan user! ' + error.message)

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
