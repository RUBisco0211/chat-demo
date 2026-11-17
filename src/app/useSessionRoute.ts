import { useEffect, useRef } from 'react'
import {
  onSessionRouteChange,
  sessionIdFromLocation,
  writeSessionRoute,
} from '../services/chat/route.js'
import { newChat, selectSession, useChatStore } from '../services/chat/store.js'

/**
 * 会话地址与界面双向同步：
 * - 启动后按地址打开对应会话；地址里的会话不存在时回到新对话并修正地址
 * - 会话切换后写回地址，浏览器前进后退跟随
 */
export const useSessionRoute = () => {
  const ready = useChatStore((state) => state.ready)
  const activeId = useChatStore((state) => state.activeId)
  // 首次就绪只做「地址 → 界面」，之后才让界面写回地址，避免覆盖深链接
  const adopted = useRef(false)

  useEffect(() => {
    if (!ready) {
      return
    }
    if (!adopted.current) {
      adopted.current = true
      const id = sessionIdFromLocation()
      if (id !== null) {
        if (useChatStore.getState().sessions.some((session) => session.id === id)) {
          selectSession(id)
        } else {
          writeSessionRoute(null, true)
        }
        return
      }
    }
    writeSessionRoute(activeId)
  }, [ready, activeId])

  useEffect(() => {
    if (!ready) {
      return
    }
    return onSessionRouteChange(() => {
      const id = sessionIdFromLocation()
      const { activeId: current, sessions } = useChatStore.getState()
      if (id === null) {
        if (current !== null) {
          newChat()
        }
        return
      }
      if (sessions.some((session) => session.id === id)) {
        selectSession(id)
      } else {
        writeSessionRoute(current, true)
      }
    })
  }, [ready])
}
