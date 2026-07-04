<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { MessagePlugin } from 'tdesign-vue-next'
import { get, post, del, patch } from '@/api/client'
import { assetUrl } from '@/config/api'

const route = useRoute()
const router = useRouter()
const userId = route.params.userId as string

interface DetailData {
  userId: string; nickname: string | null; avatarUrl: string | null
  gender: string; phone: string | null
  birthYearMonth: string | null; age: number | null; identityType: string
  isMember: boolean; isLifetimeMember: boolean
  registeredAt: string | null; lastLoginAt: string | null
  summary: { registrationCount: number; orderCount: number; checkedInCount: number; paidAmount: number; refundedAmount: number; netAmount: number; inviteRegisterCount: number; inviteActivityCount: number }
  registrations: any[]; orders: any[]; refunds: any[]; invoices: any[]
  certificates: any[]
  inviteRecords: any[]; activityInviteRecords: any[]
  tags: { id: number; tag: string }[]; notes: { id: number; note: string; createdAt: string }[]
}

const data = ref<DetailData | null>(null); const loading = ref(false)
const newTag = ref(''); const newNote = ref('')
const tagLoading = ref(false); const noteLoading = ref(false)

// Type management
const editingType = ref(false)
const selectedType = ref('')
const typeLoading = ref(false)
const TYPE_OPTIONS = ['普通用户', '会员', '终身会员', '志愿者', '工作人员']

// Certificate image modal
const certDialog = ref(false); const certImage = ref(''); const certName = ref('')

const fetchDetail = async () => {
  loading.value = true
  try { data.value = await get<DetailData>('/admin/crm/users/' + userId) }
  catch (e: any) { MessagePlugin.error(e?.response?.data?.message || '加载失败') }
  finally { loading.value = false }
}

// Tag CRUD
const addTag = async () => {
  if (!newTag.value.trim()) return
  tagLoading.value = true
  try { await post('/admin/crm/users/' + userId + '/tags', { tag: newTag.value.trim() }); newTag.value = ''; MessagePlugin.success('标签已添加'); fetchDetail() }
  catch (e: any) { MessagePlugin.error(e?.response?.data?.message || '添加失败') }
  finally { tagLoading.value = false }
}

const removeTag = async (tagId: number) => {
  try { await del('/admin/crm/users/' + userId + '/tags/' + tagId); MessagePlugin.success('标签已删除'); fetchDetail() }
  catch (e: any) { MessagePlugin.error(e?.response?.data?.message || '删除失败') }
}

// Note CRUD
const addNote = async () => {
  if (!newNote.value.trim()) return
  noteLoading.value = true
  try { await post('/admin/crm/users/' + userId + '/notes', { note: newNote.value.trim() }); newNote.value = ''; MessagePlugin.success('备注已添加'); fetchDetail() }
  catch (e: any) { MessagePlugin.error(e?.response?.data?.message || '添加失败') }
  finally { noteLoading.value = false }
}

const removeNote = async (noteId: number) => {
  try { await del('/admin/crm/users/' + userId + '/notes/' + noteId); MessagePlugin.success('备注已删除'); fetchDetail() }
  catch (e: any) { MessagePlugin.error(e?.response?.data?.message || '删除失败') }
}

// Type management
const startEditType = () => { selectedType.value = data.value?.identityType || '未设置'; editingType.value = true }
const cancelEditType = () => { editingType.value = false }
const saveType = async () => {
  typeLoading.value = true
  try {
    await patch('/admin/crm/users/' + userId + '/type', { identityType: selectedType.value === '未设置' ? '' : selectedType.value })
    MessagePlugin.success('类型已更新'); editingType.value = false; fetchDetail()
  } catch (e: any) { MessagePlugin.error(e?.response?.data?.message || '更新失败') }
  finally { typeLoading.value = false }
}

const showCert = (cert: any) => {
  certName.value = cert?.name || '证书'; certImage.value = cert?.imageUrl || ''
  if (!certImage.value) { MessagePlugin.warning('暂无证书图片'); return }
  certDialog.value = true
}

const goUser = (uid: string) => { if (uid) router.push('/crm/users/' + uid) }

const yuan = (n: number) => '¥' + (n || 0).toFixed(2)
const fmt = (s: string) => s ? new Date(s).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-'
const fmtFull = (s: string | null) => s ? new Date(s).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-'
const copyUserId = () => {
  if (!data.value?.userId) return
  navigator.clipboard.writeText(data.value.userId).then(() => {
    MessagePlugin.success('用户ID已复制')
  }).catch(() => {
    MessagePlugin.error('复制失败，请手动复制')
  })
}
const statusLabel = (s: string) => ({ REGISTERED: '已报名', PAID: '已支付', CHECKED_IN: '已签到', EXPIRED: '已过期' } as any)[s] || s
const orderStatusLabel = (s: string) => ({ PENDING: '交易处理中', PAID: '已支付', FAILED: '支付失败', REFUNDED: '已退款', PARTIAL_REFUND: '部分退款' } as any)[s] || s
const refundStatusLabel = (s: string) => ({ SUCCESS: '成功', FAILED: '失败' } as any)[s] || s
const invoiceStatusLabel = (s: string) => ({ REQUESTED: '已申请', ISSUED: '已开具', CANCELED: '已取消' } as any)[s] || s
const genderLabel = (g: string) => ({ unknown: '未设置', '男': '男', '女': '女' } as any)[g] || g
const statusColor = (s: string) => ({ PAID: '#2E7D5A', CHECKED_IN: '#2E7D5A', REFUNDED: '#8A9288', PARTIAL_REFUND: '#C98255', PENDING: '#8A9288', FAILED: '#B35B4B', REGISTERED: '#8A9288', EXPIRED: '#8A9288' } as any)[s] || '#666'

const regColumns = [
  { colKey: 'id', title: 'ID', width: 55 },
  { colKey: 'activityTitle', title: '活动名称', width: 140, cell: (_h: any, { row }: any) => row.activityTitle || '-' },
  { colKey: 'city', title: '城市', width: 70, cell: (_h: any, { row }: any) => row.city || '-' },
  { colKey: 'status', title: '状态', width: 80 },
  { colKey: 'createdAt', title: '时间', width: 130, cell: (_h: any, { row }: any) => fmt(row.createdAt) },
  { colKey: 'certificate', title: '证书', width: 120 },
  { colKey: 'inviter', title: '邀请人', width: 100 },
]
const orderColumns = [
  { colKey: 'id', title: 'ID', width: 55 }, { colKey: 'activityId', title: '活动', width: 55 },
  { colKey: 'amount', title: '金额', width: 85, cell: (_h: any, { row }: any) => yuan(row.amount) },
  { colKey: 'status', title: '状态', width: 90 }, { colKey: 'createdAt', title: '时间', width: 130, cell: (_h: any, { row }: any) => fmt(row.createdAt) },
]
const refundColumns = [
  { colKey: 'id', title: 'ID', width: 55 }, { colKey: 'orderId', title: '订单', width: 55 },
  { colKey: 'amount', title: '金额', width: 85, cell: (_h: any, { row }: any) => yuan(row.amount) },
  { colKey: 'status', title: '状态', width: 60 }, { colKey: 'reason', title: '原因', width: 110, cell: (_h: any, { row }: any) => row.reason || '-' },
  { colKey: 'createdAt', title: '时间', width: 130, cell: (_h: any, { row }: any) => fmt(row.createdAt) },
]
const invoiceColumns = [
  { colKey: 'id', title: 'ID', width: 55 }, { colKey: 'title', title: '抬头', width: 150 },
  { colKey: 'amount', title: '金额', width: 85, cell: (_h: any, { row }: any) => yuan(row.amount) },
  { colKey: 'status', title: '状态', width: 70 }, { colKey: 'createdAt', title: '时间', width: 130, cell: (_h: any, { row }: any) => fmt(row.createdAt) },
]
const inviteRegColumns = [
  { colKey: 'inviteeUserId', title: '被邀请用户', width: 130 },
  { colKey: 'createdAt', title: '邀请时间', width: 140, cell: (_h: any, { row }: any) => fmt(row.createdAt) },
]
const inviteActColumns = [
  { colKey: 'activityId', title: '活动', width: 70, cell: (_h: any, { row }: any) => row.activityTitle || row.activityId || '-' },
  { colKey: 'inviteeUserId', title: '被邀请用户', width: 120 },
  { colKey: 'createdAt', title: '邀请时间', width: 140, cell: (_h: any, { row }: any) => fmt(row.createdAt) },
]

onMounted(fetchDetail)
</script>

<template>
  <div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
      <div style="display: flex; align-items: center; gap: 12px;">
        <t-button theme="default" variant="text" @click="router.push('/crm/users')" style="font-size: 18px;">←</t-button>
        <h2 style="font-size: 24px; font-weight: 700; color: #18231E; margin: 0;">用户详情</h2>
      </div>
    </div>

    <t-loading :loading="loading" v-if="!data">
      <div style="padding: 60px; text-align: center; color: #8A9288;">加载中...</div>
    </t-loading>

    <template v-if="data">
      <!-- User Info Card -->
      <div style="background: #FFFFFF; border-radius: 12px; border: 1px solid #EDE9DF; padding: 24px; margin-bottom: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div style="display: flex; align-items: flex-start; gap: 16px;">
            <div style="width: 64px; height: 64px; border-radius: 50%; background: #EEF5EF; overflow: hidden; flex-shrink: 0; display: flex; align-items: center; justify-content: center;">
              <img v-if="data.avatarUrl" :src="assetUrl(data.avatarUrl)" style="width:100%;height:100%;object-fit:cover;" />
              <span v-else style="font-size: 24px; color: #A6AAA2;">-</span>
            </div>
            <div>
              <h3 style="font-size: 18px; font-weight: 600; color: #18231E; margin: 0 0 8px 0;">{{ data.nickname || '-' }}</h3>
              <div style="color: #8A9288; font-size: 13px; line-height: 1.9; display: grid; grid-template-columns: 80px 1fr; gap: 2px 12px;">
                <span>用户ID:</span><span>{{ data.userId }} <t-button theme="default" variant="text" size="small" @click="copyUserId" style="font-size:12px;color:#2E7D5A;padding:0 4px;min-width:auto;">复制</t-button></span>
                <span>性别:</span><span>{{ genderLabel(data.gender) }}</span>
                <span>手机号:</span><span>{{ data.phone || '-' }}</span>
                <span>出生年月:</span><span>{{ data.birthYearMonth || '-' }}</span>
                <span>年龄:</span><span>{{ data.age !== null ? data.age : '-' }}</span>
                <span>类型:</span>
                <span>
                  <template v-if="editingType">
                    <t-select v-model="selectedType" size="small" style="width: 120px;">
                      <t-option v-for="opt in TYPE_OPTIONS" :key="opt" :value="opt" :label="opt" />
                      <t-option value="未设置" label="未设置" />
                    </t-select>
                    <t-button theme="primary" size="small" :loading="typeLoading" @click="saveType" style="margin-left: 8px;">保存</t-button>
                    <t-button theme="default" size="small" @click="cancelEditType" style="margin-left: 4px;">取消</t-button>
                  </template>
                  <template v-else>
                    <span>{{ data.identityType || '未设置' }}</span>
                    <t-button theme="default" variant="text" size="small" @click="startEditType" style="margin-left: 6px; font-size: 12px; color: #2E7D5A;">编辑</t-button>
                  </template>
                </span>
                <span>注册时间:</span><span>{{ fmtFull(data.registeredAt) }}</span>
                <span>最近登录:</span><span>{{ fmtFull(data.lastLoginAt) }}</span>
              </div>
            </div>
          </div>
          <div style="display: flex; flex-wrap: wrap; gap: 6px; max-width: 300px;">
            <t-tag v-for="tag in data.tags" :key="tag.id" theme="primary" variant="light" closable @close="removeTag(tag.id)">{{ tag.tag }}</t-tag>
            <span v-if="!data.tags.length" style="color: #8A9288; font-size: 13px;">-</span>
          </div>
        </div>
      </div>

      <!-- Stats Cards -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 12px; margin-bottom: 16px;">
        <div style="background: #FFFFFF; border-radius: 10px; border: 1px solid #EDE9DF; padding: 16px;">
          <div style="color: #8A9288; font-size: 12px;">报名次数</div><div style="color: #18231E; font-size: 24px; font-weight: 700;">{{ data.summary.registrationCount }}</div>
        </div>
        <div style="background: #FFFFFF; border-radius: 10px; border: 1px solid #EDE9DF; padding: 16px;">
          <div style="color: #8A9288; font-size: 12px;">订单数</div><div style="color: #18231E; font-size: 24px; font-weight: 700;">{{ data.summary.orderCount }}</div>
        </div>
        <div style="background: #FFFFFF; border-radius: 10px; border: 1px solid #EDE9DF; padding: 16px;">
          <div style="color: #8A9288; font-size: 12px;">签到次数</div><div style="color: #18231E; font-size: 24px; font-weight: 700;">{{ data.summary.checkedInCount }}</div>
        </div>
        <div style="background: #FFFFFF; border-radius: 10px; border: 1px solid #EDE9DF; padding: 16px;">
          <div style="color: #8A9288; font-size: 12px;">累计支付</div><div style="color: #2E7D5A; font-size: 16px; font-weight: 700;">{{ yuan(data.summary.paidAmount) }}</div>
        </div>
        <div style="background: #FFFFFF; border-radius: 10px; border: 1px solid #EDE9DF; padding: 16px;">
          <div style="color: #8A9288; font-size: 12px;">累计退款</div><div style="color: #B35B4B; font-size: 16px; font-weight: 700;">{{ yuan(data.summary.refundedAmount) }}</div>
        </div>
        <div style="background: #FFFFFF; border-radius: 10px; border: 1px solid #EDE9DF; padding: 16px;">
          <div style="color: #8A9288; font-size: 12px;">净收入</div><div style="color: #18231E; font-size: 16px; font-weight: 700;">{{ yuan(data.summary.netAmount) }}</div>
        </div>
        <div style="background: #FFFFFF; border-radius: 10px; border: 1px solid #EDE9DF; padding: 16px;">
          <div style="color: #8A9288; font-size: 12px;">邀请注册</div><div style="color: #18231E; font-size: 24px; font-weight: 700;">{{ data.summary.inviteRegisterCount ?? 0 }}</div>
        </div>
        <div style="background: #FFFFFF; border-radius: 10px; border: 1px solid #EDE9DF; padding: 16px;">
          <div style="color: #8A9288; font-size: 12px;">邀请活动</div><div style="color: #18231E; font-size: 24px; font-weight: 700;">{{ data.summary.inviteActivityCount ?? 0 }}</div>
        </div>
      </div>

      <!-- Tag Management -->
      <div style="background: #FFFFFF; border-radius: 12px; border: 1px solid #EDE9DF; padding: 20px; margin-bottom: 16px;">
        <h3 style="font-size: 16px; font-weight: 600; color: #18231E; margin: 0 0 12px 0;">标签管理</h3>
        <div style="display: flex; gap: 10px;">
          <t-input v-model="newTag" placeholder="输入标签名（最多50字）" style="width: 240px;" maxlength="50" @enter="addTag" />
          <t-button theme="primary" :loading="tagLoading" @click="addTag">添加标签</t-button>
        </div>
      </div>

      <!-- Note Management -->
      <div style="background: #FFFFFF; border-radius: 12px; border: 1px solid #EDE9DF; padding: 20px; margin-bottom: 16px;">
        <h3 style="font-size: 16px; font-weight: 600; color: #18231E; margin: 0 0 12px 0;">备注管理</h3>
        <div style="display: flex; gap: 10px; margin-bottom: 12px;">
          <t-textarea v-model="newNote" placeholder="输入备注" :autosize="{ minRows: 2, maxRows: 4 }" style="flex: 1;" />
          <t-button theme="primary" :loading="noteLoading" @click="addNote" style="align-self: flex-end;">添加备注</t-button>
        </div>
        <div v-if="data.notes.length">
          <div v-for="note in data.notes" :key="note.id" style="padding: 10px 14px; background: #F7F6F2; border-radius: 8px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: flex-start;">
            <div style="flex: 1;"><div style="color: #18231E; font-size: 14px; white-space: pre-wrap;">{{ note.note }}</div><div style="color: #8A9288; font-size: 12px; margin-top: 4px;">{{ fmt(note.createdAt) }}</div></div>
            <t-button theme="default" variant="text" size="small" style="color: #B35B4B;" @click="removeNote(note.id)">删除</t-button>
          </div>
        </div>
        <div v-else style="color: #8A9288; font-size: 13px; text-align: center; padding: 12px 0;">暂无备注</div>
      </div>

      <!-- Registrations / Orders / Refunds / Invoices / Invites — same as before -->
      <div style="background: #FFFFFF; border-radius: 12px; border: 1px solid #EDE9DF; padding: 20px; margin-bottom: 16px;">
        <h3 style="font-size: 16px; font-weight: 600; color: #18231E; margin: 0 0 12px 0;">报名记录</h3>
        <t-table v-if="data.registrations.length" :data="data.registrations" :columns="regColumns" row-key="id" size="small" hover stripe>
          <template #status="{ row }"><span :style="{ color: statusColor(row.status), fontSize: '13px', fontWeight: 500 }">{{ statusLabel(row.status) }}</span></template>
          <template #certificate="{ row }"><span v-if="row.certificate" style="color:#2E7D5A;cursor:pointer;text-decoration:underline;" @click="showCert(row.certificate)">{{ row.certificate.name || '证书' }}</span><span v-else style="color:#8A9288;">-</span></template>
          <template #inviter="{ row }"><span v-if="row.inviter" style="color:#2E7D5A;cursor:pointer;" @click="goUser(row.inviter.userId)">{{ row.inviter.name || row.inviter.userId }}</span><span v-else style="color:#8A9288;">-</span></template>
        </t-table>
        <div v-else style="color: #8A9288; font-size: 13px; text-align: center; padding: 20px 0;">暂无报名记录</div>
      </div>

      <div style="background: #FFFFFF; border-radius: 12px; border: 1px solid #EDE9DF; padding: 20px; margin-bottom: 16px;">
        <h3 style="font-size: 16px; font-weight: 600; color: #18231E; margin: 0 0 12px 0;">订单记录</h3>
        <t-table v-if="data.orders.length" :data="data.orders" :columns="orderColumns" row-key="id" size="small" hover stripe>
          <template #status="{ row }"><span :style="{ color: statusColor(row.status), fontSize: '13px', fontWeight: 500 }">{{ orderStatusLabel(row.status) }}</span></template>
        </t-table>
        <div v-else style="color: #8A9288; font-size: 13px; text-align: center; padding: 20px 0;">暂无订单记录</div>
      </div>

      <div style="background: #FFFFFF; border-radius: 12px; border: 1px solid #EDE9DF; padding: 20px; margin-bottom: 16px;">
        <h3 style="font-size: 16px; font-weight: 600; color: #18231E; margin: 0 0 12px 0;">退款记录</h3>
        <t-table v-if="data.refunds.length" :data="data.refunds" :columns="refundColumns" row-key="id" size="small" hover stripe>
          <template #status="{ row }"><span :style="{ color: statusColor(row.status), fontSize: '13px', fontWeight: 500 }">{{ refundStatusLabel(row.status) }}</span></template>
        </t-table>
        <div v-else style="color: #8A9288; font-size: 13px; text-align: center; padding: 20px 0;">暂无退款记录</div>
      </div>

      <div style="background: #FFFFFF; border-radius: 12px; border: 1px solid #EDE9DF; padding: 20px; margin-bottom: 16px;">
        <h3 style="font-size: 16px; font-weight: 600; color: #18231E; margin: 0 0 12px 0;">发票记录</h3>
        <t-table v-if="data.invoices.length" :data="data.invoices" :columns="invoiceColumns" row-key="id" size="small" hover stripe>
          <template #status="{ row }"><span :style="{ color: statusColor(row.status), fontSize: '13px', fontWeight: 500 }">{{ invoiceStatusLabel(row.status) }}</span></template>
        </t-table>
        <div v-else style="color: #8A9288; font-size: 13px; text-align: center; padding: 20px 0;">暂无发票记录</div>
      </div>

      <div style="background: #FFFFFF; border-radius: 12px; border: 1px solid #EDE9DF; padding: 20px; margin-bottom: 16px;">
        <h3 style="font-size: 16px; font-weight: 600; color: #18231E; margin: 0 0 12px 0;">邀请注册记录</h3>
        <t-table v-if="data.inviteRecords.length" :data="data.inviteRecords" :columns="inviteRegColumns" row-key="id" size="small" hover stripe>
          <template #inviteeUserId="{ row }"><span style="color:#2E7D5A;cursor:pointer;" @click="goUser(row.inviteeUserId)">{{ row.inviteeName || row.inviteeUserId }}</span></template>
        </t-table>
        <div v-else style="color: #8A9288; font-size: 13px; text-align: center; padding: 20px 0;">暂无邀请注册记录</div>
      </div>

      <div style="background: #FFFFFF; border-radius: 12px; border: 1px solid #EDE9DF; padding: 20px; margin-bottom: 16px;">
        <h3 style="font-size: 16px; font-weight: 600; color: #18231E; margin: 0 0 12px 0;">活动邀请记录</h3>
        <t-table v-if="data.activityInviteRecords.length" :data="data.activityInviteRecords" :columns="inviteActColumns" row-key="id" size="small" hover stripe>
          <template #inviteeUserId="{ row }"><span style="color:#2E7D5A;cursor:pointer;" @click="goUser(row.inviteeUserId)">{{ row.inviteeName || row.inviteeUserId }}</span></template>
        </t-table>
        <div v-else style="color: #8A9288; font-size: 13px; text-align: center; padding: 20px 0;">暂无活动邀请记录</div>
      </div>

      <!-- Certificate Image Dialog -->
      <t-dialog v-model:visible="certDialog" :header="certName" width="520px" :footer="false">
        <img v-if="certImage" :src="certImage" alt="证书" style="width: 100%; border-radius: 8px;" />
        <div v-else style="padding: 40px; text-align: center; color: #8A9288;">暂无证书图片</div>
      </t-dialog>
    </template>
  </div>
</template>
