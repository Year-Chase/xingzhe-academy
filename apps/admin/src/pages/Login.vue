<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { API_BASE_URL } from '@/config/api'
import axios from 'axios'

const router = useRouter()
const username = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

async function handleLogin() {
  if (!username.value || !password.value) {
    error.value = '请输入账号和密码'
    return
  }
  loading.value = true
  error.value = ''
  try {
    const res = await axios.post(`${API_BASE_URL}/admin/auth/login`, {
      username: username.value,
      password: password.value,
    })
    localStorage.setItem('admin_token', res.data.token)
    router.push('/')
  } catch (e: any) {
    const status = e?.response?.status
    if (status === 401) {
      error.value = '账号或密码错误'
    } else {
      error.value = e?.response?.data?.message || e?.message || '登录失败，请稍后重试'
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(160deg, #DCE6E2 0%, #BED5C5 40%, #789A85 100%);">
    <div style="width: 400px; background: #FFFFFF; border-radius: 16px; padding: 48px 40px; box-shadow: 0 16px 48px rgba(24,35,30,0.12);">
      <div style="text-align: center; margin-bottom: 40px;">
        <div style="font-size: 28px; font-weight: 700; color: #18231E;">行者学社 Admin</div>
        <div style="font-size: 14px; color: #8A9288; margin-top: 8px;">管理后台登录</div>
      </div>

      <t-form label-width="0">
        <t-form-item>
          <t-input
            v-model="username"
            placeholder="账号"
            size="large"
            clearable
            @enter="handleLogin"
          />
        </t-form-item>
        <t-form-item>
          <t-input
            v-model="password"
            type="password"
            placeholder="密码"
            size="large"
            clearable
            @enter="handleLogin"
          />
        </t-form-item>
        <t-form-item v-if="error">
          <span style="color: #B35B4B; font-size: 14px;">{{ error }}</span>
        </t-form-item>
        <t-form-item>
          <t-button
            theme="primary"
            block
            size="large"
            :loading="loading"
            @click="handleLogin"
            style="height: 44px; background: #2E7D5A; border-color: #2E7D5A;"
          >
            登录
          </t-button>
        </t-form-item>
      </t-form>
    </div>
  </div>
</template>
