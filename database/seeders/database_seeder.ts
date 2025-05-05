import { BaseSeeder } from '@adonisjs/lucid/seeders'
import User from '#models/user'
import Pasien from '#models/pasien'
import JenisPenyakit from '#models/jenis_penyakit'
import Obat from '#models/obat'
import Spesialist from '#models/spesialist'
import Dokter from '#models/dokter'
import Kunjungan from '#models/kunjungan'
import ObatPasien from '#models/obat_pasien'
import { v4 as uuid } from 'uuid'
import { DateTime } from 'luxon'

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

  private generateTimeSlots(frequency: number): string[] {
    // Generate appropriate time slots based on frequency
    const timeSlots: string[] = []

    switch (frequency) {
      case 1:
        // Once a day (morning)
        timeSlots.push('08:00')
        break
      case 2:
        // Twice a day (morning and evening)
        timeSlots.push('08:00', '20:00')
        break
      case 3:
        // Three times a day (morning, afternoon, evening)
        timeSlots.push('08:00', '14:00', '20:00')
        break
      default:
        // Default to morning
        timeSlots.push('08:00')
    }

    return timeSlots
  }

  public async run() {
    // Seed Users
    await User.createMany([
      {
        fullName: 'Super Admin',
        email: 'superadmin@gmail.com',
        password: '11221122',
        role: 'super_admin',
        phoneNumber: '081930865458',
      },
      {
        fullName: 'Admin',
        email: 'admin@gmail.com',
        password: '11221122',
        role: 'admin',
        phoneNumber: '081930865458',
      },
    ])

    // Seed Spesialist
    const spesialistData = [
      { nama: 'Kardiologi', gelar: 'Sp.JP' },
      { nama: 'Endokrinologi', gelar: 'Sp.PD-KEMD' },
      { nama: 'Pulmonologi', gelar: 'Sp.P' },
      { nama: 'Psikiatri', gelar: 'Sp.KJ' },
      { nama: 'Umum', gelar: 'Sp.UMU' },
    ]

    const spesialists = await Spesialist.createMany(spesialistData)

    // Seed Dokter
    const dokterData = [
      {
        nip: 'DOK001',
        nama: 'Dr. Andi Wijaya',
        noWhatsapp: '098863876234',
        spesialistId: spesialists[0].id,
        jamMulai: '08:00',
        jamSelesai: '14:00',
        status: true,
      },
      {
        nip: 'DOK002',
        nama: 'Dr. Siti Rahma',
        noWhatsapp: '098863876234',
        spesialistId: spesialists[1].id,
        jamMulai: '09:00',
        jamSelesai: '15:00',
        status: true,
      },
      {
        nip: 'DOK003',
        nama: 'Dr. Budi Santoso',
        noWhatsapp: '098863876234',
        spesialistId: spesialists[2].id,
        jamMulai: '10:00',
        jamSelesai: '16:00',
        status: true,
      },
      {
        nip: 'DOK004',
        nama: 'Dr. Dewi Anggraini',
        noWhatsapp: '098863876234',
        spesialistId: spesialists[3].id,
        jamMulai: '13:00',
        jamSelesai: '19:00',
        status: true,
      },
      {
        nip: 'DOK005',
        nama: 'Dr. Rudi Hartono',
        noWhatsapp: '098863876234',
        spesialistId: spesialists[4].id,
        jamMulai: '08:00',
        jamSelesai: '16:00',
        status: true,
      },
    ]

    const dokters = await Dokter.createMany(dokterData)

    // Seed Obat
    const obatData = [
      { nama: 'Amlodipine', dosis: 5 },
      { nama: 'Captopril', dosis: 25 },
      { nama: 'Metformin', dosis: 500 },
      { nama: 'Gliclazide', dosis: 30 },
      { nama: 'Isoniazid (INH)', dosis: 300 },
      { nama: 'Rifampicin', dosis: 450 },
      { nama: 'Fluoxetine', dosis: 20 },
      { nama: 'Risperidone', dosis: 2 },
      { nama: 'Paracetamol', dosis: 500 },
      { nama: 'Amoxicillin', dosis: 500 },
    ]

    const obats = await Obat.createMany(
      obatData.map((data) => ({
        uuid: uuid(),
        nama: data.nama,
        dosis: data.dosis,
      }))
    )

    // Seed Jenis Penyakit
    const jenisPenyakitData = [
      {
        nama: 'Hipertensi 1',
        deskripsi:
          'Tekanan darah sistolik antara 130-139 mmHg atau tekanan darah diastolik antara 80-89 mmHg. Pada tahap ini, perubahan gaya hidup sangat penting untuk mencegah perkembangan lebih lanjut.',
      },
      {
        nama: 'Hipertensi 2',
        deskripsi:
          'Tekanan darah sistolik 140 mmHg atau lebih tinggi, atau tekanan darah diastolik 90 mmHg atau lebih tinggi. Pada tahap ini, pengobatan dengan obat-obatan biasanya diperlukan selain perubahan gaya hidup.',
      },
      {
        nama: 'Diabetes',
        deskripsi:
          'penyakit kronis yang memengaruhi kemampuan tubuh untuk memproses gula darah (glukosa). Glukosa adalah sumber energi utama bagi tubuh, tetapi kadar glukosa yang berlebihan dalam darah dapat menyebabkan masalah kesehatan yang serius.',
      },
      {
        nama: 'Tuberkulosis Paru',
        deskripsi:
          'Penyakit menular yang disebabkan oleh bakteri Mycobacterium tuberculosis. TB biasanya menyerang paru-paru, tetapi juga dapat memengaruhi organ lain.',
      },
      {
        nama: 'Jiwa',
        deskripsi:
          'kondisi kesehatan yang memengaruhi pikiran, perasaan, suasana hati, dan perilaku seseorang. Gangguan jiwa dapat memengaruhi kemampuan seseorang untuk berfungsi dalam kehidupan sehari-hari.',
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
      const birthDate = DateTime.local(birthYear, birthMonth, birthDay)

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

    const pasiens = await Pasien.createMany(pasienData)

    // Generate Kunjungan records
    const kunjunganData = []

    // Create between 1-3 visits for each patient
    for (const pasien of pasiens) {
      const visitCount = 1 + Math.floor(Math.random() * 3)

      for (let i = 0; i < visitCount; i++) {
        // Calculate random dates
        const now = DateTime.now()
        const visitDate = now.minus({ days: Math.floor(Math.random() * 30) })
        const nextVisitDate = visitDate.plus({ days: 7 + Math.floor(Math.random() * 23) })

        // Pick a relevant doctor based on patient's disease type
        let relevantDoktorIndex = 0

        if (pasien.jenisPenyakitId) {
          // Match doctor specialty with disease type
          switch (pasien.jenisPenyakitId) {
            case jenisPenyakits.find(
              (jp) => jp.nama === 'Hipertensi 1' || jp.nama === 'Hipertensi 2'
            )?.id:
              relevantDoktorIndex =
                dokters.findIndex(
                  (d) => d.spesialistId === spesialists.find((s) => s.nama === 'Kardiologi')?.id
                ) || 0
              break
            case jenisPenyakits.find((jp) => jp.nama === 'Diabetes')?.id:
              relevantDoktorIndex =
                dokters.findIndex(
                  (d) => d.spesialistId === spesialists.find((s) => s.nama === 'Endokrinologi')?.id
                ) || 0
              break
            case jenisPenyakits.find((jp) => jp.nama === 'Tuberkulosis Paru')?.id:
              relevantDoktorIndex =
                dokters.findIndex(
                  (d) => d.spesialistId === spesialists.find((s) => s.nama === 'Pulmonologi')?.id
                ) || 0
              break
            case jenisPenyakits.find((jp) => jp.nama === 'Jiwa')?.id:
              relevantDoktorIndex =
                dokters.findIndex(
                  (d) => d.spesialistId === spesialists.find((s) => s.nama === 'Psikiatri')?.id
                ) || 0
              break
            default:
              relevantDoktorIndex =
                dokters.findIndex(
                  (d) => d.spesialistId === spesialists.find((s) => s.nama === 'Umum')?.id
                ) || 0
          }

          // If no match found, use a random doctor
          if (relevantDoktorIndex === -1) {
            relevantDoktorIndex = Math.floor(Math.random() * dokters.length)
          }
        } else {
          // If no disease type, use a random doctor
          relevantDoktorIndex = Math.floor(Math.random() * dokters.length)
        }

        const temaOptions = [
          'Konsultasi rutin',
          'Pemeriksaan lanjutan',
          'Kontrol obat',
          'Evaluasi kondisi',
          'Konsultasi gejala baru',
        ]

        kunjunganData.push({
          pasienId: pasien.id,
          dokterId: dokters[relevantDoktorIndex].id,
          tema: temaOptions[Math.floor(Math.random() * temaOptions.length)],
          keterangan: `Kunjungan ${i + 1} untuk pemeriksaan kondisi pasien dan evaluasi pengobatan.`,
          tanggalKunjungan: visitDate,
          kunjunganBerikutnya: nextVisitDate,
        })
      }
    }

    const kunjungans = await Kunjungan.createMany(kunjunganData)

    // Generate ObatPasien records
    const obatPasienData = []

    // Create medication records for each visit
    for (const kunjungan of kunjungans) {
      // Get the associated patient
      const pasien = pasiens.find((p) => p.id === kunjungan.pasienId)
      if (!pasien) continue

      // Get the patient's disease type
      const jenisPenyakit = jenisPenyakits.find((jp) => jp.id === pasien.jenisPenyakitId)

      // Define appropriate medications based on disease
      let relevantObatIds: number[] = []

      if (jenisPenyakit) {
        switch (jenisPenyakit.nama) {
          case 'Hipertensi 1':
          case 'Hipertensi 2':
            relevantObatIds = obats
              .filter((o) => o.nama === 'Amlodipine' || o.nama === 'Captopril')
              .map((o) => o.id)
            break
          case 'Diabetes':
            relevantObatIds = obats
              .filter((o) => o.nama === 'Metformin' || o.nama === 'Gliclazide')
              .map((o) => o.id)
            break
          case 'Tuberkulosis Paru':
            relevantObatIds = obats
              .filter((o) => o.nama === 'Isoniazid (INH)' || o.nama === 'Rifampicin')
              .map((o) => o.id)
            break
          case 'Jiwa':
            relevantObatIds = obats
              .filter((o) => o.nama === 'Fluoxetine' || o.nama === 'Risperidone')
              .map((o) => o.id)
            break
          default:
            relevantObatIds = obats
              .filter((o) => o.nama === 'Paracetamol' || o.nama === 'Amoxicillin')
              .map((o) => o.id)
        }
      } else {
        // If no specific disease, use generic medications
        relevantObatIds = obats
          .filter((o) => o.nama === 'Paracetamol' || o.nama === 'Amoxicillin')
          .map((o) => o.id)
      }

      // For each visit, assign 1-2 medications
      const medCount = 1 + Math.floor(Math.random() * 2)

      for (let i = 0; i < medCount; i++) {
        // If we have relevant medications, use them; otherwise, use a random one
        const obatId =
          relevantObatIds.length > 0
            ? relevantObatIds[Math.floor(Math.random() * relevantObatIds.length)]
            : obats[Math.floor(Math.random() * obats.length)].id

        const frekuensi = 1 + Math.floor(Math.random() * 3) // 1-3 times a day

        // Generate appropriate time slots based on frequency (e.g., ["08:00"], ["08:00", "20:00"])
        const waktuKonsumsi = this.generateTimeSlots(frekuensi)

        const keteranganWaktuOptions = ['Sebelum makan', 'Sesudah makan']

        obatPasienData.push({
          uuid: uuid(),
          pasienId: pasien.id,
          kunjunganId: kunjungan.id,
          obatId: obatId,
          frekuensi: frekuensi,
          waktuKonsumsi: JSON.stringify(waktuKonsumsi), // JSON array of time strings
          keteranganWaktu:
            keteranganWaktuOptions[Math.floor(Math.random() * keteranganWaktuOptions.length)],
        })
      }
    }

    await ObatPasien.createMany(obatPasienData)
  }
}
