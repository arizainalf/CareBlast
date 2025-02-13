import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'

export default class SessionController {
  async store({ request, auth, response }: HttpContext) {
    /**
     * Step 1: Get credentials from the request body
     */
    const { email, password } = request.only(['email', 'password'])

    /**
     * Step 2: Verify credentials
     */
    const user = await User.verifyCredentials(email, password)

    /**
     * Step 3: Login user
     */
    await auth.use('web').login(
      user,
      /**
       * Generate token when "remember_me" input exists
       */
      !!request.input('remember_me')
    )

    /**
     * Step 4: Send them to a protected route
     */
    response.redirect('/')
  }
}
