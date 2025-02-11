/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'

router.get('/list-users', async ({ view }) => {
  return view.render('users/index')
})
router.get('/edit-profile', async ({ view }) => {
  return view.render('profile/index')
})
router.get('/login', async ({ view }) => {
  return view.render('auth/login-page')
})
router.get('/forgot', async ({ view }) => {
  return view.render('auth/forgot-pw')
})
router.get('/profile', async ({ view }) => {
  return view.render('pasien/profile-pasien')
})
router.get('/data-pasien', async ({ view }) => {
  return view.render('pasien/data-pasien')
})
router.get('/data-obat', async ({ view }) => {
  return view.render('obat/data-obat')
})
router.get('/data-kunjungan', async ({ view }) => {
  return view.render('kunjungan/data-kunjungan')
})
router.get('/hasil-lab', async ({ view }) => {
  return view.render('hasil-lab/index')
})
router.get('/whatsapps', async ({ view }) => {
  return view.render('whatsapps/whatsapp')
})
router.get('/detail-kunjungan', async ({ view }) => {
  return view.render('kunjungan/detail_kunjungan/index')
})

router.get('/', '#controllers/whatsapps_controller.showqr')
router.get('/qrcode', '#controllers/whatsapps_controller.getQrCode')
router.get('/status', '#controllers/whatsapps_controller.status')
router.get('/logout', '#controllers/whatsapps_controller.logout')

router.get('/messages', '#controllers/whatsapps_controller.createMsg')
router.post('/send', '#controllers/whatsapps_controller.sendMsg')

router.get('/pasiens', '#controllers/pasiens_controller.index')

//Pages Error
router.get('/bad-request', async ({ view }) => {
  return view.render('pages/errors/400')
})
router.get('/forbidden-error', async ({ view }) => {
  return view.render('pages/errors/403')
})
router.get('/not-found', async ({ view }) => {
  return view.render('pages/errors/404')
})
router.get('/server-error', async ({ view }) => {
  return view.render('pages/errors/500')
})
router.get('/server-unavailable', async ({ view }) => {
  return view.render('pages/errors/503')
})
