/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'

router.get('/login', async ({ view }) => {
  return view.render('auth/login-page')
})
router.get('/profile', async ({ view }) => {
  return view.render('pages/pasien/profile-pasien')
})
router.get('/', async ({ view }) => {
  return view.render('pages/index')
})
router.get('/data-pasien', async ({ view }) => {
  return view.render('pages/pasien/data-pasien')
})
router.get('/data-obat', async ({ view }) => {
  return view.render('pages/pasien/data-obat')
})
router.get('/data-kunjungan', async ({ view }) => {
  return view.render('pages/pasien/data-kunjungan')
})
router.get('/hasil-lab', async ({ view }) => {
  return view.render('pages/pasien/hasil-lab')
})
