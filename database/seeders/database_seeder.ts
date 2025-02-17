import { BaseSeeder } from '@adonisjs/lucid/seeders'
import User from '#models/user'
import Pasien from '#models/pasien'
import JenisPenyakit from '#models/jenis_penyakit'
import { v4 as uuid } from 'uuid';

export default class extends BaseSeeder {
  public async run() {
    // Seed User
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

    // Seed Jenis Penyakit
    const jenisPenyakitData = [
      { nama: 'Demam Berdarah' },
      { nama: 'Malaria' },
      { nama: 'Flu' },
      // ... tambahkan jenis penyakit lainnya
    ]

    const jenisPenyakits = await JenisPenyakit.createMany(
      jenisPenyakitData.map((data) => ({
        uuid: uuid(),
        nama: data.nama,
      }))
    )

    // Seed Pasien
    const pasienData = [
      {
        name: 'John Doe',
        tempat: 'Jakarta',
        tanggal_lahir: '1990-01-01',
        no_hp: '081234567890',
        alamat: 'Jl. Contoh No. 1',
        jenis_penyakit_id: jenisPenyakits[0].id,
        uuid: uuid(),
        jenis_kelamin: 'Laki-laki', // Tambahkan jenis kelamin
        nik: '1234567890123456', // Tambahkan NIK, pastikan unik
      },
      {
        name: 'Jane Smith',
        tempat: 'Bandung',
        tanggal_lahir: '1995-05-15',
        no_hp: '081234567891',
        alamat: 'Jl. Contoh No. 2',
        jenis_penyakit_id: jenisPenyakits[1].id,
        uuid: uuid(),
        jenis_kelamin: 'Perempuan', // Tambahkan jenis kelamin
        nik: '6543210987654321', // Tambahkan NIK, pastikan unik
      },
      // ... tambahkan data pasien lainnya, pastikan NIK unik untuk setiap pasien
    ]

    await Pasien.createMany(pasienData)
  }
}
