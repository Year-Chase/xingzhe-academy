<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { MessagePlugin } from 'tdesign-vue-next'
import { put } from '@/api/client'
import { saveAdminProfile } from '@/utils/admin-auth'

const router = useRouter()
const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const error = ref('')

async function submit() {
  loading.value = true
  error.value = ''
  try {
    const result = await put('/admin/auth/password', { currentPassword: currentPassword.value, newPassword: newPassword.value, confirmPassword: confirmPassword.value })
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
  <div style="max-width: 480px; background: #FFFFFF; border: 1px solid #E6ECE7; border-radius: 8px; padding: 32px;">
    <h1 style="margin: 0 0 8px; color: #18231E; font-size: 22px;">修改密码</h1>
    <p style="margin: 0 0 28px; color: #6E776F; font-size: 14px;">修改后将刷新当前登录状态。</p>
    <t-form label-width="88px" label-align="top">
      <t-form-item label="当前密码"><t-input v-model="currentPassword" type="password" /></t-form-item>
      <t-form-item label="新密码"><t-input v-model="newPassword" type="password" placeholder="至少 8 位" /></t-form-item>
      <t-form-item label="确认新密码"><t-input v-model="confirmPassword" type="password" @enter="submit" /></t-form-item>
      <p v-if="error" style="margin: 0 0 16px; color: #B35B4B; font-size: 14px;">{{ error }}</p>
      <div style="display: flex; gap: 12px;"><t-button theme="primary" :loading="loading" style="background: #2E7D5A; border-color: #2E7D5A;" @click="submit">保存</t-button><t-button variant="outline" @click="router.back()">取消</t-button></div>
    </t-form>
  </div>
</template>
