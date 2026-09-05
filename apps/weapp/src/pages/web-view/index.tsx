import { WebView } from '@tarojs/components'
import { useRouter } from '@tarojs/taro'

export default function BrandWebView() {
  const router = useRouter()
  const url = decodeURIComponent(String(router.params?.url || ''))
  return <WebView src={url} />
}
