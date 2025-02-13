import { BaseSeeder } from '@adonisjs/lucid/seeders'
import User from '#models/user'

export default class extends BaseSeeder {
  public async run() {
    await User.createMany([
      {
        fullName: 'Super Admin',
        email: 'superadmin@gmail.com',
        password: 'password',
        role: 'super_admin',
        phoneNumber: '081930865458',
      },
      {
        fullName: 'Admin',
        email: 'user@gmail.com',
        password: 'password',
        role: 'admin',
        phoneNumber: '081930865458',
      },
    ])
  }
}
