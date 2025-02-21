import { BaseSeeder } from '@adonisjs/lucid/seeders'
import User from '#models/user'
import Pasien from '#models/pasien'
import JenisPenyakit from '#models/jenis_penyakit'
import { v4 as uuid } from 'uuid'
import { DateTime } from 'luxon'
import Obat from '#models/obat'

export default class extends BaseSeeder {
  private generateNIK(): string {
    // Format: PPRRSSDDMMYYXXXX
    // PP: Province code (2 digits)
    // RR: Regency code (2 digits)
    // SS: Sub-district code (2 digits)
    // DD: Date of birth (2 digits)
    // MM: Month of birth (2 digits)
    // YY: Year of birth (2 digits)
    // XXXX: Random number (4 digits)

    const provinceCode = Math.floor(Math.random() * 99)
      .toString()
      .padStart(2, '0')
    const regencyCode = Math.floor(Math.random() * 99)
      .toString()
      .padStart(2, '0')
    const subDistrictCode = Math.floor(Math.random() * 99)
      .toString()
      .padStart(2, '0')
    const date = Math.floor(Math.random() * 28 + 1)
      .toString()
      .padStart(2, '0')
    const month = Math.floor(Math.random() * 12 + 1)
      .toString()
      .padStart(2, '0')
    const year = Math.floor(Math.random() * 99)
      .toString()
      .padStart(2, '0')
    const randomNum = Math.floor(Math.random() * 9999)
      .toString()
      .padStart(4, '0')

    return `${provinceCode}${regencyCode}${subDistrictCode}${date}${month}${year}${randomNum}`
  }

  public async run() {
    // Seed Users
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

    const obatData = [
      { nama: 'Paracetamol', dosis: 500 },
      { nama: 'Amoxicillin', dosis: 250 },
      { nama: 'Ibuprofen', dosis: 200 },
      { nama: 'Cetirizine', dosis: 10 },
      { nama: 'Metformin', dosis: 850 },
      { nama: 'Simvastatin', dosis: 20 },
      { nama: 'Omeprazole', dosis: 40 },
      { nama: 'Ciprofloxacin', dosis: 500 },
      { nama: 'Dexamethasone', dosis: 0.5 },
      { nama: 'Losartan', dosis: 50 },
    ]

    await Obat.createMany(
      obatData.map((data) => ({
        uuid: uuid(),
        nama: data.nama,
        dosis: data.dosis,
      }))
    )

    // Seed Jenis Penyakit
    const jenisPenyakitData = [
      {
        nama: 'Demam Berdarah',
        deskripsi: 'Penyakit yang ditularkan melalui gigitan nyamuk Aedes aegypti',
      },
      {
        nama: 'Diabetes Mellitus',
        deskripsi: 'Penyakit metabolik yang ditandai dengan tingginya kadar gula darah',
      },
      {
        nama: 'Hipertensi',
        deskripsi: 'Tekanan darah tinggi yang dapat menyebabkan berbagai komplikasi',
      },
      {
        nama: 'ISPA',
        deskripsi: 'Infeksi Saluran Pernapasan Akut yang menyerang sistem pernapasan',
      },
      {
        nama: 'Asma',
        deskripsi: 'Penyakit kronis yang menyebabkan peradangan dan penyempitan saluran napas',
      },
      {
        nama: 'Gastritis',
        deskripsi: 'Peradangan pada lapisan dinding lambung',
      },
      {
        nama: 'Tuberkulosis',
        deskripsi: 'Penyakit infeksi yang umumnya menyerang paru-paru',
      },
      {
        nama: 'Malaria',
        deskripsi: 'Penyakit yang disebabkan oleh parasit Plasmodium',
      },
    ]

    const jenisPenyakits = await JenisPenyakit.createMany(
      jenisPenyakitData.map((data) => ({
        uuid: uuid(),
        nama: data.nama,
        deskripsi: data.deskripsi,
      }))
    )

    // Data kota untuk tempat lahir
    const cities = [
      'Jakarta',
      'Surabaya',
      'Bandung',
      'Medan',
      'Semarang',
      'Makassar',
      'Palembang',
      'Tangerang',
      'Depok',
      'Bekasi',
      'Malang',
      'Yogyakarta',
    ]

    // Generate 50 pasien records
    const pasienData = Array.from({ length: 50 }, (_, index) => {
      const birthYear = 1960 + Math.floor(Math.random() * 50) // Random year between 1960-2010
      const birthMonth = 1 + Math.floor(Math.random() * 12)
      const birthDay = 1 + Math.floor(Math.random() * 28)
      const birthDate = DateTime.local(birthYear, birthMonth, birthDay).toISODate()

      const firstName =
        index % 2 === 0
          ? ['Budi', 'Siti', 'Ahmad', 'Dewi', 'Eko', 'Putri', 'Rizki', 'Andi'][
              Math.floor(Math.random() * 8)
            ]
          : ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Lisa', 'Kevin', 'Emma'][
              Math.floor(Math.random() * 8)
            ]

      const lastName =
        index % 2 === 0
          ? ['Santoso', 'Wijaya', 'Hidayat', 'Kusuma', 'Pratama', 'Sari', 'Putra', 'Dewi'][
              Math.floor(Math.random() * 8)
            ]
          : ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'][
              Math.floor(Math.random() * 8)
            ]

      const golonganDarah = ['A+', 'B+', 'AB+', 'O+', 'A-', 'B-', 'AB-', 'O-'][
        Math.floor(Math.random() * 8)
      ]

      return {
        name: `${firstName} ${lastName}`,
        tempat: cities[Math.floor(Math.random() * cities.length)],
        tanggal_lahir: birthDate,
        no_hp: `08${Math.floor(Math.random() * 1000000000)
          .toString()
          .padStart(9, '0')}`,
        alamat: `Jl. ${['Sudirman', 'Thamrin', 'Gatot Subroto', 'Diponegoro', 'Ahmad Yani'][Math.floor(Math.random() * 5)]} No. ${Math.floor(Math.random() * 100) + 1}`,
        jenisPenyakitId: jenisPenyakits[Math.floor(Math.random() * jenisPenyakits.length)].id,
        uuid: uuid(),
        jenis_kelamin: Math.random() > 0.5 ? 'Laki-laki' : 'Perempuan',
        nik: this.generateNIK(),
        golongan_darah: golonganDarah,
      }
    })

    await Pasien.createMany(pasienData)
  }
}
