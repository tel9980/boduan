import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'

describe('测试环境', () => {
  it('Vitest 应该正常工作', () => {
    expect(true).toBe(true)
  })

  it('renderHook 应该正常工作', () => {
    const { result } = renderHook(() => ({ value: 42 }))
    expect(result.current.value).toBe(42)
  })

  it('localStorage mock 应该已设置', () => {
    expect(window.localStorage).toBeDefined()
    expect(typeof window.localStorage.getItem).toBe('function')
  })

  it('matchMedia mock 应该已设置', () => {
    expect(typeof window.matchMedia).toBe('function')
    const result = window.matchMedia('(prefers-color-scheme: dark)')
    expect(result.matches).toBe(false)
  })
})
