
// 🔐 Toggle Password Visibility
const togglePasswordVisibility = (inputSelector, iconSelector) => {
  const $input = $(inputSelector);
  const $icon = $(iconSelector);

  const isPassword = $input.attr("type") === "password";
  $input.attr("type", isPassword ? "text" : "password");
  $icon
    .removeClass(isPassword ? "fas fa-eye" : "fas fa-eye-slash")
    .addClass(isPassword ? "fas fa-eye-slash" : "fas fa-eye");
};

// 💬 SweetAlert Wrapper
const showSwal = (type, title, message, callback = null, redirectUrl = null, hash = null) => {
  Swal.fire({
    icon: type,
    title: title,
    text: message,
    position: 'center',
    showConfirmButton: true,
  }).then((result) => {
    if (callback && result.isConfirmed) callback();
    setTimeout(() => (redirectUrl ? window.location.href = redirectUrl : window.location.reload()), 1000);
  });
};

// 📥 Show Bootstrap Modal
const showModal = (modalId) => {
  const $modal = $(`#${modalId}`);
  $modal.modal("show");
};

// ❌ Hide Bootstrap Modal
const hideModal = (modalId) => {
  const $modal = $(`#${modalId}`);
  $modal.modal("hide");
};

// 📦 Load Data to Modal
const loadDataToModal = (url, modalId, callback) => {
  $.get(url)
    .done((data) => {
      if (!data) return showSwal("error", "Gagal", "Data tidak ditemukan!");
      callback(data);
      showModal(modalId);
    })
    .fail(() => showSwal("error", "Gagal", "Gagal mengambil data!"));
};

// 🔄 AJAX Request (dengan showSwal & optional callback)
const ajaxRequest = (url, method, formData = null, callback = null) => {
  $.ajax({
    url: url,
    enctype: "multipart/form-data",
    type: method,
    data: formData,
    processData: false,
    contentType: false,
    headers: {
      "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr("content"),
      Accept: "application/json",
    },
    success: (response) => {
      if (response.success) {
        showSwal("success", "Sukses!", response.message, () => {
          if (callback) callback();
        }, response.redirectUrl || null);
      } else {
        showSwal("error", "Terjadi Kesalahan!", response.message);
      }
    },
    error: (xhr) => {
      const message = xhr.responseJSON?.message || "Terjadi kesalahan tidak diketahui.";
      showSwal("error", "Gagal!", message);
    },
  });
};

// 🗑️ Konfirmasi Hapus
const confirmDelete = (url, callback = null) => {
  Swal.fire({
    title: "Konfirmasi",
    text: "Apakah Anda yakin ingin menghapus ini?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Ya, Hapus",
    cancelButtonText: "Batal",
  }).then((result) => {
    if (!result.isConfirmed) return;

    ajaxRequest(url, "DELETE", null, () => {
      showSwal("success", "Terhapus!", "Data berhasil dihapus!", callback);
    });

  });
};

// 🚪 Logout Button
const logoutBtn = (buttonSelector) => {
  $(buttonSelector).on("click", function (e) {
    e.preventDefault();

    Swal.fire({
      title: "Konfirmasi Logout",
      text: "Apakah Anda yakin ingin logout?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Logout",
      cancelButtonText: "Batal",
    }).then((result) => {
      if (!result.isConfirmed) return;

      $.ajax({
        url: "/logout",
        type: "POST",
        headers: {
          "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr("content"),
          "X-Requested-With": "XMLHttpRequest",
        },
        success: (res) => {
          if (res.success) {
            Swal.fire({
              icon: "success",
              title: "Logout Berhasil!",
              text: "Anda akan diarahkan ke halaman login...",
              showConfirmButton: false,
              timer: 2000,
            }).then(() => {
              window.location.href = res.redirectUrl || "/";
            });
          }
        },
        error: () => {
          showSwal("error", "Gagal", "Logout gagal, silakan coba lagi!");
        },
      });
    });
  });
};

// 📱 Format Nomor Telepon
const formatPhoneNumber = (phone) => phone.replace(/@.+$/, "").replace(/^62/, "0");

// 🕓 Format Timestamp
const formatTimestamp = (timestamp) =>
  new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date(timestamp));

// 📅 Format Tanggal Umum
const formatDate = (tanggal) => {
  const parsed = Date.parse(tanggal);
  if (isNaN(parsed)) return "Tanggal tidak valid";

  return new Date(parsed).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

// 📅 Format Tanggal String (lebih strict)
const formatTanggal = (tanggalString) => {
  const tanggal = new Date(tanggalString);
  if (isNaN(tanggal)) return "Tanggal tidak valid";

  return tanggal.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};


