import api from '../utils/api';

export const fetchProfile = async () => {
  const response = await api.get('/api/auth/profile');
  return response.data;
};

export const updateProfileApi = async (profileData, avatarFile = null) => {
  const formData = new FormData();
  
  // Append standard text fields
  Object.keys(profileData).forEach(key => {
    if (profileData[key] !== undefined && profileData[key] !== null) {
      if (key === 'stylePreferences') {
        formData.append(key, JSON.stringify(profileData[key]));
      } else {
        formData.append(key, profileData[key]);
      }
    }
  });

  // Append avatar file if provided
  if (avatarFile) {
    formData.append('avatar', avatarFile);
  }

  const response = await api.put('/api/auth/profile', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};
