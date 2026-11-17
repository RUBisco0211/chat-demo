/** 会话地址：/chat/<sessionId>；根路径表示新对话。file:// 下没有可用的 History API，路由整体关闭。 */

const PREFIX = '/chat/'

const enabled = () => typeof location !== 'undefined' && location.protocol !== 'file:'

/** 从当前地址解析会话 id；不在会话地址上时返回 null */
export const sessionIdFromLocation = (): string | null => {
  if (!enabled()) {
    return null
  }
  const { pathname } = location
  if (!pathname.startsWith(PREFIX)) {
    return null
  }
  const raw = pathname.slice(PREFIX.length).split('/')[0]
  if (!raw) {
    return null
  }
  try {
    return decodeURIComponent(raw)
  } catch {
    return null
  }
}

/** 写入会话地址；replace 用于修正无效地址，避免留下无法返回的历史记录 */
export const writeSessionRoute = (id: string | null, replace = false) => {
  if (!enabled()) {
    return
  }
  const path = id === null ? '/' : `${PREFIX}${encodeURIComponent(id)}`
  if (location.pathname === path) {
    return
  }
  if (replace) {
    history.replaceState(null, '', path)
  } else {
    history.pushState(null, '', path)
  }
}

/** 浏览器前进后退时通知界面；返回取消订阅的函数 */
export const onSessionRouteChange = (listener: () => void) => {
  if (!enabled()) {
    return () => {}
  }
  window.addEventListener('popstate', listener)
  return () => window.removeEventListener('popstate', listener)
}
