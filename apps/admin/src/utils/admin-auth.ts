export type AdminProfile = {
  id: string
  username: string
  role: 'SUPER_ADMIN' | 'ADMIN'
  mustChangePassword: boolean
}

const PROFILE_KEY = 'admin_profile'

export function saveAdminProfile(profile: AdminProfile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
}

export function clearAdminSession() {
  localStorage.removeItem('admin_token')
  localStorage.removeItem(PROFILE_KEY)
}
