<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const username = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

function handleLogin() {
  if (!username.value || !password.value) {
    error.value = '请输入账号和密码'
    return
  }
  loading.value = true
  error.value = ''
  setTimeout(() => {
    if (username.value === 'admin' && password.value === 'admin123') {
      localStorage.setItem('admin_token', 'mock_token_' + Date.now())
      router.push('/')
    } else {
      error.value = '账号或密码错误（提示：admin / admin123）'
    }
    loading.value = false
  }, 600)
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

      <div style="text-align: center; font-size: 12px; color: #A6AAA2; margin-top: 24px;">
        mock 账号：admin / admin123
      </div>
    </div>
  </div>
</template>
