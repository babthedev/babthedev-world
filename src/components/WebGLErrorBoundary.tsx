'use client'

import React, { Component, ReactNode, ErrorInfo } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  errorMessage: string
}

/**
 * Global WebGL Error Boundary with warm-paper brutalist fallback (Q148).
 * Catches GPU crashes, shader compile failures, and WebGL context aborts.
 */
export default class WebGLErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, errorMessage: '' }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error.message || 'An unexpected graphics error occurred.',
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('WebGL Canvas Error Boundary caught:', error, errorInfo)
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#F2F1EC] px-6 text-black">
          <div className="max-w-md w-full border-2 border-black bg-white p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] select-none">
            <div className="font-mono text-xs text-black/40 uppercase tracking-widest mb-2 font-bold">
              [ ERROR 0x3D ] GRAPHICS INTERRUPTION
            </div>
            <h2 className="font-serif text-2xl font-bold mb-3 tracking-tight">
              3D Display Suspended
            </h2>
            <p className="font-mono text-xs text-black/70 leading-relaxed mb-6">
              Your browser or graphics hardware could not render the 3D world. Everything here is also available to read as text.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 font-mono text-xs">
              <button
                onClick={this.handleReload}
                className="flex-1 border-2 border-black bg-black text-white py-2.5 px-4 font-bold hover:bg-white hover:text-black transition-colors"
              >
                RELOAD WORLD
              </button>
              <a
                href="/reader"
                className="flex-1 border-2 border-black text-center py-2.5 px-4 hover:bg-black hover:text-white transition-colors"
              >
                READ AS TEXT
              </a>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
