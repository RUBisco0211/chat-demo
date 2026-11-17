import clsx from 'clsx'
import { useEffect, useRef, useState } from 'react'
import { useTranslate } from '../../i18n/index.js'
import styles from './MessageNav.module.css'

/** 快速定位项：只包含用户提问 */
export type MessageNavItem = { id: string; text: string }

/** 提问顶部进入距视口顶部该距离内，即视为当前提问 */
const ACTIVE_OFFSET = 96

/** 点击刻度后提问距视口顶部的留白 */
const JUMP_OFFSET = 24

const findMessage = (root: HTMLElement, id: string) =>
  root.querySelector<HTMLElement>(`[data-message-id="${CSS.escape(id)}"]`)

/** 会话页右侧的提问快速定位：每条刻度对应一个用户提问，悬停展开文本，点击滚动到该提问 */
export const MessageNav = ({
  items,
  scrollRef,
}: {
  items: MessageNavItem[]
  scrollRef: React.RefObject<HTMLDivElement>
}) => {
  const t = useTranslate()
  const [activeId, setActiveId] = useState<string | null>(items[0]?.id ?? null)
  const itemsRef = useRef(items)
  itemsRef.current = items
  // 流式回答会频繁重渲染，只在提问集合变化时重新绑定滚动监听
  const ids = items.map((item) => item.id).join()

  useEffect(() => {
    const root = scrollRef.current
    if (!root) {
      return
    }
    const update = () => {
      const last = itemsRef.current.at(-1)?.id ?? null
      // 已经在底部时高亮最后一个提问，否则正文末尾几屏会一直停在前一个刻度
      if (root.scrollHeight - root.scrollTop - root.clientHeight <= 4) {
        setActiveId(last)
        return
      }
      const top = root.getBoundingClientRect().top
      let current = itemsRef.current[0]?.id ?? null
      for (const item of itemsRef.current) {
        const element = findMessage(root, item.id)
        if (!element) {
          continue
        }
        if (element.getBoundingClientRect().top - top <= ACTIVE_OFFSET) {
          current = item.id
        } else {
          break
        }
      }
      setActiveId(current)
    }
    update()
    root.addEventListener('scroll', update, { passive: true })
    return () => root.removeEventListener('scroll', update)
  }, [ids, scrollRef])

  if (items.length < 2) {
    return null
  }

  const jump = (id: string) => {
    const root = scrollRef.current
    const element = root ? findMessage(root, id) : null
    if (!root || !element) {
      return
    }
    const top =
      element.getBoundingClientRect().top - root.getBoundingClientRect().top + root.scrollTop
    root.scrollTo({ top: Math.max(top - JUMP_OFFSET, 0), behavior: 'smooth' })
    setActiveId(id)
  }

  return (
    <nav className={styles.nav} aria-label={t('messageNavLabel')}>
      <ol className={styles.list}>
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              className={clsx(styles.entry, item.id === activeId && styles.active)}
              title={item.text}
              onClick={() => jump(item.id)}
            >
              <span className={styles.label}>{item.text}</span>
              <span className={styles.mark} />
            </button>
          </li>
        ))}
      </ol>
    </nav>
  )
}
