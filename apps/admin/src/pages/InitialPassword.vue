<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { MessagePlugin } from 'tdesign-vue-next'
import { post } from '@/api/client'
import { saveAdminProfile } from '@/utils/admin-auth'

const router = useRouter()
const newPassword = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const error = ref('')

async function submit() {
  loading.value = true
  error.value = ''
  try {
    const result = await post('/admin/auth/password/initial', { newPassword: newPassword.value, confirmPassword: confirmPassword.value })
    localStorage.setItem('admin_token', result.token)
    saveAdminProfile(result.admin)
    MessagePlugin.success('密码已更新')
    router.replace('/')
  } catch (e: any) {
    error.value = e?.response?.data?.message || '密码修改失败'
  } finally { loading.value = false }
}
</script>

<template>
  <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #F7F6F2;">
    <div style="width: 400px; background: #FFFFFF; border-radius: 12px; padding: 44px 40px; box-shadow: 0 12px 36px rgba(24,35,30,0.10);">
      <h1 style="margin: 0; color: #18231E; font-size: 24px;">设置新密码</h1>
      <p style="margin: 10px 0 28px; color: #6E776F; font-size: 14px;">首次登录，请先更新密码后再进入管理后台。</p>
      <t-form label-width="0">
        <t-form-item><t-input v-model="newPassword" type="password" placeholder="新密码（至少 8 位）" size="large" /></t-form-item>
        <t-form-item><t-input v-model="confirmPassword" type="password" placeholder="确认新密码" size="large" @enter="submit" /></t-form-item>
        <t-form-item v-if="error"><span style="color: #B35B4B; font-size: 14px;">{{ error }}</span></t-form-item>
        <t-button theme="primary" block size="large" :loading="loading" style="background: #2E7D5A; border-color: #2E7D5A;" @click="submit">完成并进入后台</t-button>
      </t-form>
    </div>
  </div>
</template>
