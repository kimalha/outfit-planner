export const validateProfile = (data) => {
  const errors = {};

  if (!data.fullname || !data.fullname.trim()) {
    errors.fullname = "Nama lengkap wajib diisi";
  }

  if (!data.username || !data.username.trim()) {
    errors.username = "Username tidak boleh kosong";
  } else if (data.username.trim().length < 3) {
    errors.username = "Username minimal harus 3 karakter";
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!data.email || !data.email.trim()) {
    errors.email = "Email wajib diisi";
  } else if (!emailRegex.test(data.email.trim())) {
    errors.email = "Format email tidak valid";
  }

  if (data.phone && !/^\d+$/.test(data.phone)) {
    errors.phone = "Nomor telepon hanya boleh berisi angka";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
